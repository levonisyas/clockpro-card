/* clockpro-card.js
 * custom:clockpro-card
 * Vanilla Web Component, absolute positioned elements, user-configurable layout/styles.
 */

(function () {
  const DEFAULT_CONFIG = {
    weather_entity: "weather.home",
    location_entity: "zone.home",
    card: {
      height: 170,
    },
    pro_icon: false,
    pro_icon_pack: "",
    sun_entity: "sun.sun",

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
        letter_spacing: -1,
        gaps: {
          hh_colon: 12,
          colon_mm: 12,
        },
        colors: {
          first_digit: "#d64040",
          rest: "rgba(255,255,255,0.95)",
        },
      },
      date: {
        pos: { left: 16, bottom: 50 },
        font: { size: 28, weight: 600 },
        letter_spacing: null,
        color: "rgba(255,255,255,0.92)",
      },
      day: {
        pos: { left: 16, bottom: 14 },
        font: { size: 36, weight: 700 },
        letter_spacing: null,
        color: "rgba(255,255,255,0.92)",
      },
      icon: {
        pos: { right: 18, top: 20 },
        icon: { size: 86, color: "rgba(255,255,255,0.95)" },
        transform: {
          x: 0,
          y: 0,
          scale: 1,
        },
        source: "weather", // weather | default
        default_icon: "mdi:weather-partly-cloudy",
      },
      details: {
        pos: { right: 16, bottom: 44 },
        font: { size: 22, weight: 600 },
        letter_spacing: null,
        color: "rgba(255,255,255,0.92)",
      },
      location: {
        pos: { right: 16, bottom: 14 },
        font: { size: 26, weight: 700 },
        letter_spacing: null,
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

  function letterSpacingDecl(v) {
    if (v === undefined || v === null) return [];
    return [`letter-spacing:${toPx(v)};`];
  }

  function conditionLabel(condition) {
    const map = {
      "clear-night": "Clear",
      clear: "Clear",
      sunny: "Sunny",
      cloudy: "Cloudy",
      partlycloudy: "Partly Cloudy",
      "partlycloudy-night": "Partly Cloudy",

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
      "partlycloudy-night": "mdi:weather-night-partly-cloudy",
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
      this._proIconPack = null;
      this._proIconPackPromise = null;

    }

    setConfig(userConfig) {
      if (!userConfig || typeof userConfig !== "object") throw new Error("Invalid config");

      const prevPack = this._config?.pro_icon_pack || "";
      const prevProIcon = this._config?.pro_icon === true;

      const merged = deepMerge(DEFAULT_CONFIG, userConfig);

      // keep only our known element keys; user asked names fixed
      merged.elements = deepMerge(DEFAULT_CONFIG.elements, (userConfig.elements || {}));

      const nextPack = merged.pro_icon_pack || "";
      const nextProIcon = merged.pro_icon === true;

      // If pack path or pro_icon toggled, invalidate cache
      if (prevPack !== nextPack || prevProIcon !== nextProIcon) {
        this._proIconPack = null;
        this._proIconPackPromise = null;
      }

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

    // --------------------------------------------------------------------------
    // Lovelace UI: Default YAML (Stub Config)
    // Home Assistant uses this when user adds the card from UI.
    // --------------------------------------------------------------------------
    static getStubConfig() {
      return {
        // Required
        weather_entity: "weather.home",
        location_entity: "zone.home",
        sun_entity: "sun.sun",
        // Pro icon pack
        pro_icon: false,
        // If pro_icon_pack does NOT start with "/", it will be loaded from the card's folder:
        // /local/community/clockpro-card/<pro_icon_pack>
        pro_icon_pack: "icon-pack.js",
        pro_icons_folder: "icons",

        // Card sizing
        card: {
          height: 220,
        },

        // Background
        background: {
          mode: "transparent", // transparent | color
          color: "rgba(0,0,0,0)",
          radius: 0,
          padding: 0,
        },

        // Elements (absolute positioned)
        elements: {
          time: {
            pos: { left: 5, top: 14 },
            font: { size: 80, weight: 650 },
            letter_spacing: -1,

            // Spacing control:
            // 13 : 58 (but "13" stays tight)
            gaps: {
              hh_colon: 5,
              colon_mm: 5,
            },

            // Colors:
            // only first digit is red
            colors: {
              first_digit: "#ff3b30",
              rest: "#111111",
            },
          },

          date: {
            pos: { left: 14, bottom: 60 },
            font: { size: 30, weight: 600 },
            letter_spacing: -0.5,
            color: "#111111",
          },

          day: {
            pos: { left: 14, bottom: 30 },
            font: { size: 25, weight: 700 },
            letter_spacing: -0.5,
            color: "#111111",
          },

          icon: {
            pos: { right: 5, top: 0 },

            icon: {
              size: 160,
              color: "#111111",
            },

            // Fix for MDI viewbox "padding"
            // (moves the glyph up, scales slightly)
            transform: {
              x: 0,
              y: -10,
              scale: 1,
            },

            // Icon source:
            // - weather = use condition mapping
            // - default = always use default_icon
            source: "weather", // weather | default
            default_icon: "mdi:weather-partly-cloudy",
          },

          details: {
            pos: { right: 14, bottom: 30 },
            font: { size: 25, weight: 500 },
            letter_spacing: -0.2,
            color: "#111111",
          },

          location: {
            pos: { right: 14, bottom: 5 },
            font: { size: 20, weight: 500 },
            letter_spacing: -0.2,
            color: "#111111",
          },
        },
      };
    }


    _loadProIconPack() {
      const cfg = this._config;
      if (!cfg || cfg.pro_icon !== true) return Promise.resolve(null);

      const url = String(cfg.pro_icon_pack || "").trim();
      if (!url) return Promise.resolve(null);

      if (this._proIconPack) return Promise.resolve(this._proIconPack);
      if (this._proIconPackPromise) return this._proIconPackPromise;

      // Resolve relative pack path against this card's own folder
      // Examples:
      // - "icon-pack.js" -> "/local/community/clockpro-card/icon-pack.js"
      // - "/local/..." stays as is
      // - "http(s)://..." stays as is
      const isAbsHttp = /^https?:\/\//i.test(url);
      const isAbsPath = url.startsWith("/");
      let absUrl = url;

      if (!isAbsHttp && !isAbsPath) {
        // Best-effort: derive current script folder (works for /local/community/clockpro-card/clockpro-card.js)
        const scriptUrl =
          (import.meta && import.meta.url) ||
          (document.currentScript && document.currentScript.src) ||
          "";
        const base = scriptUrl ? scriptUrl.replace(/[^/]*$/, "") : "/local/community/clockpro-card/";
        absUrl = `${base}${url}`;
      } else if (isAbsPath) {
        absUrl = url;
      }

      this._proIconPackPromise = import(absUrl)
        .then((mod) => {
          // Accept: default export object OR named export `pack`
          const pack = mod?.default || mod?.pack || null;
          this._proIconPack = pack;
          return pack;
        })
        .catch(() => {
          this._proIconPack = null;
          return null;
        })
        .finally(() => {
          this._proIconPackPromise = null;
        });

      return this._proIconPackPromise;
    }

    async _render() {
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
      const rawCondition = wEnt?.state || "cloudy";
      const temp =
        wEnt?.attributes?.temperature ??
        wEnt?.attributes?.temp ??
        wEnt?.attributes?.current_temperature;

      const tempText =
        temp === undefined || temp === null
          ? "--"
          : `${Math.round(Number(temp))}°C`;

      // Day/Night detection (optional)
      const sunEntId = cfg.sun_entity || DEFAULT_CONFIG.sun_entity;
      const sunState = sunEntId ? (hass?.states?.[sunEntId]?.state || "") : "";
      const isNight = sunState === "below_horizon";

      // Normalize condition for ICON selection (text stays rawCondition)
      let iconCondition = rawCondition;
      if (isNight) {
        const c = String(rawCondition || "").toLowerCase();

        // Full Pro: every condition gets a night variant
        // (icon pack can provide unique SVGs for each one)
        const nightMap = {
          clear: "clear-night",
          sunny: "clear-night",
          partlycloudy: "partlycloudy-night",
          cloudy: "cloudy-night",
          rainy: "rainy-night",
          pouring: "pouring-night",
          lightning: "lightning-night",
          "lightning-rainy": "lightning-rainy-night",
          fog: "fog-night",
          hail: "hail-night",
          snowy: "snowy-night",
          "snowy-rainy": "snowy-rainy-night",
          windy: "windy-night",
          "windy-variant": "windy-variant-night",
          exceptional: "exceptional-night",
          unknown: "unknown-night",
        };

        iconCondition = nightMap[c] || `${c}-night`;
      }

      const condText = conditionLabel(rawCondition);

      // pro icon pack (optional)
      const useProIcon = cfg.pro_icon === true && String(cfg.pro_icon_pack || "").trim();
      const pack = useProIcon ? await this._loadProIconPack() : null;

      const proSvg =
        pack && typeof pack === "object"
          ? (pack[iconCondition] || pack[String(iconCondition || "").toLowerCase()] || "")
          : "";

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
          : conditionIcon(iconCondition);

      // styles
      const bg = cfg.background || {};
      const cardBg =
        bg.mode === "color" ? (bg.color || "rgba(0,0,0,0)") : "transparent";
      const radius = toPx(bg.radius ?? 0);
      const padding = toPx(bg.padding ?? 0);

      const e = cfg.elements;

      const cardHeight = toPx(cfg.card?.height ?? DEFAULT_CONFIG.card.height);

      const hhColonGap = toPx(e.time.gaps?.hh_colon ?? DEFAULT_CONFIG.elements.time.gaps.hh_colon);
      const colonMmGap = toPx(e.time.gaps?.colon_mm ?? DEFAULT_CONFIG.elements.time.gaps.colon_mm);

      const timeStyle = [
        "position:absolute;",
        ...posStyle(e.time.pos),
        "display:flex;",
        "align-items:baseline;",
        `font-size:${toPx(e.time.font.size)};`,
        `font-weight:${e.time.font.weight};`,
        "line-height:1;",
        "font-variant-numeric:tabular-nums;",
        "font-kerning:none;",
        ...letterSpacingDecl(e.time.letter_spacing),
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
        ...letterSpacingDecl(e.date.letter_spacing),
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
        ...letterSpacingDecl(e.day.letter_spacing),
        "white-space:nowrap;",
        "font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;",
      ].join("");

      const iconSize = toPx(e.icon.icon.size);
      const iconTx = toPx(e.icon.transform?.x ?? 0);
      const iconTy = toPx(e.icon.transform?.y ?? 0);
      const iconScale = e.icon.transform?.scale ?? 1;

      const iconWrapStyle = [
        "position:absolute;",
        ...posStyle(e.icon.pos),
        `width:${iconSize};`,
        `height:${iconSize};`,
        "display:grid;",
        "place-items:center;",
      ].join("");

      const iconStyle = [
        `width:${iconSize} !important;`,
        `height:${iconSize} !important;`,
        `color:${e.icon.icon.color} !important;`,
        `--mdc-icon-size:${iconSize};`,
        `--iron-icon-width:${iconSize};`,
        `--iron-icon-height:${iconSize};`,
        `transform:translate(${iconTx}, ${iconTy}) scale(${iconScale});`,
        "transform-origin:center;",
        "display:block;",
      ].join("");

      const detailsStyle = [
        "position:absolute;",
        ...posStyle(e.details.pos),
        "text-align:right;",
        `font-size:${toPx(e.details.font.size)};`,
        `font-weight:${e.details.font.weight};`,
        `color:${e.details.color};`,
        "line-height:1.1;",
        ...letterSpacingDecl(e.details.letter_spacing),
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
        ...letterSpacingDecl(e.location.letter_spacing),
        "white-space:nowrap;",
        "font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;",
      ].join("");

      // time coloring: first digit red, rest configured
      const timeHtml =
        `<span class="hh">` +
          `<span class="hh0" style="color:${e.time.colors.first_digit};">${hh[0] || "0"}</span>` +
          `<span class="hh1" style="color:${e.time.colors.rest};">${hh.slice(1)}</span>` +
        `</span>` +
        `<span class="colon" style="color:${e.time.colors.rest};margin-left:${hhColonGap};">:</span>` +
        `<span class="mm" style="color:${e.time.colors.rest};margin-left:${colonMmGap};">${mm}</span>`;

      this._root.innerHTML = `
        <style>
          :host { display:block; }
          ha-card {
            position: relative;
            height: ${cardHeight};
            background: ${cardBg} !important;
            border-radius: ${radius};
            padding: ${padding};
            overflow: hidden;
            box-shadow: none !important;
          }
          .time .hh {
            display: inline-flex;
            gap: 0px;
          }
          .time .hh0,
          .time .hh1,
          .time .colon,
          .time .mm {
            display: inline-block;
          }
          .pro-svg {
            width: 100%;
            height: 100%;
          }
          .pro-svg svg {
            width: 100%;
            height: 100%;
            display: block;
          }

        </style>

        <ha-card>
          <div class="time" style="${timeStyle}">${timeHtml}</div>

          <div class="date" style="${dateStyle}">${dayNum}. ${monthName}</div>
          <div class="day" style="${dayStyle}">${dayName}</div>

          <div class="icon" style="${iconWrapStyle}">
            ${
              (useProIcon && proSvg)
                ? `<div class="pro-svg" style="${iconStyle}">${proSvg}</div>`
                : `<ha-icon style="${iconStyle}" icon="${iconName}"></ha-icon>`
            }
          </div>

          <div class="details" style="${detailsStyle}">${tempText}, ${condText}</div>
          <div class="location" style="${locationStyle}">${locationText}</div>
        </ha-card>
      `;
    }
  }
// ============================================================================
// Overlay Pro Card - Startup Banner (ALWAYS VISIBLE)
// ============================================================================

const overlayTitle = '  CLOCK[PRO]-CARD ';
const overlayVersion = '  Version Faz.1    ';

// Longest line width
const overlayWidth = Math.max(overlayTitle.length, overlayVersion.length);

console.info(
  `%c${overlayTitle.padEnd(overlayWidth)}\n%c${overlayVersion.padEnd(overlayWidth)}`,
  'color: cyan; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray'
);
  // ============================================================================
  // Custom Element Registration - SIMPLE & COMPATIBLE
  // ============================================================================
  if (!customElements.get("clockpro-card")) {
    customElements.define("clockpro-card", WeatherClockCard);

    // Card picker info (optional)
    window.customCards = window.customCards || [];
    window.customCards.push({
      type: "clockpro-card",
      name: "Clock Pro Card",
      preview: true,
      description: "Absolute-positioned clock + weather card",
    });
  }
})();
