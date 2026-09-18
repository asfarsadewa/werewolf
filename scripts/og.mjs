// Renders public/og.png (1200x630) for link previews. Run with `npm run og`.
// Paper, the mono wordmark, a slice of the belief board with real-looking
// numbers, and the table's busts (PNG copies in scripts/og-sprites).

import { Resvg } from "@resvg/resvg-js";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = path.join(root, "node_modules", ".cache", "og-fonts");
const out = path.join(root, "public", "og.png");
const spritesDir = path.join(root, "scripts", "og-sprites");

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

async function sprite(name) {
  const png = await readFile(path.join(spritesDir, `${name}.png`));
  return `data:image/png;base64,${png.toString("base64")}`;
}

const W = 1200;
const H = 630;
const C = {
  paper: "#f3f4f1",
  sheet: "#ffffff",
  ink: "#1b1d1a",
  ink2: "#5b6058",
  ink3: "#8a9086",
  rule: "#d9dcd5",
  rule2: "#eceee9",
  error: "#b42318",
  help: "#1a7f37",
  note: "#175cd3",
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function mono(x, y, text, fill = C.ink, size = 22, weight = 400, anchor = "start") {
  return `<text x="${x}" y="${y}" font-family="IBM Plex Mono" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" xml:space="preserve">${esc(text)}</text>`;
}

/** Mix the error red into white by p, like the board's color-mix. */
function cellColor(p) {
  const k = Math.min(1, p) * 0.88;
  const mix = (a, b) => Math.round(a + (b - a) * k);
  const r = mix(255, 0xb4);
  const g = mix(255, 0x23);
  const b = mix(255, 0x18);
  return `rgb(${r},${g},${b})`;
}

// A believable board mid-game: rows are villagers, columns are players.
const COLS = ["stranger", "mara", "tomas", "bel", "ines", "kip", "rook", "sol"];
const COL_LABEL = ["you", "Mara", "Tomas", "Bel", "Ines", "Kip", "Rook", "Sol"];
const ROWS = ["mara", "tomas", "bel", "rook", "sol"];
const DEAD = new Set(["ines", "kip"]);
const VALUES = {
  mara: [0.62, null, 0.31, 0.22, null, null, 0.41, 0.44],
  tomas: [0.55, 0.38, null, 0.27, null, null, 0.4, 0.4],
  bel: [0.71, 0.29, 0.35, null, null, null, 0.33, 0.32],
  rook: [0.48, 0.33, 0.3, 0.29, null, null, null, 0.6],
  sol: [0.5, 0.36, 0.34, 0.3, null, null, 0.5, null],
};
const DELTA = { "mara:0": "+0.24", "bel:0": "+0.31", "tomas:0": "+0.13", "rook:7": "+0.18", "sol:6": "+0.09", "mara:3": "-0.06" };

async function main() {
  const imgs = Object.fromEntries(await Promise.all([...COLS, "wolf", "seer", "villager"].map(async (n) => [n, await sprite(n)])));

  const boardX = 600;
  const boardY = 112;
  const cell = 58;
  const rowH = 60;
  const headH = 78;
  const labelW = 70;

  let board = "";
  // Column headers.
  COLS.forEach((name, i) => {
    const x = boardX + labelW + i * cell;
    const dead = DEAD.has(name);
    board += `<image href="${imgs[name]}" x="${x + 9}" y="${boardY}" width="40" height="40" opacity="${dead ? 0.35 : 1}"/>`;
    board += mono(x + cell / 2, boardY + 62, COL_LABEL[i], i === 0 ? C.ink : C.ink2, 13, i === 0 ? 600 : 400, "middle");
  });
  // Rows.
  ROWS.forEach((who, r) => {
    const y = boardY + headH + r * rowH;
    board += `<image href="${imgs[who]}" x="${boardX}" y="${y + 13}" width="32" height="32"/>`;
    board += mono(boardX + 36, y + 36, COL_LABEL[COLS.indexOf(who)], C.ink, 12);
    COLS.forEach((name, c) => {
      const x = boardX + labelW + c * cell;
      const v = VALUES[who][c];
      if (name === who) {
        board += `<rect x="${x + 1}" y="${y + 1}" width="${cell - 2}" height="${rowH - 2}" fill="${C.paper}"/>`;
        return;
      }
      if (DEAD.has(name)) {
        board += `<rect x="${x + 1}" y="${y + 1}" width="${cell - 2}" height="${rowH - 2}" fill="${C.paper}"/>`;
        board += `<image href="${imgs[name === "ines" ? "seer" : "villager"]}" x="${x + cell / 2 - 12}" y="${y + rowH / 2 - 12}" width="24" height="24" opacity="0.55"/>`;
        return;
      }
      const hot = v >= 0.55;
      board += `<rect x="${x + 1}" y="${y + 1}" width="${cell - 2}" height="${rowH - 2}" fill="${cellColor(v)}" stroke="${c === 0 ? C.ink3 : C.rule2}"/>`;
      board += mono(x + cell / 2, y + 32, `.${String(Math.round(v * 100)).padStart(2, "0")}`, hot ? "#fff" : C.ink, 18, 600, "middle");
      const d = DELTA[`${who}:${c}`];
      if (d) board += mono(x + cell / 2, y + 49, `${d.startsWith("+") ? "+" : "−"}${d.slice(1)}`, hot ? "rgba(255,255,255,0.85)" : d.startsWith("+") ? C.error : C.help, 10, 400, "middle");
    });
  });
  // Selected cell outline: Bel on you.
  board += `<rect x="${boardX + labelW + 1}" y="${boardY + headH + 2 * rowH + 1}" width="${cell - 2}" height="${rowH - 2}" fill="none" stroke="${C.ink}" stroke-width="2"/>`;

  const traceY = boardY + headH + ROWS.length * rowH + 28;
  const trace = [
    mono(boardX, traceY, "Bel on you", C.ink, 15, 600),
    mono(boardX + 8 * cell + labelW, traceY, ".71", C.ink, 18, 600, "end"),
    mono(boardX, traceY + 24, "= deflects 0.81 ≥ 0.70 · w 1.50 → +0.31   d2 · you", C.ink2, 12),
    mono(boardX, traceY + 42, "= accuses_with_evidence 0.86 ≥ 0.70 · w 1.60 · cred 0.71 → +0.52", C.ink2, 12),
  ].join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.paper}"/>
  <text x="64" y="112" font-family="Xanh Mono" font-size="76" fill="${C.ink}" letter-spacing="-1">werewolf</text>
  ${mono(64, 168, "Seven villagers. Two wolves.", C.ink, 24)}
  ${mono(64, 202, "Every word you type is measured.", C.ink, 24)}
  ${mono(64, 258, "Each message is judged once by TypeSafe Jev:", C.ink2, 16)}
  ${mono(64, 282, "twenty typed questions, calibrated probabilities.", C.ink2, 16)}
  ${mono(64, 306, "Seven villagers turn them into suspicion you", C.ink2, 16)}
  ${mono(64, 330, "watch move as you speak. No text is generated.", C.ink2, 16)}
  <rect x="${boardX - 24}" y="${boardY - 24}" width="${8 * cell + labelW + 48}" height="${headH + ROWS.length * rowH + 118}" fill="${C.sheet}" stroke="${C.rule}"/>
  ${board}
  ${trace}
  <image href="${imgs.stranger}" x="64" y="384" width="150" height="150"/>
  <image href="${imgs.mara}" x="196" y="396" width="128" height="128"/>
  <image href="${imgs.tomas}" x="304" y="402" width="120" height="120"/>
  <image href="${imgs.bel}" x="400" y="410" width="112" height="112"/>
  ${mono(64, 600, "werewolf.asfarlab.fun", C.ink3, 19)}
  ${mono(W - 64, 600, "measurements by TypeSafe Jev", C.ink3, 19, 400, "end")}
</svg>`;

  const fontFiles = await fonts();
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: W },
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: "IBM Plex Mono" },
  });
  const png = resvg.render().asPng();
  await writeFile(out, png);
  await writeFile(path.join(cache, "og.svg"), svg);
  console.log(`wrote ${path.relative(root, out)} (${png.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
