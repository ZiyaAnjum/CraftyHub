import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.resolve(__dirname, '../public/icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// CRC32 implementation for PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function createPng(size, isMaskable = false) {
  const width = size;
  const height = size;

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw uncompressed image scanlines
  // Each line has 1 filter byte (0) + width * 4 bytes (RGBA)
  const rawBytes = Buffer.alloc(height * (1 + width * 4));
  const cx = width / 2;
  const cy = height / 2;
  const radius = isMaskable ? width * 0.48 : width * 0.44;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawBytes[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background: Warm Rose/Gold gradient or pure circle
      let r = 184, g = 93, b = 104, a = 255; // #b85d68 Blush

      if (!isMaskable && dist > radius) {
        // Transparent outside circle
        r = 0; g = 0; b = 0; a = 0;
      } else {
        // Inner gift emblem
        const boxSize = size * 0.42;
        const inBox = Math.abs(dx) <= boxSize / 2 && Math.abs(dy) <= boxSize / 2;
        const ribbonWidth = size * 0.08;
        const inRibbonX = inBox && Math.abs(dx) <= ribbonWidth / 2;
        const inRibbonY = inBox && Math.abs(dy) <= ribbonWidth / 2;

        if (inRibbonX || inRibbonY) {
          // Gold ribbon #d4af37
          r = 212; g = 175; b = 55;
        } else if (inBox) {
          // Inner cream box #fff5f7
          r = 255; g = 245; b = 247;
        } else {
          // Outer background gradient
          const factor = Math.min(1, dist / radius);
          r = Math.round(184 * (1 - factor * 0.2));
          g = Math.round(93 * (1 - factor * 0.2));
          b = Math.round(104 * (1 - factor * 0.2));
        }
      }

      rawBytes[offset++] = r;
      rawBytes[offset++] = g;
      rawBytes[offset++] = b;
      rawBytes[offset++] = a;
    }
  }

  const idatData = zlib.deflateSync(rawBytes, { level: 9 });
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  return Buffer.concat([
    pngSignature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idatData),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Generate PNGs
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPng(192, false));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPng(512, false));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-192.png'), createPng(192, true));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), createPng(512, true));

// Generate SVG Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b85d68" />
      <stop offset="100%" stop-color="#8a3b45" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f3d078" />
      <stop offset="100%" stop-color="#d4af37" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)" />
  <rect x="140" y="160" width="232" height="232" rx="24" fill="#fff5f7" />
  <rect x="236" y="160" width="40" height="232" fill="url(#goldGrad)" />
  <rect x="140" y="256" width="232" height="40" fill="url(#goldGrad)" />
  <!-- Bow -->
  <path d="M 216 160 C 180 110, 160 140, 236 160 Z" fill="url(#goldGrad)" />
  <path d="M 296 160 C 332 110, 352 140, 276 160 Z" fill="url(#goldGrad)" />
  <circle cx="256" cy="160" r="16" fill="#f3d078" />
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent, 'utf8');
console.log('PWA icons successfully generated in frontend/public/icons/');
