// ClockPro Icon Pack (FILE-BASED)
// User drops SVG files into:
// /config/www/community/clockpro-card/icons/
// which becomes:
// /local/community/clockpro-card/icons/

const BASE = "/local/community/clockpro-card/icons/";

// Map Home Assistant weather conditions -> SVG filename
// Keep filenames simple; user can replace SVG files without touching card JS.
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

// Night variants (ClockPro sets these using sun.sun)
const NIGHT_MAP = {
  "clear-night": "clear-night.svg",
  "partlycloudy-night": "partlycloudy-night.svg",

  // Optional fallbacks if user doesn't provide separate night icons:
  "cloudy-night": "cloudy.svg",
  "rainy-night": "rain.svg",
  "pouring-night": "pouring.svg",
  "lightning-night": "lightning.svg",
  "lightning-rainy-night": "lightning-rainy.svg",
  "fog-night": "fog.svg",
  "hail-night": "hail.svg",
  "snowy-night": "snow.svg",
  "snowy-rainy-night": "snowy-rainy.svg",
  "windy-night": "windy.svg",
  "windy-variant-night": "windy.svg",
  "exceptional-night": "exceptional.svg",
  "unknown-night": "unknown.svg",
};

function img(file) {
  return `<img src="${BASE}${file}" style="width:100%;height:100%;display:block;" />`;
}

export default new Proxy(
  {},
  {
    get: (_, key) => {
      const k = String(key || "unknown");
      const file = NIGHT_MAP[k] || MAP[k] || MAP.unknown;
      return img(file);
    },
  }
);

