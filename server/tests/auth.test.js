import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { RefreshToken } from '../src/models/RefreshToken.js';
import { connectTestDb, clearTestDb, disconnectTestDb, createTestUser } from './helpers.js';
import { hashToken } from '../src/utils/tokens.js';

describe('Auth Security Tests', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe('Login & 15-Minute Account Lockout (S-04)', () => {
    it('successfully logs in with valid credentials and resets failed login count', async () => {
      const { user, plainPassword } = await createTestUser({ failedLoginCount: 2 });

      const res = await request(app)
        .post('/api/auth/login')
        .set('X-Requested-With', 'fouzas-web')
        .send({
          email: user.email,
          password: plainPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(user.email);

      // Verify cookies set
      const cookies = res.headers['set-cookie'];
      expect(cookies.some((c) => c.startsWith('fc_at='))).toBe(true);
      expect(cookies.some((c) => c.startsWith('fc_rt='))).toBe(true);

      // Verify database updated failedLoginCount to 0
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.failedLoginCount).toBe(0);
      expect(updatedUser.lockUntil).toBeNull();
    });

    it('increments failed login count on bad password and locks account after 5 attempts', async () => {
      const { user } = await createTestUser();

      // Send 4 bad attempts
      for (let i = 1; i <= 4; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .set('X-Requested-With', 'fouzas-web')
          .send({
            email: user.email,
            password: 'WrongPassword123!',
          });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid email or password.');

        const dbUser = await User.findById(user._id);
        expect(dbUser.failedLoginCount).toBe(i);
        expect(dbUser.lockUntil).toBeNull();
      }

      // 5th bad attempt triggers the lockout
      const fifthRes = await request(app)
        .post('/api/auth/login')
        .set('X-Requested-With', 'fouzas-web')
        .send({
          email: user.email,
          password: 'WrongPassword123!',
        });

      expect(fifthRes.status).toBe(401);

      const lockedUser = await User.findById(user._id);
      expect(lockedUser.lockUntil).not.toBeNull();
      expect(new Date(lockedUser.lockUntil).getTime()).toBeGreaterThan(Date.now());

      // 6th attempt (even with correct password) must return HTTP 429 lockout error
      const lockedRes = await request(app)
        .post('/api/auth/login')
        .set('X-Requested-With', 'fouzas-web')
        .send({
          email: user.email,
          password: 'SecurePassword123!',
        });

      expect(lockedRes.status).toBe(429);
      expect(lockedRes.body.error).toMatch(/Too many failed attempts\. Please try again in 15 minutes/);
    });
  });

  describe('Refresh Token Rotation & Reuse/Theft Detection (S-02, S-03)', () => {
    it('rotates refresh token on valid refresh request', async () => {
      const { user, plainPassword } = await createTestUser();

      // 1. Initial login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('X-Requested-With', 'fouzas-web')
        .send({
          email: user.email,
          password: plainPassword,
        });

      expect(loginRes.status).toBe(200);
      const cookies = loginRes.headers['set-cookie'];
      const rtCookie = cookies.find((c) => c.startsWith('fc_rt='));
      const rawRt = rtCookie.split(';')[0].split('=')[1];

      // 2. Perform refresh
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('X-Requested-With', 'fouzas-web')
        .set('Cookie', [`fc_rt=${rawRt}`]);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.user).toBeDefined();

      const newCookies = refreshRes.headers['set-cookie'];
      const newRtCookie = newCookies.find((c) => c.startsWith('fc_rt='));
      const newRawRt = newRtCookie.split(';')[0].split('=')[1];

      // Rotated: new token differs from old token
      expect(newRawRt).not.toBe(rawRt);

      // Verify old token in DB is marked revoked
      const oldHash = hashToken(rawRt);
      const oldRecord = await RefreshToken.findOne({ tokenHash: oldHash });
      expect(oldRecord.revokedAt).not.toBeNull();

      // Verify new token in DB is active
      const newHash = hashToken(newRawRt);
      const newRecord = await RefreshToken.findOne({ tokenHash: newHash });
      expect(newRecord.revokedAt).toBeNull();
    });

    it('revokes ALL active sessions for a user if a revoked token is re-presented (theft detection)', async () => {
      const { user } = await createTestUser();

      // Create an older revoked token (simulating a token that was rotated >10s ago)
      const stolenRawToken = 'stolen_refresh_token_1234567890abcdefghijklmnopqrstuv';
      const stolenHash = hashToken(stolenRawToken);
      await RefreshToken.create({
        user: user._id,
        tokenHash: stolenHash,
        revokedAt: new Date(Date.now() - 30_000), // revoked 30 seconds ago (beyond grace period)
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Create two other active sessions for the same user
      const activeRaw1 = 'active_token_one_abcdefghijklmnopqrstuvwxyz123456';
      const activeRaw2 = 'active_token_two_abcdefghijklmnopqrstuvwxyz123456';
      await RefreshToken.create({
        user: user._id,
        tokenHash: hashToken(activeRaw1),
        revokedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await RefreshToken.create({
        user: user._id,
        tokenHash: hashToken(activeRaw2),
        revokedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Attacker attempts to reuse the stolen/revoked token
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('X-Requested-With', 'fouzas-web')
        .set('Cookie', [`fc_rt=${stolenRawToken}`]);

      expect(res.status).toBe(401);

      // Theft detected: All sessions for this user must now be revoked
      const activeCount = await RefreshToken.countDocuments({
        user: user._id,
        revokedAt: null,
      });
      expect(activeCount).toBe(0);
    });
  });
});
