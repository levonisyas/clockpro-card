// /config/www/clockpro/icon-pack.js
// ClockPro full icon pack (covers all HA weather conditions)

const svg = (inner) => `
<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  ${inner}
</svg>
`;

const cloud = (x, y, w, h, fill = "#E8EEF6") => {
  // simple cloud blob using rounded rect + circles
  const r = Math.min(w, h) * 0.35;
  return `
    <g transform="translate(${x} ${y})">
      <rect x="${w * 0.18}" y="${h * 0.45}" width="${w * 0.68}" height="${h * 0.42}" rx="${r}" fill="${fill}"/>
      <circle cx="${w * 0.35}" cy="${h * 0.50}" r="${h * 0.23}" fill="${fill}"/>
      <circle cx="${w * 0.55}" cy="${h * 0.38}" r="${h * 0.28}" fill="${fill}"/>
      <circle cx="${w * 0.72}" cy="${h * 0.52}" r="${h * 0.20}" fill="${fill}"/>
    </g>
  `;
};

const rainDrops = (xs, y1, y2, stroke = "#4A90E2") =>
  xs
    .map(
      (x) => `<path d="M${x} ${y1} L${x - 6} ${y2}" stroke="${stroke}" stroke-width="6" stroke-linecap="round"/>`
    )
    .join("");

const snowDots = (xs, ys, fill = "#B7D9FF") =>
  xs
    .map((x, i) => `<circle cx="${x}" cy="${ys[i % ys.length]}" r="4.5" fill="${fill}"/>`)
    .join("");

const windLines = (y, stroke = "#A7B0C0") => `
  <path d="M20 ${y} C40 ${y - 10}, 60 ${y + 10}, 80 ${y} S110 ${y}, 108 ${y - 14}"
        fill="none" stroke="${stroke}" stroke-width="6" stroke-linecap="round"/>
`;

const bolt = (fill = "#FFD54A") => `
  <path d="M74 54 L54 82 H72 L60 108 L94 72 H74 Z" fill="${fill}"/>
`;

const sun = (cx, cy, r, fill = "#FFD54A") => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>
`;

const moon = (cx, cy, r) => `
  <path d="M${cx + r} ${cy}
           A${r} ${r} 0 1 1 ${cx - r} ${cy}
           A${r * 0.72} ${r * 0.72} 0 1 0 ${cx + r} ${cy}"
        fill="#DCE7FF" opacity="0.95"/>
`;

const PACK = {
  // Clear / Sunny
  clear: svg(`
    ${sun(64, 64, 26)}
    <g opacity="0.9" stroke="#FFD54A" stroke-width="6" stroke-linecap="round">
      <path d="M64 18 L64 4"/>
      <path d="M64 124 L64 110"/>
      <path d="M18 64 L4 64"/>
      <path d="M124 64 L110 64"/>
      <path d="M28 28 L18 18"/>
      <path d="M110 110 L100 100"/>
      <path d="M28 100 L18 110"/>
      <path d="M110 18 L100 28"/>
    </g>
  `),
  sunny: null, // alias below

  // Night clear
  "clear-night": svg(`
    ${moon(64, 58, 26)}
    <circle cx="86" cy="34" r="4" fill="#FFFFFF" opacity="0.9"/>
    <circle cx="44" cy="34" r="3" fill="#FFFFFF" opacity="0.8"/>
    <circle cx="96" cy="58" r="3" fill="#FFFFFF" opacity="0.7"/>
  `),

  // Cloudy
  cloudy: svg(`
    ${cloud(18, 34, 92, 64)}
  `),

  // Partly cloudy (day)
  partlycloudy: svg(`
    ${sun(86, 44, 18)}
    ${cloud(16, 38, 96, 62)}
  `),

  // Fog
  fog: svg(`
    ${cloud(18, 26, 92, 58, "#E3E8F2")}
    <g opacity="0.9">
      ${windLines(82, "#B8C2D6")}
      ${windLines(100, "#B8C2D6")}
    </g>
  `),

  // Windy
  windy: svg(`
    ${windLines(54)}
    ${windLines(74)}
    ${windLines(94)}
  `),
  "windy-variant": null, // alias below

  // Rain
  rainy: svg(`
    ${cloud(18, 28, 92, 58)}
    ${rainDrops([50, 72, 94], 86, 108)}
  `),

  // Pouring / heavy rain
  pouring: svg(`
    ${cloud(18, 26, 92, 60)}
    ${rainDrops([42, 58, 74, 90, 106], 84, 112)}
  `),

  // Lightning
  lightning: svg(`
    ${cloud(18, 26, 92, 60)}
    ${bolt()}
  `),

  // Lightning + rain
  "lightning-rainy": svg(`
    ${cloud(18, 24, 92, 62)}
    ${bolt()}
    ${rainDrops([50, 92], 90, 112)}
  `),

  // Hail
  hail: svg(`
    ${cloud(18, 26, 92, 60)}
    ${snowDots([50, 74, 98], [92, 104, 96], "#D7ECFF")}
    <circle cx="62" cy="112" r="5" fill="#D7ECFF"/>
    <circle cx="86" cy="112" r="5" fill="#D7ECFF"/>
  `),

  // Snow
  snowy: svg(`
    ${cloud(18, 26, 92, 60)}
    ${snowDots([50, 72, 94], [92, 106, 98], "#B7D9FF")}
    ${snowDots([60, 82, 104], [112, 96, 108], "#B7D9FF")}
  `),

  // Sleet / snowy-rainy
  "snowy-rainy": svg(`
    ${cloud(18, 26, 92, 60)}
    ${rainDrops([56, 92], 90, 112, "#4A90E2")}
    ${snowDots([72], [104], "#B7D9FF")}
  `),

  // Exceptional
  exceptional: svg(`
    <circle cx="64" cy="64" r="34" fill="#FF6B6B" opacity="0.9"/>
    <path d="M64 40 V70" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>
    <circle cx="64" cy="86" r="5.5" fill="#FFFFFF"/>
  `),

  // Unknown fallback
  unknown: svg(`
    ${cloud(18, 34, 92, 64, "#E8EEF6")}
    <text x="64" y="78" text-anchor="middle" font-size="34" font-family="system-ui" fill="#7A879C">?</text>
  `),
};
// Aliases
PACK.sunny = PACK.clear;
PACK["windy-variant"] = PACK.windy;

// Export
export default PACK;



