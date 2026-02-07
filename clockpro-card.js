/* weather-clock-card.js
 * custom:weather-clock-card
 * Vanilla Web Component, absolute positioned elements, user-configurable layout/styles.
 *
 * Config:
 * type: custom:weather-clock-card
 * weather_entity: weather.home
 * location_entity: zone.home
 * background:
 *   mode: transparent | color
 *   color: "rgba(0,0,0,0)"
 *   radius: 0
 *   padding: 16
 * elements:
 *   time/date/day/icon/details/location: (see defaults below)
 */

(function () {
  const DEFAULT_CONFIG = {
    weather_entity: "weather.home",
    location_entity: "zone.home",
    background: {
      mode: "transparent", // transparent | color
      color: "rgba(0,0,0,0)",
      radius: 0,
      padding: 16,
    },
    elements: {
      time: {
        pos: { left: 16, top: 10 },
        font: { size: 76, weight: 600 },
        colors: {
          first_digit: "#d64040",
          rest: "rgba(255,255,255,0.95)",
        },
      },
      date: {
        pos: { left: 16, bottom: 50 },
        font: { size: 28, weight: 600 },
        color: "rgba(255,255,255,0.92)",
      },
      day: {
        pos: { left: 16, bottom: 14 },
        font: { size: 36, weight: 700 },
        color: "rgba(255,255,255,0.92)",
      },
      icon: {
        pos: { right: 18, top: 20 },
        icon: { size: 86, color: "rgba(255,255,255,0.95)" },
        source: "weather", // weather | default
        default_icon: "mdi:weather-partly-cloudy",
      },
      details: {
        pos: { right: 16, bottom: 44 },
        font: { size: 22, weight: 600 },
        color: "rgba(255,255,255,0.92)",
      },
      location: {
        pos: { right: 16, bottom: 14 },
        font: { size: 26, weight: 700 },
        color: "rgba(255,255,255,0.92)",
      },
    },
  };

  const pad2 = (n) => String(n).padStart(2, "0");

  function deepMerge(base, extra) {
    // tiny deep merge (objects only)
    if (!extra || typeof extra !== "object") return base;
    const out = Array.isArray(base) ? base.slice() : { ...base };
    for (const k of Object.keys(extra)) {
      const bv = out[k];
      const ev = extra[k];
      if (ev && typeof ev === "object" && !Array.isArray(ev) && bv && typeof bv === "object" && !Array.isArray(bv)) {
        out[k] = deepMerge(bv, ev);
      } else {
        out[k] = ev;
      }
    }
    return out;
  }

  function toPx(v) {
    if (v === undefined || v === null) return undefined;
    if (typeof v === "number") return `${v}px`;
    // allow user to pass "10px" / "5%" etc.
    return String(v);
  }

  function posStyle(pos) {
    // Only apply keys user provides (top/bottom/left/right)
    const style = [];
    if (!pos || typeof pos !== "object") return style;
    if (pos.top !== undefined) style.push(`top:${toPx(pos.top)};`);
    if (pos.bottom !== undefined) style.push(`bottom:${toPx(pos.bottom)};`);
    if (pos.left !== undefined) style.push(`left:${toPx(pos.left)};`);
    if (pos.right !== undefined) style.push(`right:${toPx(pos.right)};`);
    return style;
  }

  function conditionLabel(condition) {
    const map = {
      "clear-night": "Clear",
      clear: "Clear",
      sunny: "Sunny",
      cloudy: "Cloudy",
      partlycloudy: "Partly Cloudy",
      rainy: "Rain",
      pouring: "Heavy Rain",
      lightning: "Thunderstorm",
      "lightning-rainy": "Thunderstorm",
      fog: "Fog",
      hail: "Hail",
      snowy: "Snow",
      "snowy-rainy": "Sleet",
      windy: "Windy",
      "windy-variant": "Windy",
      exceptional: "Exceptional",
    };
    if (map[condition]) return map[condition];
    return String(condition || "")
      .replace(/[-_]/g, " ")
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
  }

  function conditionIcon(condition) {
    const map = {
      "clear-night": "mdi:weather-night",
      clear: "mdi:weather-sunny",
      sunny: "mdi:weather-sunny",
      cloudy: "mdi:weather-cloudy",
      partlycloudy: "mdi:weather-partly-cloudy",
      rainy: "mdi:weather-rainy",
      pouring: "mdi:weather-pouring",
      lightning: "mdi:weather-lightning",
      "lightning-rainy": "mdi:weather-lightning-rainy",
      fog: "mdi:weather-fog",
      hail: "mdi:weather-hail",
      snowy: "mdi:weather-snowy",
      "snowy-rainy": "mdi:weather-snowy-rainy",
      windy: "mdi:weather-windy",
      "windy-variant": "mdi:weather-windy-variant",
      exceptional: "mdi:alert-circle-outline",
    };
    return map[condition] || "mdi:weather-cloudy";
  }

  class WeatherClockCard extends HTMLElement {
    constructor() {
      super();
      this._hass = null;
      this._config = null;
      this._root = this.attachShadow({ mode: "open" });
      this._interval = null;
    }

    setConfig(userConfig) {
      if (!userConfig || typeof userConfig !== "object") throw new Error("Invalid config");
      const merged = deepMerge(DEFAULT_CONFIG, userConfig);
      // keep only our known element keys; user asked names fixed
      merged.elements = deepMerge(DEFAULT_CONFIG.elements, (userConfig.elements || {}));
      this._config = merged;
      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      this._render();
    }

    connectedCallback() {
      if (this._interval) clearInterval(this._interval);
      // tick for clock + UI
      this._interval = setInterval(() => this._render(), 30_000);
      this._render();
    }

    disconnectedCallback() {
      if (this._interval) clearInterval(this._interval);
      this._interval = null;
    }

    getCardSize() {
      return 3;
    }

    _render() {
      if (!this._config) return;

      const hass = this._hass;
      const cfg = this._config;

      // time/date/day from JS Date()
      const now = new Date();
      const hh = pad2(now.getHours());
      const mm = pad2(now.getMinutes());
      const dayNum = pad2(now.getDate());
      const monthName = now.toLocaleDateString(undefined, { month: "long" });
      const dayName = now.toLocaleDateString(undefined, { weekday: "long" });

      // weather
      const wEnt = hass?.states?.[cfg.weather_entity];
      const condition = wEnt?.state || "cloudy";
      const temp =
        wEnt?.attributes?.temperature ??
        wEnt?.attributes?.temp ??
        wEnt?.attributes?.current_temperature;

      const tempText =
        temp === undefined || temp === null
          ? "--"
          : `${Math.round(Number(temp))}°C`;

      const condText = conditionLabel(condition);

      // location
      const locEnt = hass?.states?.[cfg.location_entity];
      const locationText =
        locEnt?.attributes?.friendly_name ||
        locEnt?.state ||
        "";

      // icon source
      const iconCfg = cfg.elements.icon;
      const iconName =
        iconCfg.source === "default"
          ? (iconCfg.default_icon || DEFAULT_CONFIG.elements.icon.default_icon)
          : conditionIcon(condition);

      // styles
      const bg = cfg.background || {};
      const cardBg =
        bg.mode === "color" ? (bg.color || "rgba(0,0,0,0)") : "transparent";
      const radius = toPx(bg.radius ?? 0);
      const padding = toPx(bg.padding ?? 0);

      const e = cfg.elements;

      const timeStyle = [
        "position:absolute;",
        ...posStyle(e.time.pos),
        `font-size:${toPx(e.time.font.size)};`,
        `font-weight:${e.time.font.weight};`,
        "line-height:1;",
        "letter-spacing:-1px;",
        "white-space:nowrap;",
        "user-select:none;",
        "font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;",
      ].join("");

      const dateStyle = [
        "position:absolute;",
        ...posStyle(e.date.pos),
        `font-size:${toPx(e.date.font.size)};`,
        `font-weight:${e.date.font.weight};`,
        `color:${e.date.color};`,
        "line-height:1.05;",
        "white-space:nowrap;",
        "font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;",
      ].join("");

      const dayStyle = [
        "position:absolute;",
        ...posStyle(e.day.pos),
        `font-size:${toPx(e.day.font.size)};`,
        `font-weight:${e.day.font.weight};`,
        `color:${e.day.color};`,
        "line-height:1;",
        "white-space:nowrap;",
        "font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;",
      ].join("");

      const iconWrapStyle = [
        "position:absolute;",
        ...posStyle(e.icon.pos),
        `width:${toPx(e.icon.icon.size + 6)};`,
        `height:${toPx(e.icon.icon.size + 6)};`,
        "display:grid;",
        "place-items:center;",
      ].join("");

      const iconStyle = [
        `width:${toPx(e.icon.icon.size)};`,
        `height:${toPx(e.icon.icon.size)};`,
        `color:${e.icon.icon.color};`,
      ].join("");

      const detailsStyle = [
        "position:absolute;",
        ...posStyle(e.details.pos),
        "text-align:right;",
        `font-size:${toPx(e.details.font.size)};`,
        `font-weight:${e.details.font.weight};`,
        `color:${e.details.color};`,
        "line-height:1.1;",
        "white-space:nowrap;",
        "font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;",
      ].join("");

      const locationStyle = [
        "position:absolute;",
        ...posStyle(e.location.pos),
        "text-align:right;",
        `font-size:${toPx(e.location.font.size)};`,
        `font-weight:${e.location.font.weight};`,
        `color:${e.location.color};`,
        "line-height:1;",
        "white-space:nowrap;",
        "font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;",
      ].join("");

      // time coloring: first digit red, rest configured
      const timeHtml = `
        <span style="color:${e.time.colors.first_digit};">${hh[0] || "0"}</span>
        <span style="color:${e.time.colors.rest};">${hh.slice(1)}</span>
        <span style="color:${e.time.colors.rest};">:</span>
        <span style="color:${e.time.colors.rest};">${mm}</span>
      `;

      this._root.innerHTML = `
        <style>
          :host { display:block; }
          ha-card {
            position: relative;
            height: 170px;
            background: ${cardBg} !important;
            border-radius: ${radius};
            padding: ${padding};
            overflow: hidden;
            box-shadow: none !important;
          }
        </style>

        <ha-card>
          <div class="time" style="${timeStyle}">${timeHtml}</div>

          <div class="date" style="${dateStyle}">${dayNum}. ${monthName}</div>
          <div class="day" style="${dayStyle}">${dayName}</div>

          <div class="icon" style="${iconWrapStyle}">
            <ha-icon style="${iconStyle}" icon="${iconName}"></ha-icon>
          </div>

          <div class="details" style="${detailsStyle}">${tempText}, ${condText}</div>
          <div class="location" style="${locationStyle}">${locationText}</div>
        </ha-card>
      `;
    }
  }

  customElements.define("clockpro-card", WeatherClockCard);

  // Card picker info (optional)
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "clockpro-card",
    name: "Clock Pro Card",
    description: "Absolute-positioned clock + weather card",
  });
})();
