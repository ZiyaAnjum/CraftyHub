import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSafeNextPath } from './safeNext';

describe('getSafeNextPath', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Set a known window.location.origin in jsdom
    delete window.location;
    window.location = new URL('http://localhost:5173');
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('allows safe relative paths to pass through unchanged', () => {
    expect(getSafeNextPath('/orders')).toBe('/orders');
    expect(getSafeNextPath('/create?x=1')).toBe('/create?x=1');
  });

  it('returns "/" for malicious or external redirect targets', () => {
    expect(getSafeNextPath('//evil.com')).toBe('/');
    expect(getSafeNextPath('/\\evil.com')).toBe('/');
    expect(getSafeNextPath('/\t/evil.com')).toBe('/');
    expect(getSafeNextPath('https://evil.com')).toBe('/');
    expect(getSafeNextPath('javascript:alert(1)')).toBe('/');
  });

  it('returns "/" for auth routes to prevent post-login loops', () => {
    expect(getSafeNextPath('/signin')).toBe('/');
    expect(getSafeNextPath('/signup')).toBe('/');
  });

  it('returns "/" for empty, non-string, or invalid inputs', () => {
    expect(getSafeNextPath('')).toBe('/');
    expect(getSafeNextPath(null)).toBe('/');
    expect(getSafeNextPath(undefined)).toBe('/');
    expect(getSafeNextPath(123)).toBe('/');
  });
});
