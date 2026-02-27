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
    pro_icons_folder: "svg",
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
          rest: "rgba(0, 0, 0, 0.95)",
        },
      },
      date: {
        pos: { left: 16, bottom: 50 },
        font: { size: 28, weight: 600 },
        letter_spacing: null,
        color: "rgba(0, 0, 0, 0.92)",
      },
      day: {
        pos: { left: 16, bottom: 14 },
        font: { size: 36, weight: 700 },
        letter_spacing: null,
        color: "rgba(0, 0, 0, 0.92)",
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
        color: "rgba(0, 0, 0, 0.92)",
      },
      location: {
        pos: { right: 16, bottom: 14 },
        font: { size: 26, weight: 700 },
        letter_spacing: null,
        color: "rgba(0, 0, 0, 0.92)",
      },

      // 5-day forecast (uses existing weather_entity attributes.forecast)
      forecast: {
        show: false,
        days: 5,
        pos: { left: 16, bottom: 8 },

        gap: 18,

        day: {
          font: { size: 14, weight: 700 },
          letter_spacing: 0.4,
          color: "rgba(0, 0, 0, 0.92)",
          uppercase: true,
        },

        icon: {
          size: 34,
          color: "rgba(0, 0, 0, 0.95)",
        },

        temp: {
          font: { size: 16, weight: 700 },
          letter_spacing: -0.2,
          color: "rgba(0, 0, 0, 0.92)",
          format: "maxmin", // maxmin | max
        },
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

      // Forecast cache (daily)
      this._forecastDailyCache = null; // { entity_id, fetchedAt, forecast: [...] }
      this._forecastDailyPromise = null;

    }

    setConfig(userConfig) {
      if (!userConfig || typeof userConfig !== "object") throw new Error("Invalid config");

      const prevPack = this._config?.pro_icon_pack || "";
      const prevProIcon = this._config?.pro_icon === true;

      const merged = deepMerge(DEFAULT_CONFIG, userConfig);

      // keep only our known element keys; user asked names fixed
      merged.elements = deepMerge(DEFAULT_CONFIG.elements, (userConfig.elements || {}));

      // IMPORTANT:
      // deepMerge keeps DEFAULT pos keys that user didn't provide (e.g., default left remains when user sets right).
      // Normalize mutually-exclusive axes deterministically based on what userConfig explicitly sets.
      if (merged.elements && typeof merged.elements === "object" && userConfig && typeof userConfig === "object") {
        for (const elKey of Object.keys(merged.elements)) {
          const el = merged.elements[elKey];
          if (!el || typeof el !== "object") continue;

          const pos = el.pos;
          if (!pos || typeof pos !== "object") continue;

          const userPos = userConfig?.elements?.[elKey]?.pos;
          if (!userPos || typeof userPos !== "object") continue;

          // X axis: if user set right (and did not set left), drop left
          if (userPos.right !== undefined && userPos.left === undefined) delete pos.left;
          // X axis: if user set left (and did not set right), drop right
          if (userPos.left !== undefined && userPos.right === undefined) delete pos.right;

          // Y axis: if user set bottom (and did not set top), drop top
          if (userPos.bottom !== undefined && userPos.top === undefined) delete pos.top;
          // Y axis: if user set top (and did not set bottom), drop bottom
          if (userPos.top !== undefined && userPos.bottom === undefined) delete pos.bottom;
        }
      }

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

    static getConfigElement() {
      return document.createElement("clockpro-card-editor");
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
        pro_icon_pack: "/local/community/clockpro-card/icon-pack.js",
        pro_icons_folder: "your-folder-name", // relative to card file or absolute URL/path

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

          // 5-day forecast (horizontal strip)
          forecast: {
            show: false,
            days: 5,
            pos: { left: 10, bottom: 5 },

            gap: 14,

            day: {
              font: { size: 12, weight: 700 },
              letter_spacing: 0.4,
              color: "#111111",
              uppercase: true,
            },

            icon: {
              size: 28,
              color: "#111111",
            },

            temp: {
              font: { size: 14, weight: 700 },
              letter_spacing: -0.2,
              color: "#111111",
              format: "maxmin", // maxmin | max
            },
          },
        },
      };
    }

    _resolveProIconsBase() {
      const cfg = this._config || DEFAULT_CONFIG;

      const folderRaw = String(cfg.pro_icons_folder ?? DEFAULT_CONFIG.pro_icons_folder ?? "icons").trim();
      if (!folderRaw) return "/local/community/clockpro-card/icons/";

      const ensureSlash = (s) => (s.endsWith("/") ? s : s + "/");

      // Absolute URL folder
      if (/^https?:\/\//i.test(folderRaw)) return ensureSlash(folderRaw);

      // Absolute HA path folder (ex: /local/..., /hacsfiles/..., etc.)
      if (folderRaw.startsWith("/")) return ensureSlash(folderRaw);

      // Relative folder -> resolve against this card file location
      const scriptUrl =
        (import.meta && import.meta.url) ||
        (document.currentScript && document.currentScript.src) ||
        "";
      const base = scriptUrl ? scriptUrl.replace(/[^/]*$/, "") : "/local/community/clockpro-card/";
      return ensureSlash(`${base}${folderRaw}`);
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

    // --------------------------------------------------------------------------
    // Forecast (Daily) via service response (HA 2024+)
    // Uses WebSocket call_service with return_response:true
    // Caches for a short time to avoid spamming.
    // --------------------------------------------------------------------------
    async _getDailyForecast() {
      const hass = this._hass;
      const cfg = this._config;
      if (!hass || !cfg?.weather_entity) return [];

      const entId = String(cfg.weather_entity).trim();
      if (!entId) return [];

      // Legacy support: some providers still expose attributes.forecast
      const wEnt = hass?.states?.[entId];
      const attrForecast =
        Array.isArray(wEnt?.attributes?.forecast)
          ? wEnt.attributes.forecast
          : (Array.isArray(wEnt?.attributes?.forecast_daily) ? wEnt.attributes.forecast_daily : null);

      if (attrForecast && attrForecast.length) return attrForecast;

      // Cache 20 minutes
      const now = Date.now();
      if (
        this._forecastDailyCache &&
        this._forecastDailyCache.entity_id === entId &&
        (now - this._forecastDailyCache.fetchedAt) < 20 * 60 * 1000 &&
        Array.isArray(this._forecastDailyCache.forecast)
      ) {
        return this._forecastDailyCache.forecast;
      }

      if (this._forecastDailyPromise) return this._forecastDailyPromise;

      // WS call_service weather.get_forecasts (daily)
      this._forecastDailyPromise = hass.callWS({
        type: "call_service",
        domain: "weather",
        service: "get_forecasts",
        service_data: { type: "daily" },
        target: { entity_id: entId },
        return_response: true,
      })
        .then((res) => {
          // Expected shape: { response: { [entity_id]: { forecast: [...] } } }
          const fc = res?.response?.[entId]?.forecast;
          const list = Array.isArray(fc) ? fc : [];
          this._forecastDailyCache = { entity_id: entId, fetchedAt: Date.now(), forecast: list };
          return list;
        })
        .catch(() => {
          this._forecastDailyCache = { entity_id: entId, fetchedAt: Date.now(), forecast: [] };
          return [];
        })
        .finally(() => {
          this._forecastDailyPromise = null;
        });

      return this._forecastDailyPromise;
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

      const proVal =
        pack && typeof pack === "object"
          ? (pack[iconCondition] || pack[String(iconCondition || "").toLowerCase()] || "")
          : "";

      // proVal can be:
      // 1) raw HTML (legacy packs) -> contains "<"
      // 2) filename like "clear-day.svg"
      // 3) absolute url/path like "/local/.../x.svg" or "https://..."
      const iconsBase = this._resolveProIconsBase();

      let proIconHtml = "";
      if (typeof proVal === "string" && proVal.trim()) {
        const v = proVal.trim();

        if (v.includes("<")) {
          // legacy HTML pack support
          proIconHtml = v;
        } else {
          const isAbsHttp = /^https?:\/\//i.test(v);
          const isAbsPath = v.startsWith("/");

          const src = isAbsHttp || isAbsPath ? v : `${iconsBase}${v}`;
          proIconHtml = `<img src="${src}" style="width:100%;height:100%;display:block;" />`;
        }
      }

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
          `<span class="hh0" style="color:${e.time.colors.first_digit};">${hh[0]}</span>` +
          `<span class="hh1" style="color:${e.time.colors.rest};">${hh[1]}</span>` +
        `</span>` +
        `<span class="colon" style="color:${e.time.colors.rest};margin-left:${hhColonGap};">:</span>` +
        `<span class="mm" style="color:${e.time.colors.rest};margin-left:${colonMmGap};">${mm}</span>`;

      // ----------------------------------------------------------------------
      // Forecast (5-day) - uses existing weather_entity forecast attributes ONLY
      // ----------------------------------------------------------------------
      const forecastCfg = e.forecast || {};
      const showForecast = forecastCfg.show === true;

      const clampInt = (v, lo, hi) => {
        const n = Number.parseInt(v, 10);
        if (Number.isNaN(n)) return lo;
        return Math.max(lo, Math.min(hi, n));
      };

      const forecastDays = clampInt(forecastCfg.days ?? 5, 1, 7);

      const rawForecast = showForecast ? await this._getDailyForecast() : [];
      const forecastItems = showForecast ? (rawForecast || []).slice(0, forecastDays) : [];

      const proIconForCondition = (condKey) => {
        if (!useProIcon || !pack || typeof pack !== "object") return "";
        const k1 = String(condKey || "").trim();
        const k2 = String(condKey || "").toLowerCase().trim();
        const v = (pack[k1] || pack[k2] || "");
        if (!v || typeof v !== "string" || !v.trim()) return "";

        const vv = v.trim();

        if (vv.includes("<")) {
          return vv;
        }

        const isAbsHttp = /^https?:\/\//i.test(vv);
        const isAbsPath = vv.startsWith("/");
        const src = isAbsHttp || isAbsPath ? vv : `${iconsBase}${vv}`;
        return `<img src="${src}" style="width:100%;height:100%;display:block;" />`;
      };

      const forecastGap = toPx(forecastCfg.gap ?? 18);

      const forecastStyle = [
        "position:absolute;",
        ...posStyle(forecastCfg.pos || { left: 16, bottom: 8 }),
        "display:flex;",
        "align-items:flex-end;",
        `gap:${forecastGap};`,
        "pointer-events:none;",
        "user-select:none;",
      ].join("");

      const forecastDayStyle = [
        `font-size:${toPx(forecastCfg.day?.font?.size ?? 14)};`,
        `font-weight:${forecastCfg.day?.font?.weight ?? 700};`,
        ...letterSpacingDecl(forecastCfg.day?.letter_spacing ?? 0.4),
        `color:${forecastCfg.day?.color ?? "rgba(255,255,255,0.92)"};`,
        "line-height:1;",
      ].join("");

      const forecastTempStyle = [
        `font-size:${toPx(forecastCfg.temp?.font?.size ?? 16)};`,
        `font-weight:${forecastCfg.temp?.font?.weight ?? 700};`,
        ...letterSpacingDecl(forecastCfg.temp?.letter_spacing ?? -0.2),
        `color:${forecastCfg.temp?.color ?? "rgba(255,255,255,0.92)"};`,
        "line-height:1.1;",
      ].join("");

      const forecastIconSize = Number(forecastCfg.icon?.size ?? 34);
      const forecastIconColor = forecastCfg.icon?.color ?? "rgba(255,255,255,0.95)";

      const forecastUpper = forecastCfg.day?.uppercase !== false;
      const forecastTempFormat = (forecastCfg.temp?.format || "maxmin");

      const forecastHtml =
        (showForecast && forecastItems.length)
          ? `<div class="forecast" style="${forecastStyle}">` +
              forecastItems.map((it) => {
                const dtRaw = it?.datetime ?? it?.date ?? it?.time ?? "";
                const dt = dtRaw ? new Date(dtRaw) : null;

                let dayLabel = "";
                if (dt && !Number.isNaN(dt.getTime())) {
                  dayLabel = dt.toLocaleDateString(undefined, { weekday: "short" });
                } else {
                  // fallback: show empty day label if datetime missing
                  dayLabel = "";
                }
                if (forecastUpper && dayLabel) dayLabel = String(dayLabel).toUpperCase();

                const fCond = it?.condition ?? it?.state ?? rawCondition ?? "unknown";

                const tMax =
                  it?.temperature ?? it?.temp ?? it?.temperature_high ?? it?.high_temperature;
                const tMin =
                  it?.templow ?? it?.temperature_low ?? it?.low_temperature ?? it?.temp_low;

                const hasMax = tMax !== undefined && tMax !== null && tMax !== "";
                const hasMin = tMin !== undefined && tMin !== null && tMin !== "";

                const maxTxt = hasMax ? `${Math.round(Number(tMax))}°` : "--";
                const minTxt = hasMin ? `${Math.round(Number(tMin))}°` : "";

                const tempTxt =
                  (forecastTempFormat === "max" || !hasMin)
                    ? maxTxt
                    : `${maxTxt}/${minTxt}`;

                const mdiIcon = conditionIcon(String(fCond || "unknown").toLowerCase());
                const proHtml = proIconForCondition(String(fCond || "unknown").toLowerCase());

                const iconHtml =
                  (useProIcon && proHtml)
                    ? `<div class="pro-svg" style="width:${toPx(forecastIconSize)};height:${toPx(forecastIconSize)};">${proHtml}</div>`
                    : `<ha-icon style="width:${toPx(forecastIconSize)};height:${toPx(forecastIconSize)};color:${forecastIconColor};" icon="${mdiIcon}"></ha-icon>`;

                return (
                  `<div class="fitem" style="display:flex;flex-direction:column;align-items:center;gap:${toPx(8)};">` +
                    `<div class="fday" style="${forecastDayStyle}">${dayLabel}</div>` +
                    `<div class="fico" style="display:flex;align-items:center;justify-content:center;">${iconHtml}</div>` +
                    `<div class="ftemp" style="${forecastTempStyle}">${tempTxt}</div>` +
                  `</div>`
                );
              }).join("") +
            `</div>`
          : "";

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
              (useProIcon && proIconHtml)
                ? `<div class="pro-svg" style="${iconStyle}">${proIconHtml}</div>`
                : `<ha-icon style="${iconStyle}" icon="${iconName}"></ha-icon>`
            }
          </div>

          <div class="details" style="${detailsStyle}">${tempText}, ${condText}</div>
          <div class="location" style="${locationStyle}">${locationText}</div>

          ${forecastHtml}
        </ha-card>
      `;
    }
  }
// ============================================================================
// Clock Pro Card - Startup Banner (ALWAYS VISIBLE)
// ============================================================================

const overlayTitle = '  CLOCK[PRO]-CARD ';
const overlayVersion = '  Version Faz.2.1    ';

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
      preview: false,
      description: "Clock Pro Card — Time & Weather Visualization Engine",
    });
  }

// ============================================================================
// Clock Pro Card – Visual Editor (FULL YAML-FREE, HA Native)
// - No hidden/disabled fields
// - Position controls use axisgrid (Vertical/Horizontal + Value) everywhere
// - Numeric inputs: pure numbers saved as Number (prevents "5" issue)
// - Panels: General/Card&Background, Time/Date/Day, Weather Icon/Details/Location, Forecast
// ============================================================================

(() => {
  const base =
    window.LitElement ||
    Object.getPrototypeOf(customElements.get("ha-panel-lovelace")) ||
    Object.getPrototypeOf(customElements.get("ha-card"));

  const html = base.prototype.html;
  const css = base.prototype.css;

  const deepClone = (x) => JSON.parse(JSON.stringify(x || {}));

  class ClockProCardEditor extends base {
    static get properties() {
      return {
        hass: {},
        _config: { state: true },
        _ui: { state: true },
      };
    }

    setConfig(config) {
      this._config = deepClone(config);

      const prev = this._ui || {};
      const firstBoot = prev._booted !== true;

      this._ui = {
        general: false,
        tdd: false,
        weather: false,
        forecast: false,
        _booted: true,
        ...prev,
      };

      if (firstBoot) {
        this._ui = {
          ...this._ui,
          general: true,
          tdd: false,
          weather: false,
          forecast: false,
        };
      }

      this.requestUpdate();
    }

    _togglePanel(key, expanded) {
      this._ui = { ...(this._ui || {}), [key]: !!expanded };
    }

    _selectedValue(e) {
      return (e && e.detail && e.detail.value != null)
        ? e.detail.value
        : (e && e.target ? e.target.value : undefined);
    }

    _numOrStr(v) {
      const s = String(v ?? "").trim();
      // pure number -> store as Number (so card will render px via toPx where used)
      if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
      return s;
    }

    _get(path, fallback = null) {
      try {
        const parts = String(path).split(".");
        let o = this._config;
        for (const p of parts) o = o[p];
        return (o === undefined || o === null) ? fallback : o;
      } catch (e) {
        return fallback;
      }
    }

    _set(path, value) {
      const cfg = deepClone(this._config);
      const parts = String(path).split(".");
      let o = cfg;
      while (parts.length > 1) {
        const p = parts.shift();
        if (o[p] == null || typeof o[p] !== "object") o[p] = {};
        o = o[p];
      }
      o[parts[0]] = value;
      this._config = cfg;
      this._fireChanged();
    }

    _fireChanged() {
      this.dispatchEvent(new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      }));
    }

    _getObjectAt(root, path) {
      const parts = String(path).split(".");
      let o = root;
      for (const p of parts) {
        if (o[p] == null || typeof o[p] !== "object") o[p] = {};
        o = o[p];
      }
      return o;
    }

    static get styles() {
      return css`
        .wrap {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 12px 0 4px 0;
        }

        .row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          min-height: 40px;
          margin: 8px 0;
        }
        .row > * {
          flex: 1 1 170px;
          min-width: 170px;
        }

        /* 3 items in one row (prevents 2+1 wrap on normal editor widths) */
        .row.triple > * {
          flex: 1 1 calc(33.333% - 12px);
          min-width: 120px;
        }  
        
        .row.align-top {
          align-items: flex-start;
        }

        .mini {
          flex: 1 1 120px;
          min-width: 120px;
        }

        /* lock axis controls into one line (prevents last "Value" dropping) */
        .axisgrid {
          display: grid;
          grid-template-columns: 1.3fr 0.7fr 1.3fr 0.7fr;
          gap: 12px;
          align-items: end;
          min-height: 40px;
          margin: 8px 0;
        }
        .axisgrid > * {
          min-width: 0;
        }

        .hdrline {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .hdricon {
          width: 20px;
          height: 20px;
          color: var(--secondary-text-color);
          flex: 0 0 auto;
        }
        .title {
          font-weight: 600;
        }
        .sect {
          font-weight: 600;
          margin: 10px 0 4px 0;
        }

        /* pro_icon spacing / alignment fix */
        ha-formfield {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          margin: 0;
        }
        ha-formfield ha-switch {
          margin: 0;
        }

        ha-textfield, ha-select, ha-entity-picker {
          width: 100%;
        }
      `;
    }

    // ------------------------------------------------------------
    // Axisgrid: Vertical(top/bottom)+Value + Horizontal(left/right)+Value
    // Deletes opposite keys to avoid top+bottom / left+right conflicts.
    // ------------------------------------------------------------
    _renderAxisGrid(path, defaults = { v: "top", vVal: 0, h: "left", hVal: 0 }) {
      const pos = this._get(path, {}) || {};

      const vAxis =
        (pos.bottom != null) ? "bottom" :
        ((pos.top != null) ? "top" : (defaults.v || "top"));

      const hAxis =
        (pos.right != null) ? "right" :
        ((pos.left != null) ? "left" : (defaults.h || "left"));

      const vVal =
        (vAxis === "bottom")
          ? (pos.bottom != null ? pos.bottom : (defaults.vVal ?? 0))
          : (pos.top != null ? pos.top : (defaults.vVal ?? 0));

      const hVal =
        (hAxis === "right")
          ? (pos.right != null ? pos.right : (defaults.hVal ?? 0))
          : (pos.left != null ? pos.left : (defaults.hVal ?? 0));

      return html`
        <div class="axisgrid">
          <ha-select
            class="mini"
            label="Vertical"
            .value=${vAxis}
            @closed=${(ev) => ev.stopPropagation()}
            @selected=${(e) => {
              e.stopPropagation();
              const axis = this._selectedValue(e); // top | bottom
              const cfg = deepClone(this._config);
              const p = this._getObjectAt(cfg, path);

              const current =
                (axis === "bottom")
                  ? (p.bottom != null ? p.bottom : vVal)
                  : (p.top != null ? p.top : vVal);

              if (axis === "top") {
                p.top = current;
                delete p.bottom;
              } else {
                p.bottom = current;
                delete p.top;
              }

              this._config = cfg;
              this._fireChanged();
            }}
          >
            <mwc-list-item value="top">top</mwc-list-item>
            <mwc-list-item value="bottom">bottom</mwc-list-item>
          </ha-select>

          <ha-textfield
            class="mini"
            label="Value"
            .value=${String(vVal)}
            @change=${(e) => {
              const val = this._numOrStr(e.target.value);
              if (vAxis === "bottom") this._set(`${path}.bottom`, val);
              else this._set(`${path}.top`, val);
            }}
          ></ha-textfield>

          <ha-select
            class="mini"
            label="Horizontal"
            .value=${hAxis}
            @closed=${(ev) => ev.stopPropagation()}
            @selected=${(e) => {
              e.stopPropagation();
              const axis = this._selectedValue(e); // left | right
              const cfg = deepClone(this._config);
              const p = this._getObjectAt(cfg, path);

              const current =
                (axis === "right")
                  ? (p.right != null ? p.right : hVal)
                  : (p.left != null ? p.left : hVal);

              if (axis === "left") {
                p.left = current;
                delete p.right;
              } else {
                p.right = current;
                delete p.left;
              }

              this._config = cfg;
              this._fireChanged();
            }}
          >
            <mwc-list-item value="left">left</mwc-list-item>
            <mwc-list-item value="right">right</mwc-list-item>
          </ha-select>

          <ha-textfield
            class="mini"
            label="Value"
            .value=${String(hVal)}
            @change=${(e) => {
              const val = this._numOrStr(e.target.value);
              if (hAxis === "right") this._set(`${path}.right`, val);
              else this._set(`${path}.left`, val);
            }}
          ></ha-textfield>
        </div>
      `;
    }

    // ------------------------------------------------------------
    // PANEL: General / Card & Background
    // ------------------------------------------------------------

    _setManyRoot(obj) {
      const cfg = deepClone(this._config);
      for (const k of Object.keys(obj || {})) cfg[k] = obj[k];
      this._config = cfg;
      this._fireChanged();
    }

    _generalSchema() {
      return [
        {
          name: "weather_entity",
          selector: { entity: { domain: "weather" } },
        },
        {
          name: "location_entity",
          // zone.* genelde burada kullanılıyor ama serbest bırakalım
          selector: { entity: {} },
        },
        {
          name: "sun_entity",
          selector: { entity: { domain: "sun" } },
        },
      ];
    }

    _onGeneralFormChanged(e) {
      // ha-form -> e.detail.value = {weather_entity, location_entity, sun_entity}
      const v = (e && e.detail && e.detail.value) ? e.detail.value : null;
      if (!v) return;

      const next = {};
      if (v.weather_entity !== undefined) next.weather_entity = v.weather_entity;
      if (v.location_entity !== undefined) next.location_entity = v.location_entity;
      if (v.sun_entity !== undefined) next.sun_entity = v.sun_entity;

      this._setManyRoot(next);
    }

    _renderGeneral() {
      const bgMode =
        (this._get("background.mode", "transparent") === "color") ? "color" : "transparent";

      return html`
        <ha-expansion-panel
          .expanded=${!!this._ui.general}
          @expanded-changed=${(e) => this._togglePanel("general", e.detail.value)}
        >
          <div slot="header" class="hdrline">
            <ha-icon class="hdricon" icon="mdi:cog-outline"></ha-icon>
            <div class="title">General / Card & Background</div>
          </div>

          <div class="row" style="margin: 2px 0;">
            <ha-selector
              .hass=${this.hass}
              .selector=${{ entity: { domain: "weather" } }}
              .value=${this._get("weather_entity", "weather.home")}
              @value-changed=${(e) => this._set("weather_entity", e.detail.value)}
              label="weather_entity"
            ></ha-selector>
          </div>
          <div class="row" style="margin: 2px 0;">          
            <ha-selector
              .hass=${this.hass}
              .selector=${{ entity: {} }}
              .value=${this._get("location_entity", "zone.home")}
              @value-changed=${(e) => this._set("location_entity", e.detail.value)}
              label="location_entity"
            ></ha-selector>
          </div>
          <div class="row" style="margin: 2px 0;">          
            <ha-selector
              .hass=${this.hass}
              .selector=${{ entity: { domain: "sun" } }}
              .value=${this._get("sun_entity", "sun.sun")}
              @value-changed=${(e) => this._set("sun_entity", e.detail.value)}
              label="sun_entity"
            ></ha-selector>
          </div>

          <div class="row">
            <ha-formfield label="pro_icon">
              <ha-switch
                .checked=${this._get("pro_icon", false) === true}
                @change=${(e) => this._set("pro_icon", e.target.checked)}
              ></ha-switch>
            </ha-formfield>
          </div>

          <div class="row">
            <ha-textfield
              label="pro_icon_pack"
              .value=${String(this._get("pro_icon_pack", ""))}
              @change=${(e) => this._set("pro_icon_pack", e.target.value)}
            ></ha-textfield>
          </div>

          <div class="row">
            <ha-textfield
              label="pro_icons_folder"
              .value=${String(this._get("pro_icons_folder", "svg"))}
              @change=${(e) => this._set("pro_icons_folder", e.target.value)}
            ></ha-textfield>

            <ha-textfield
              label="card.height"
              .value=${String(this._get("card.height", 170))}
              @change=${(e) => this._set("card.height", this._numOrStr(e.target.value))}
            ></ha-textfield>
          </div>

          <div class="row">
            <ha-select
              label="background.mode"
              .value=${bgMode}
              @closed=${(ev) => ev.stopPropagation()}
              @selected=${(e) => { e.stopPropagation(); this._set("background.mode", this._selectedValue(e)); }}
            >
              <mwc-list-item value="transparent">transparent</mwc-list-item>
              <mwc-list-item value="color">color</mwc-list-item>
            </ha-select>

            <ha-textfield
              label="background.color"
              .value=${String(this._get("background.color", "rgba(0,0,0,0)"))}
              @change=${(e) => this._set("background.color", e.target.value)}
            ></ha-textfield>
          </div>

          <div class="row">
            <ha-textfield
              label="background.radius"
              .value=${String(this._get("background.radius", 0))}
              @change=${(e) => this._set("background.radius", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="background.padding"
              .value=${String(this._get("background.padding", 16))}
              @change=${(e) => this._set("background.padding", this._numOrStr(e.target.value))}
            ></ha-textfield>
          </div>
        </ha-expansion-panel>
      `;
    }

    // ------------------------------------------------------------
    // PANEL: Time / Date / Day
    // ------------------------------------------------------------
    _renderTDD() {
      return html`
        <ha-expansion-panel
          .expanded=${!!this._ui.tdd}
          @expanded-changed=${(e) => this._togglePanel("tdd", e.detail.value)}
        >
          <div slot="header" class="hdrline">
            <ha-icon class="hdricon" icon="mdi:clock-outline"></ha-icon>
            <div class="title">Time / Date / Day</div>
          </div>

          <div class="sect">Time</div>
          ${this._renderAxisGrid("elements.time.pos", { v: "top", vVal: 10, h: "left", hVal: 16 })}

          <div class="row triple">
            <ha-textfield
              label="time.font.size"
              .value=${String(this._get("elements.time.font.size", 76))}
              @change=${(e) => this._set("elements.time.font.size", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="time.font.weight"
              .value=${String(this._get("elements.time.font.weight", 600))}
              @change=${(e) => this._set("elements.time.font.weight", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="time.letter_spacing"
              .value=${String(this._get("elements.time.letter_spacing", -1) ?? "")}
              @change=${(e) => {
                const v = String(e.target.value ?? "").trim();
                if (v === "") this._set("elements.time.letter_spacing", null);
                else this._set("elements.time.letter_spacing", this._numOrStr(v));
              }}
            ></ha-textfield>
          </div>

          <div class="row">
            <ha-textfield
              label="hh_colon"
              .value=${String(this._get("elements.time.gaps.hh_colon", 12))}
              @change=${(e) => this._set("elements.time.gaps.hh_colon", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="colon_mm"
              .value=${String(this._get("elements.time.gaps.colon_mm", 12))}
              @change=${(e) => this._set("elements.time.gaps.colon_mm", this._numOrStr(e.target.value))}
            ></ha-textfield>
          </div>

          <div class="row">
            <ha-textfield
              label="time.colors.first_digit"
              .value=${String(this._get("elements.time.colors.first_digit", "#d64040"))}
              @change=${(e) => this._set("elements.time.colors.first_digit", e.target.value)}
            ></ha-textfield>

            <ha-textfield
              label="time.colors.rest"
              .value=${String(this._get("elements.time.colors.rest", "rgba(255,255,255,0.95)"))}
              @change=${(e) => this._set("elements.time.colors.rest", e.target.value)}
            ></ha-textfield>
          </div>

          <div class="sect">Date</div>
          ${this._renderAxisGrid("elements.date.pos", { v: "bottom", vVal: 50, h: "left", hVal: 16 })}

          <div class="row triple">
            <ha-textfield
              label="date.font.size"
              .value=${String(this._get("elements.date.font.size", 28))}
              @change=${(e) => this._set("elements.date.font.size", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="date.font.weight"
              .value=${String(this._get("elements.date.font.weight", 600))}
              @change=${(e) => this._set("elements.date.font.weight", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="date.letter_spacing"
              .value=${String(this._get("elements.date.letter_spacing", null) ?? "")}
              @change=${(e) => {
                const v = String(e.target.value ?? "").trim();
                if (v === "") this._set("elements.date.letter_spacing", null);
                else this._set("elements.date.letter_spacing", this._numOrStr(v));
              }}
            ></ha-textfield>
          </div>

          <div class="row">
            <ha-textfield
              label="date.color"
              .value=${String(this._get("elements.date.color", "rgba(255,255,255,0.92)"))}
              @change=${(e) => this._set("elements.date.color", e.target.value)}
            ></ha-textfield>
          </div>

          <div class="sect">Day</div>
          ${this._renderAxisGrid("elements.day.pos", { v: "bottom", vVal: 14, h: "left", hVal: 16 })}

          <div class="row triple">
            <ha-textfield
              label="day.font.size"
              .value=${String(this._get("elements.day.font.size", 36))}
              @change=${(e) => this._set("elements.day.font.size", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="day.font.weight"
              .value=${String(this._get("elements.day.font.weight", 700))}
              @change=${(e) => this._set("elements.day.font.weight", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="day.letter_spacing"
              .value=${String(this._get("elements.day.letter_spacing", null) ?? "")}
              @change=${(e) => {
                const v = String(e.target.value ?? "").trim();
                if (v === "") this._set("elements.day.letter_spacing", null);
                else this._set("elements.day.letter_spacing", this._numOrStr(v));
              }}
            ></ha-textfield>
          </div>

          <div class="row">
            <ha-textfield
              label="day.color"
              .value=${String(this._get("elements.day.color", "rgba(255,255,255,0.92)"))}
              @change=${(e) => this._set("elements.day.color", e.target.value)}
            ></ha-textfield>
          </div>
        </ha-expansion-panel>
      `;
    }

    // ------------------------------------------------------------
    // PANEL: Weather Icon / Details / Location
    // ------------------------------------------------------------
    _renderWeatherBlock() {
      const iconSource = (this._get("elements.icon.source", "weather") === "default") ? "default" : "weather";

      return html`
        <ha-expansion-panel
          .expanded=${!!this._ui.weather}
          @expanded-changed=${(e) => this._togglePanel("weather", e.detail.value)}
        >
          <div slot="header" class="hdrline">
            <ha-icon class="hdricon" icon="mdi:weather-partly-cloudy"></ha-icon>
            <div class="title">Weather Icon / Details / Location</div>
          </div>

          <div class="sect">Icon</div>
          ${this._renderAxisGrid("elements.icon.pos", { v: "top", vVal: 20, h: "right", hVal: 18 })}

          <div class="row">
            <ha-textfield
              label="icon.icon.size"
              .value=${String(this._get("elements.icon.icon.size", 86))}
              @change=${(e) => this._set("elements.icon.icon.size", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="icon.icon.color"
              .value=${String(this._get("elements.icon.icon.color", "rgba(255,255,255,0.95)"))}
              @change=${(e) => this._set("elements.icon.icon.color", e.target.value)}
            ></ha-textfield>
          </div>

          <div class="row triple">
            <ha-textfield
              label="icon.transform.x"
              .value=${String(this._get("elements.icon.transform.x", 0))}
              @change=${(e) => this._set("elements.icon.transform.x", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="icon.transform.y"
              .value=${String(this._get("elements.icon.transform.y", 0))}
              @change=${(e) => this._set("elements.icon.transform.y", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="icon.transform.scale"
              .value=${String(this._get("elements.icon.transform.scale", 1))}
              @change=${(e) => this._set("elements.icon.transform.scale", this._numOrStr(e.target.value))}
            ></ha-textfield>
          </div>

          <div class="row">
            <ha-select
              label="icon.source"
              .value=${iconSource}
              @closed=${(ev) => ev.stopPropagation()}
              @selected=${(e) => { e.stopPropagation(); this._set("elements.icon.source", this._selectedValue(e)); }}
            >
              <mwc-list-item value="weather">weather</mwc-list-item>
              <mwc-list-item value="default">default</mwc-list-item>
            </ha-select>

            <ha-textfield
              label="icon.default_icon"
              .value=${String(this._get("elements.icon.default_icon", "mdi:weather-partly-cloudy"))}
              @change=${(e) => this._set("elements.icon.default_icon", e.target.value)}
            ></ha-textfield>
          </div>

          <div class="sect">Details</div>
          ${this._renderAxisGrid("elements.details.pos", { v: "bottom", vVal: 44, h: "right", hVal: 16 })}

          <div class="row triple">
            <ha-textfield
              label="details.font.size"
              .value=${String(this._get("elements.details.font.size", 22))}
              @change=${(e) => this._set("elements.details.font.size", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="details.font.weight"
              .value=${String(this._get("elements.details.font.weight", 600))}
              @change=${(e) => this._set("elements.details.font.weight", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="details.letter_spacing"
              .value=${String(this._get("elements.details.letter_spacing", null) ?? "")}
              @change=${(e) => {
                const v = String(e.target.value ?? "").trim();
                if (v === "") this._set("elements.details.letter_spacing", null);
                else this._set("elements.details.letter_spacing", this._numOrStr(v));
              }}
            ></ha-textfield>
          </div>

          <div class="row">
            <ha-textfield
              label="details.color"
              .value=${String(this._get("elements.details.color", "rgba(255,255,255,0.92)"))}
              @change=${(e) => this._set("elements.details.color", e.target.value)}
            ></ha-textfield>
          </div>

          <div class="sect">Location</div>
          ${this._renderAxisGrid("elements.location.pos", { v: "bottom", vVal: 14, h: "right", hVal: 16 })}

          <div class="row triple">
            <ha-textfield
              label="location.font.size"
              .value=${String(this._get("elements.location.font.size", 26))}
              @change=${(e) => this._set("elements.location.font.size", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="location.font.weight"
              .value=${String(this._get("elements.location.font.weight", 700))}
              @change=${(e) => this._set("elements.location.font.weight", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="location.letter_spacing"
              .value=${String(this._get("elements.location.letter_spacing", null) ?? "")}
              @change=${(e) => {
                const v = String(e.target.value ?? "").trim();
                if (v === "") this._set("elements.location.letter_spacing", null);
                else this._set("elements.location.letter_spacing", this._numOrStr(v));
              }}
            ></ha-textfield>
          </div>

          <div class="row">
            <ha-textfield
              label="location.color"
              .value=${String(this._get("elements.location.color", "rgba(255,255,255,0.92)"))}
              @change=${(e) => this._set("elements.location.color", e.target.value)}
            ></ha-textfield>
          </div>
        </ha-expansion-panel>
      `;
    }

    // ------------------------------------------------------------
    // PANEL: Forecast
    // ------------------------------------------------------------
    _renderForecast() {
      const tempFormat =
        (this._get("elements.forecast.temp.format", "maxmin") === "max") ? "max" : "maxmin";

      return html`
        <ha-expansion-panel
          .expanded=${!!this._ui.forecast}
          @expanded-changed=${(e) => this._togglePanel("forecast", e.detail.value)}
        >
          <div slot="header" class="hdrline">
            <ha-icon class="hdricon" icon="mdi:calendar-range"></ha-icon>
            <div class="title">Forecast</div>
          </div>

          <div class="row">
            <ha-formfield label="forecast.show">
              <ha-switch
                .checked=${this._get("elements.forecast.show", false) === true}
                @change=${(e) => this._set("elements.forecast.show", e.target.checked)}
              ></ha-switch>
            </ha-formfield>

            <ha-formfield label="forecast.day.uppercase">
              <ha-switch
                .checked=${this._get("elements.forecast.day.uppercase", true) !== false}
                @change=${(e) => this._set("elements.forecast.day.uppercase", e.target.checked)}
              ></ha-switch>
            </ha-formfield>
          </div>

          ${this._renderAxisGrid("elements.forecast.pos", { v: "bottom", vVal: 8, h: "left", hVal: 16 })}

          <div class="row">
            <ha-textfield
              label="forecast.days"
              .value=${String(this._get("elements.forecast.days", 5))}
              @change=${(e) => this._set("elements.forecast.days", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="forecast.gap"
              .value=${String(this._get("elements.forecast.gap", 18))}
              @change=${(e) => this._set("elements.forecast.gap", this._numOrStr(e.target.value))}
            ></ha-textfield>
          </div>

          <div class="row triple">
            <ha-textfield
              label="forecast.day.font.size"
              .value=${String(this._get("elements.forecast.day.font.size", 14))}
              @change=${(e) => this._set("elements.forecast.day.font.size", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="forecast.day.font.weight"
              .value=${String(this._get("elements.forecast.day.font.weight", 700))}
              @change=${(e) => this._set("elements.forecast.day.font.weight", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="forecast.day.letter_spacing"
              .value=${String(this._get("elements.forecast.day.letter_spacing", 0.4))}
              @change=${(e) => this._set("elements.forecast.day.letter_spacing", this._numOrStr(e.target.value))}
            ></ha-textfield>
          </div>

          <div class="row">
            <ha-textfield
              label="forecast.day.color"
              .value=${String(this._get("elements.forecast.day.color", "rgba(255,255,255,0.92)"))}
              @change=${(e) => this._set("elements.forecast.day.color", e.target.value)}
            ></ha-textfield>
          </div>

          <div class="row">
            <ha-textfield
              label="forecast.icon.size"
              .value=${String(this._get("elements.forecast.icon.size", 34))}
              @change=${(e) => this._set("elements.forecast.icon.size", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="forecast.icon.color"
              .value=${String(this._get("elements.forecast.icon.color", "rgba(255,255,255,0.95)"))}
              @change=${(e) => this._set("elements.forecast.icon.color", e.target.value)}
            ></ha-textfield>
          </div>

          <div class="row triple">
            <ha-textfield
              label="forecast.temp.font.size"
              .value=${String(this._get("elements.forecast.temp.font.size", 16))}
              @change=${(e) => this._set("elements.forecast.temp.font.size", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="forecast.temp.font.weight"
              .value=${String(this._get("elements.forecast.temp.font.weight", 700))}
              @change=${(e) => this._set("elements.forecast.temp.font.weight", this._numOrStr(e.target.value))}
            ></ha-textfield>

            <ha-textfield
              label="forecast.temp.letter_spacing"
              .value=${String(this._get("elements.forecast.temp.letter_spacing", -0.2))}
              @change=${(e) => this._set("elements.forecast.temp.letter_spacing", this._numOrStr(e.target.value))}
            ></ha-textfield>
          </div>

          <div class="row">
            <ha-textfield
              label="forecast.temp.color"
              .value=${String(this._get("elements.forecast.temp.color", "rgba(255,255,255,0.92)"))}
              @change=${(e) => this._set("elements.forecast.temp.color", e.target.value)}
            ></ha-textfield>

            <ha-select
              label="forecast.temp.format"
              .value=${tempFormat}
              @closed=${(ev) => ev.stopPropagation()}
              @selected=${(e) => { e.stopPropagation(); this._set("elements.forecast.temp.format", this._selectedValue(e)); }}
            >
              <mwc-list-item value="maxmin">maxmin</mwc-list-item>
              <mwc-list-item value="max">max</mwc-list-item>
            </ha-select>
          </div>
        </ha-expansion-panel>
      `;
    }

    render() {
      if (!this.hass || !this._config) return html``;

      return html`
        <ha-card>
          <div class="card-content">
            <div class="wrap">
              ${this._renderGeneral()}
              ${this._renderTDD()}
              ${this._renderWeatherBlock()}
              ${this._renderForecast()}
            </div>
          </div>
        </ha-card>
      `;
    }
  }

  if (!customElements.get("clockpro-card-editor")) {
    customElements.define("clockpro-card-editor", ClockProCardEditor);
  }

  // Home Assistant editor hook (no need to modify card class body)
  try {
    WeatherClockCard.getConfigElement = function () {
      return document.createElement("clockpro-card-editor");
    };
  } catch (e) {}
})();


})();
