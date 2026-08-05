# Project Dee - Permanent Architecture & Maintenance Rules

This document outlines critical design decisions, audio engine rules, and mobile layout constraints learned during development to prevent regressions.

---

## 1. Audio Engine & SoundCloud Sync Rules
- **SoundCloud Track Playback**: SoundCloud tracks (`soundCloudCatalog`) MUST be loaded into the Native SoundCloud Player Deck (`#sc-embed-deck` -> `#sc-widget-iframe`).
- **Never Route SC to YT Engine**: NEVER attempt to route SoundCloud tracks through YouTube embed iframes or hidden audio players. Modern browsers enforce strict Autoplay/CORS policies that mute cross-origin audio (volume = 0).
- **Catalog Sync Script (`scripts/sync_catalog.py`)**:
  - SoundCloud tracks MUST preserve their authentic `sc_url`.
  - NEVER assign dummy fallback YouTube video IDs (e.g., `"5qegZ_NBvqI"`) to newly synced SoundCloud tracks. Fallback IDs cause newly released tracks to play the wrong audio track.

---

## 2. DOM Structure & `innerHTML` Safety
- **Wrapper Button Placement**: Interactive controls like `.tracks-expand-wrapper` (`#btn-toggle-catalog`, `#btn-sc-all`) and `.video-expand-wrapper` (`#btn-toggle-videos`, `#btn-yt-all`) MUST be placed **OUTSIDE** the dynamic content containers (`.tracks-list`, `.video-playlist-scroll`).
- **innerHTML Rebuilding**: JavaScript catalog rendering overwrites the `innerHTML` of `.tracks-list` and `.video-playlist-scroll`. Placing buttons inside these containers will result in their destruction upon catalog refresh.

---

## 3. Hero Typography & 3D Volumetric Styling
- **Exact Capitalization**: The Hero title MUST preserve the exact brand capitalization: **`Project Dee`** (Mixed Title Case). DO NOT apply `text-transform: uppercase` to `.hero-title`.
- **3D Volumetric Depth**: Gradient text clipping (`-webkit-background-clip: text`) ignores standard CSS `text-shadow`. 3D depth and neon floating glows MUST be rendered using multi-layered `filter: drop-shadow(...)` rules on `.hero-title`, `.title-project`, and `.title-dee`.

---

## 4. Mobile & Foldable Device Responsiveness (Galaxy Fold 4)
- **Header Layout (`max-width: 480px`)**:
  - Hide `.logo-text` in the top header on narrow screens so only the sleek logo mark (`PjD`), language dropdown, and mobile menu hamburger fit on one line without wrapping.
- **Hero "D" Logo Mark**:
  - On screens `<= 480px`, `.hero-logo-container` must be centered in-flow (`position: relative; margin: 0 auto; justify-content: center;`).
  - `.hero-logo-big` must be rendered at double size (~`220px` x `220px`) for maximum impact on tall aspect ratio cover screens.
- **Text Alignment**:
  - Hero subtitles on mobile MUST use `text-align: center;` (DO NOT use `text-align: justify`, which causes awkward word spacing gaps on narrow screens).

---

## 5. Deployment Workflow (GitHub Pages)
- When pushing updates via GitHub Contents REST API, always trigger the GitHub Pages build via legacy API (`PUT /pages` -> `build_type: legacy`) and verify `status == "built"`.
