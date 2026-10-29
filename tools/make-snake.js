// GitHub contribution grafiğini çekip yılan animasyonu SVG'si üretir.
// (Platane/snk çıktısına benzer; workflow ilk çalıştığında gerçek dosyalarla değiştirilir)
const fs = require("fs");
const path = require("path");

const USER = "arda6464";
const OUT_DIR = path.join(__dirname, "..", "profile");

const THEMES = {
  dark: {
    bg: "#0d1117",
    dots: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
    snake: "#a855f7",
    glow: "#a855f7",
  },
  light: {
    bg: "#ffffff",
    dots: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
    snake: "#7c3aed",
    glow: "#7c3aed",
  },
};

async function fetchLevels() {
  const res = await fetch(`https://github.com/users/${USER}/contributions`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
      Accept: "text/html",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for contributions page`);
  const html = await res.text();
  const levels = [];
  const re = /data-level="(\d)"/g;
  let m;
  while ((m = re.exec(html)) !== null) levels.push(Number(m[1]));
  if (!levels.length) throw new Error("data-level bulunamadi");
  return levels;
}

function buildSvg(levels, theme) {
  const cols = Math.ceil(levels.length / 7);
  const pitch = 12;
  const pad = 8;
  const cell = 10;
  const w = cols * pitch + pad * 2;
  const h = 7 * pitch + pad * 2;

  // hucre dolgulari
  let rects = "";
  levels.forEach((lvl, i) => {
    const col = Math.floor(i / 7);
    const row = i % 7;
    const x = pad + col * pitch;
    const y = pad + row * pitch;
    const fill = theme.dots[Math.min(lvl, 4)];
    rects += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${fill}"/>`;
  });

  // yilani grid uzerinde yilan gibi gezdir (soldan saga, in, sagdan sola...)
  const pts = [];
  for (let row = 0; row < 7; row++) {
    const order = row % 2 === 0 ? [...Array(cols).keys()] : [...Array(cols).keys()].reverse();
    for (const col of order) {
      const x = pad + col * pitch + cell / 2;
      const y = pad + row * pitch + cell / 2;
      pts.push(`${x},${y}`);
    }
  }
  const d = "M" + pts[0] + " L" + pts.slice(1).join(" L");
  const dur = 16;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="GitHub contribution snake">
  <rect width="${w}" height="${h}" fill="${theme.bg}"/>
  ${rects}
  <path d="${d}" fill="none" stroke="${theme.snake}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"
        stroke-opacity="0.95" pathLength="1000" stroke-dasharray="90 910">
    <animate attributeName="stroke-dashoffset" from="0" to="-1000" dur="${dur}s" repeatCount="indefinite"/>
  </path>
  <path d="${d}" fill="none" stroke="${theme.glow}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"
        stroke-opacity="0.25" pathLength="1000" stroke-dasharray="90 910">
    <animate attributeName="stroke-dashoffset" from="0" to="-1000" dur="${dur}s" repeatCount="indefinite"/>
  </path>
</svg>
`;
}

(async () => {
  const levels = await fetchLevels();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, theme] of Object.entries(THEMES)) {
    const file = path.join(OUT_DIR, `snake-${name}.svg`);
    fs.writeFileSync(file, buildSvg(levels, theme), "utf8");
    console.log(`${file} -> ${levels.length} hucre`);
  }
})().catch((e) => {
  console.error("HATA:", e.message);
  process.exit(1);
});
