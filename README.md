
# Clock Pro Card — Time & Weather Visualization Engine

![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?logo=homeassistant&logoColor=white) ![License MIT](https://img.shields.io/badge/License-MIT-97CA00.svg?logo=homeassistant&logoColor=white) ![Version](https://img.shields.io/github/v/release/levonisyas/clockpro-card.svg?label=ClockPro%20Card&logo=homeassistant&logoColor=white&color=007ec6) ![Downloads](https://img.shields.io/github/downloads/levonisyas/clockpro-card/total.svg?label=Downloads&logo=homeassistant&logoColor=white&labelColor=555&color=5cb85c)

### Your Precision Time & Weather Display for Home Assistant *(Clock + Weather Card)*

---

>## 🔗 Clock Pro Card (source & documentation):
>- **<https://github.com/levonisyas/clockpro-card>**
>- **<https://community.home-assistant.io/t/clock-pro-card-time-weather-visualization-engine/>**

---

<img src="https://raw.githubusercontent.com/levonisyas/clockpro-card/main/demo/demo.jpg" width="1200" alt="Overlay Pro Card">

---

## A professional weather + clock card for Home Assistant Lovelace.
Absolute positioning, customizable typography, SVG icon packs, and flexible layout — designed to be easy to use and powerful.

👉 Works with any weather entity.
👉 Optional SVG icon pack support.
👉 Full YAML config — no dependencies.

---

## 📌 Features

* 🕒 Big stylized clock with customizable spacing & colors
* 📅 Date & day labels
* 🌦 Weather icon + condition + temperature
* 📍 Location label
* 🎨 Fully positionable UI elements
* 🎨 Optional **colorful SVG icon pack**
* 🧠 Smart defaults + full stub config for UI add
* 📐 Configurable card height

---

## 🚀 Installation

ClockPro Card can be installed in two ways:

---

**📌 Method 1 — HACS Custom Repository (Recommended)**

1. Go to **HACS → Frontend → Custom repositories**
2. Add this repository:

```
https://github.com/levonisyas/clockpro-card
```

3. Select category: **Lovelace**
4. Install **ClockPro Card**
5. Restart Home Assistant
6. Add the resource automatically (HACS usually handles this)

After installation, the file will be available at:

```
/local/community/clockpro-card/clockpro-card.js
```

If you use a custom icon pack, place it here:

```
/local/community/clockpro-card/icon-pack.js
```

---

**📌 Method 2 — Manual Installation**

1. Download `clockpro-card.js`  
2. Place it into:

```
/config/www/community/clockpro-card/
```

3. (Optional) Add your `icon-pack.js` into the same folder
4. Add the resource manually:

```yaml
url: /local/community/clockpro-card/clockpro-card.js
type: module
```

**File paths:**

```
/local/community/clockpro-card/clockpro-card.js
/local/community/clockpro-card/icon-pack.js
```

---

## 🛠 Usage — Full Example YAML

Copy & paste this full config, then edit values to taste:

```yaml
type: custom:clockpro-card
weather_entity: weather.home
location_entity: zone.home
sun_entity: sun.sun

pro_icon: true
pro_icon_pack: icon-pack.js
pro_icons_folder: your_pack

card:
  height: 220

background:
  mode: transparent
  color: "rgba(0,0,0,0)"
  radius: 0
  padding: 0

elements:
  time:
    pos:
      left: 12
      top: 0
    font:
      size: 86
      weight: 650
    letter_spacing: -2
    gaps:
      hh_colon: 26
      colon_mm: 26
    colors:
      first_digit: "#ff3b30"
      rest: "#111111"

  date:
    pos:
      left: 14
      bottom: 72
    font:
      size: 26
      weight: 650
    letter_spacing: -0.5
    color: "#111111"

  day:
    pos:
      left: 14
      bottom: 20
    font:
      size: 40
      weight: 750
    letter_spacing: -0.5
    color: "#111111"

  icon:
    pos:
      right: 8
      top: 0
    icon:
      size: 170
      color: "#111111"
    transform:
      x: 0
      y: -12
      scale: 1.12
    source: weather
    default_icon: "mdi:weather-partly-cloudy"

  details:
    pos:
      right: 14
      bottom: 68
    font:
      size: 22
      weight: 650
    letter_spacing: -0.2
    color: "#111111"

  location:
    pos:
      right: 14
      bottom: 20
    font:
      size: 28
      weight: 800
    letter_spacing: -0.2
    color: "#111111"
```

---

## 🧩 Options

### ☁ Weather

* `weather_entity` — any HA weather entity (`weather.home`, `weather.open_meteo`, etc.)

### 📍 Location

* `location_entity` — any zone or sensor that provides a friendly name.

> Note: weather entities don’t reliably provide city names — zone or config location is recommended.

---

## 🎨 Icon Pack (pro_icon / pro_icon_pack)

* `pro_icon: false` (default) → standard MDI icons
* `pro_icon: true` → load from `pro_icon_pack`

Example:

```yaml
pro_icon: true
pro_icon_pack: icon-pack.js
```

Pack path can be relative — if it doesn’t start with `/`, ClockPro will resolve it to the card folder automatically.

A pack file should export an object of SVG strings by condition key:

```js
export default {
  clear: "<svg>…</svg>",
  rainy: "<svg>…</svg>",
  partlycloudy: "<svg>…</svg>",
  // etc…
};
```

---

## 🧠 Stub Config (UI Add Card)

When users add the card from the Lovelace UI, the following default config is provided:

```js
static getStubConfig() {
  return {
    weather_entity: "weather.home",
    location_entity: "zone.home",
    card: { height: 220 },
    pro_icon: true,
    pro_icon_pack: "icon-pack.js",
    background: { mode: "transparent", color: "rgba(0,0,0,0)", radius: 0, padding: 0 },
    elements: { 
       // …full settings as above
    },
  };
}
```

---

## 🎨 Pro Icon Pack (SVG Files)

ClockPro supports a **file-based Pro Icon Pack**.

This means:

* You **do NOT** edit card JS  
* You **do NOT** embed SVG strings inside YAML  
* You simply drop your own `.svg` files into a folder  
* ClockPro will load them automatically via `icon-pack.js`  

You can download the official SVG pack from the repository:  
<https://github.com/levonisyas/clockpro-card/tree/main/dist/svg>

---

#### 1) Create the icons folder

Create this folder in Home Assistant:

```
/config/www/community/clockpro-card/your_pack/
```

This becomes accessible as:

```
/local/community/clockpro-card/your_pack/
```

---

## FULL required SVG list (day + night)

**Day**

* clear-day.svg
* partlycloudy-day.svg
* cloudy.svg
* rain.svg
* pouring.svg
* lightning.svg
* lightning-rainy.svg
* fog.svg
* hail.svg
* snow.svg
* snowy-rainy.svg
* windy.svg
* exceptional.svg
* unknown.svg

**Night**

* clear-night.svg
* partlycloudy-night.svg
* cloudy-night.svg
* rainy-night.svg
* pouring-night.svg
* lightning-night.svg
* lightning-rainy-night.svg
* fog-night.svg
* hail-night.svg
* snowy-night.svg
* snowy-rainy-night.svg
* windy-night.svg
* exceptional-night.svg
* unknown-night.svg

**If night icons are missing, ClockPro will fallback to the closest day icon.**

---

#### 3) Enable Pro Icons in YAML

```yaml
type: custom:clockpro-card
weather_entity: weather.home
location_entity: zone.home
sun_entity: sun.sun

pro_icon: true
pro_icon_pack: icon-pack.js
pro_icons_folder: your_pack
```

---

### 🌙 Day / Night Support

ClockPro automatically detects night mode using:

```yaml
sun_entity: sun.sun
```

When the sun is below the horizon:

* `clear` → `clear-night`
* `partlycloudy` → `partlycloudy-night`

---

## 🎨 Customization Guide

You can tune every element:

| Element  | Property        | Meaning                       |
| -------- | --------------- | ----------------------------- |
| time     | pos             | left/top                      |
|          | font            | size/weight                   |
|          | colors          | first_digit/rest              |
| date/day | pos/color       | positioning & color           |
| icon     | icon.size/color | MDI size/color                |
|          | transform       | shift/scale for better visual |
| details  | pos/font/color  | bottom weather text           |
| location | pos/font/color  | bottom location text          |

---

## ⚠ Common Issues

### ❌ Temperature shows `--`

The card looks for these attributes:

* `attributes.temperature`
* `attributes.temp`
* `attributes.current_temperature`

If your weather provider doesn’t expose current temperature, ClockPro will fallback to `--`.

---

## 🛠 Troubleshooting

* Make sure `icon-pack.js` is in the same folder as the card (or provide a full path).
* If customizing icon pack, clear browser cache after editing.
* For custom SVG sizes, use the `transform` block.

---

## 🤝 Enjoy ⭐ Support  

I build these projects for **my own needs** and share them so others can benefit.  
I don’t use donation links — so **please don’t buy me coffee** ☕  

>If you enjoy this project, simply **⭐ star the repository**.  
>Your feedback and contributions matter more than coffee.
