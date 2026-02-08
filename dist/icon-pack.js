// ClockPro Icon Pack (FILE-BASED)
// Put SVG files into: /config/www/community/clockpro-card/icons/
// Served as: /local/community/clockpro-card/icons/

const BASE = "/local/community/clockpro-card/icons/";

const MAP = {
  // Day
  clear: "clear-day.svg",
  sunny: "clear-day.svg",
  "clear-day": "clear-day.svg",

  partlycloudy: "partlycloudy-day.svg",
  "partlycloudy-day": "partlycloudy-day.svg",

  cloudy: "cloudy.svg",

  rainy: "rain.svg",
  pouring: "pouring.svg",

  lightning: "lightning.svg",
  "lightning-rainy": "lightning-rainy.svg",

  fog: "fog.svg",
  hail: "hail.svg",

  snowy: "snow.svg",
  "snowy-rainy": "snowy-rainy.svg",

  windy: "windy.svg",
  "windy-variant": "windy.svg",

  exceptional: "exceptional.svg",
  unknown: "unknown.svg",
};

const NIGHT_MAP = {
  "clear-night": "clear-night.svg",
  "partlycloudy-night": "partlycloudy-night.svg",
  "cloudy-night": "cloudy-night.svg",
  "rainy-night": "rainy-night.svg",
  "pouring-night": "pouring-night.svg",
  "lightning-night": "lightning-night.svg",
  "lightning-rainy-night": "lightning-rainy-night.svg",
  "fog-night": "fog-night.svg",
  "hail-night": "hail-night.svg",
  "snowy-night": "snowy-night.svg",
  "snowy-rainy-night": "snowy-rainy-night.svg",
  "windy-night": "windy-night.svg",
  "windy-variant-night": "windy-night.svg",
  "exceptional-night": "exceptional-night.svg",
  "unknown-night": "unknown-night.svg",
};

function img(file) {
  return `<img src="${BASE}${file}" style="width:100%;height:100%;display:block;" />`;
}

export default new Proxy({}, {
  get: (_, key) => {
    const k = String(key || "unknown");
    const file = NIGHT_MAP[k] || MAP[k] || MAP.unknown;
    return img(file);
  }
});
