// Renders public/og.jpg (1200x630) for link previews. Run with `npm run og`.
// The key art in scripts/og-art was painted once by gpt-image-2.5-sunburst
// from the village and the eight character sprites (prompt alongside it);
// this script sets the wordmark, tagline and a belief-cell motif on a paper
// band in the game's own type, so the words are never left to the model.

import { Resvg } from "@resvg/resvg-js";
import jpeg from "jpeg-js";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = path.join(root, "node_modules", ".cache", "og-fonts");
const out = path.join(root, "public", "og.jpg");
const art = path.join(root, "scripts", "og-art", "keyart.jpg");

const FONTS = [
  ["IBMPlexMono-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-Regular.ttf"],
  ["IBMPlexMono-SemiBold.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-SemiBold.ttf"],
  ["XanhMono-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/xanhmono/XanhMono-Regular.ttf"],
];

async function fonts() {
  await mkdir(cache, { recursive: true });
  const files = [];
  for (const [name, url] of FONTS) {
    const file = path.join(cache, name);
    if (!existsSync(file)) {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`font download failed: ${url} (${r.status})`);
      await writeFile(file, Buffer.from(await r.arrayBuffer()));
    }
    files.push(file);
  }
  return files;
}

const W = 1200;
const H = 630;
const BAND = 138;
const C = {
  paper: "#f3f4f1",
  sheet: "#ffffff",
  ink: "#1b1d1a",
  ink2: "#5b6058",
  ink3: "#8a9086",
  rule: "#d9dcd5",
  error: "#b42318",
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function mono(x, y, text, fill = C.ink, size = 18, weight = 400, anchor = "start") {
  return `<text x="${x}" y="${y}" font-family="IBM Plex Mono" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" xml:space="preserve">${esc(text)}</text>`;
}

/** Mix the error red into white by p, like the board's color-mix. */
function cellColor(p) {
  const k = Math.min(1, p) * 0.88;
  const mix = (a, b) => Math.round(a + (b - a) * k);
  return `rgb(${mix(255, 0xb4)},${mix(255, 0x23)},${mix(255, 0x18)})`;
}

/** Three cells from the board: how the table feels about you, with the last change. */
function cells(x, y) {
  const data = [
    ["Mara", 0.62, "+.24"],
    ["Bel", 0.71, "+.31"],
    ["Sol", 0.5, "+.09"],
  ];
  const size = 62;
  let s = "";
  data.forEach(([name, v, d], i) => {
    const cx = x + i * (size + 4);
    const hot = v >= 0.55;
    s += `<rect x="${cx}" y="${y}" width="${size}" height="${size}" fill="${cellColor(v)}" stroke="${C.rule}"/>`;
    s += mono(cx + size / 2, y + 30, `.${Math.round(v * 100)}`, hot ? "#fff" : C.ink, 20, 600, "middle");
    s += mono(cx + size / 2, y + 48, d, hot ? "rgba(255,255,255,0.85)" : C.error, 12, 400, "middle");
    s += mono(cx + size / 2, y + size + 17, name, C.ink2, 12, 400, "middle");
  });
  return s;
}

async function main() {
  const jpg = await readFile(art);
  const href = `data:image/jpeg;base64,${jpg.toString("base64")}`;
  const bandY = H - BAND;
  const base = bandY + 86;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <image href="${href}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
  <rect x="0" y="${bandY}" width="${W}" height="${BAND}" fill="${C.paper}"/>
  <rect x="0" y="${bandY}" width="${W}" height="2" fill="${C.ink}"/>
  <text x="44" y="${base}" font-family="Xanh Mono" font-size="66" fill="${C.ink}" letter-spacing="-1">werewolf</text>
  ${mono(372, base - 30, "Seven villagers. Two wolves.", C.ink, 21, 600)}
  ${mono(372, base + 2, "Every word you type is measured.", C.ink, 21)}
  ${mono(372, base + 34, "Suspicion is a calibrated probability from TypeSafe Jev; watch it move as you speak.", C.ink2, 13)}
  ${cells(W - 44 - 3 * 62 - 8, bandY + 22)}
  ${mono(W - 44, bandY + 22 - 6, "suspicion of you", C.ink3, 12, 400, "end")}
</svg>`;

  const fontFiles = await fonts();
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: W },
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: "IBM Plex Mono" },
  });
  const image = resvg.render();
  // JPEG keeps the painted card under 400 KB; a PNG of it is over a megabyte.
  const { data } = jpeg.encode({ data: Buffer.from(image.pixels), width: image.width, height: image.height }, 88);
  await writeFile(out, data);
  await writeFile(path.join(cache, "og.svg"), svg);
  console.log(`wrote ${path.relative(root, out)} (${data.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
