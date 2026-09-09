// Generates simple solid-color placeholder PWA icons (no image tooling
// available in this environment). Replace public/icons/*.png with real
// artwork before shipping.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Draws a filled square (bg) with a centered rounded "pill" glyph (fg) so the
// icon reads as more than a flat color swatch.
function makePng(size, [bgR, bgG, bgB], [fgR, fgG, fgB]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk("IHDR", ihdrData);

  const pillW = size * 0.5;
  const pillH = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;

  const raw = Buffer.alloc((size * 3 + 1) * size);
  let offset = 0;
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0; // no filter
    for (let x = 0; x < size; x++) {
      const inPill =
        Math.abs(x - cx) <= pillW / 2 && Math.abs(y - cy) <= pillH / 2;
      const [r, g, b] = inPill ? [fgR, fgG, fgB] : [bgR, bgG, bgB];
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
    }
  }

  const idat = chunk("IDAT", deflateSync(raw));
  const iend = chunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

mkdirSync("public/icons", { recursive: true });

const teal = [15, 118, 110];
const white = [255, 255, 255];

writeFileSync("public/icons/icon-192.png", makePng(192, teal, white));
writeFileSync("public/icons/icon-512.png", makePng(512, teal, white));
// Maskable icons must keep content within a safe zone smaller than the
// canvas; a solid background with no glyph near the edges is safest.
writeFileSync("public/icons/icon-maskable-512.png", makePng(512, teal, teal));

console.log("Generated placeholder icons in public/icons/");
