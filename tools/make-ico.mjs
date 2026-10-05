// Packs assets/favicon-32.png + favicon-48.png into favicon.ico (PNG-compressed ICO).
// Run: node tools/make-ico.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sizes = [32, 48];
const pngs = sizes.map((s) => readFileSync(join(ROOT, `assets/favicon-${s}.png`)));

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(sizes.length, 4);

let offset = 6 + 16 * sizes.length;
const entries = sizes.map((s, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(s, 0); e.writeUInt8(s, 1); // width, height
  e.writeUInt8(0, 2); e.writeUInt8(0, 3); // palette, reserved
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); // planes, bpp
  e.writeUInt32LE(pngs[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  return e;
});

writeFileSync(join(ROOT, "favicon.ico"), Buffer.concat([header, ...entries, ...pngs]));
console.log("favicon.ico written");
