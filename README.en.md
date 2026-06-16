# Box Drop Storage Simulator

[日本語](./README.md) | **English**

A simulator for box drop, auto-open, and storage-completion timing.
Bilingual (Japanese / English), light & dark themes, a **zero-dependency** static web app.

🌐 **Live demo:** https://tomonorarari-think.github.io/box-drop-simulator/

---

## Features

- **Basic parameters**: stage clear interval / white & blue box cooldown / white & blue box **open time** / inventory limit / white & blue box storage limit
- **Rule settings** (each with a `?` tooltip)
  - Cooldown reset mode (reset on drop / fixed interval)
  - Simultaneous drop priority (white first / blue first)
  - Max drops per clear (1 / 2)
  - First drop rule (full cooldown required / instant drop)
  - Non-selected box behavior (keep waiting / reset cooldown)
  - End condition (either reaches limit / both reach limit)
- **Result summary**: time to fill inventory / additional storage time / opening fill delay / total time / white & blue stored counts / which box reached its limit first (highlighted)
- **Time format**: `Xhr Ymin Zsec (NN,NNN sec)`
- **Visualization**: progress-phase timeline + an SVG line chart of stored counts over time
- **Language switch**: instant, remembered across launches (localStorage)
- **Theme**: light / dark toggle (dark by default)
- Compact single-screen layout. Inputs, language, and theme are saved locally and restored on the next launch.

### How opening time is modeled

Each box follows: **drop → storage buffer → auto-opened in order → inventory.**
White and blue have **independent, parallel opening lines**; opened loot goes into the shared inventory (capacity = inventory limit).
Once the inventory is full, opening stops and further drops pile up in storage.
The "stored count" is the number of boxes **dropped but not yet opened**, and the run ends when it reaches the cap (white 15 / blue 10).

- **As long as each colour's opener keeps up with its drop interval (cooldown), the total time is barely affected** (inventory-full just slips by roughly one final open).
- If opening can't keep up, the storage buffer fills faster and the outcome changes (storage may even hit its cap before the inventory is full).
- "**Opening fill delay**" is how much later the inventory becomes full because of opening, versus an instant-open ideal.
- Set opening time to `0` for the original behavior.

---

## Structure

```
box-drop-simulator/
├─ index.html          entry point
├─ styles.css          design (neon / glassmorphism, light & dark)
└─ js/
   ├─ i18n.js          localization resources (ja / en)
   ├─ simulation.js    simulation core (pure function)
   ├─ formatters.js    time & number formatting
   ├─ charts.js        SVG chart rendering
   └─ app.js           UI wiring
```

No external libraries, CDNs, or build step — only hand-written vanilla JS.

---

## Run locally

Just **double-click `index.html`** — it opens in your default browser.
No build, no server; it runs fully from `file://` and **works offline**.

---

## Simulation logic

`simulate(params)` in `js/simulation.js` is a pure function (it never mutates its input) and can be used and tested from Node:

```js
const sim = require('./js/simulation.js');
const result = sim.simulate({ stageInterval: 205, whiteCooldown: 300, whiteOpenTime: 5 /* ... */ });
```

To prevent infinite loops it stops after at most 5,000,000 stages, returning `completed: false` in that case.

---

## License

Released under the **MIT License** — see [LICENSE](./LICENSE).

This app uses no third-party libraries, frameworks, CDNs, or web fonts (only hand-written vanilla HTML/CSS/JS, with system fonts), so there are no third-party licenses to bundle.
