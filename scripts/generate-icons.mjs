import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const byte of buf) {
    crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createIcon(size) {
  const w = size, h = size;

  // Icon design: purple gradient background + white "+" cross
  const bg = { r: 124, g: 58, b: 237 }; // #7c3aed
  const white = { r: 255, g: 255, b: 255 };

  const crossThickness = Math.round(w * 0.14);
  const crossReach = Math.round(w * 0.28);
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);

  const rowSize = 1 + w * 4;
  const rawData = Buffer.alloc(h * rowSize);

  for (let y = 0; y < h; y++) {
    rawData[y * rowSize] = 0; // filter: None
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dy = y - cy;

      // Cross shape
      const inHBar = Math.abs(dy) <= crossThickness / 2 && Math.abs(dx) <= crossReach;
      const inVBar = Math.abs(dx) <= crossThickness / 2 && Math.abs(dy) <= crossReach;

      const pixel = (inHBar || inVBar) ? white : bg;

      const i = y * rowSize + 1 + x * 4;
      rawData[i]     = pixel.r;
      rawData[i + 1] = pixel.g;
      rawData[i + 2] = pixel.b;
      rawData[i + 3] = 255;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

const publicDir = path.join(__dirname, '..', 'public');

fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createIcon(180));
console.log('✓ apple-touch-icon.png (180x180)');

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createIcon(192));
console.log('✓ icon-192.png (192x192)');

fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createIcon(512));
console.log('✓ icon-512.png (512x512)');

console.log('Icons generated successfully!');
