# Vectr-style scroll journey (Three.js + GSAP)

A recreation of the scroll-driven WebGL mechanic on vectrfl.com: a glowing
"transmission line" draws itself through a dark industrial field as you
scroll, the camera dollies along the same curve, and a node powers up at
each of the four process steps.

## Run
Any static server from this folder, e.g.:

    npx serve .          # or
    python3 -m http.server 8080

then open http://localhost:8080

## How it works
- `index.html` — hero → `.journey` (560vh) with a `position:sticky` stage
  holding the canvas, four step cards and a progress rail → outro.
- `main.js`
  - A `CatmullRomCurve3` defines the path. Two `TubeGeometry` meshes share
    `uProgress`: an opaque core (white-hot head → amber tail, fragments
    past `uProgress` discarded) and an additive fresnel halo.
  - Two additive sprites ride `curve.getPointAt(progress)` as the spark.
  - GSAP `ScrollTrigger` maps journey scroll → target progress; the render
    loop eases toward it, moves the camera (`progress - 0.07` on the curve,
    offset sideways + up, look-ahead target), reveals the line, powers up
    the four station nodes, and syncs card opacity + the DOM progress rail.
  - `prefers-reduced-motion` disables pulsing/easing; everything stays
    scroll-driven.
- `vendor/` — local copies of three (module + core) and gsap/ScrollTrigger,
  so it runs fully offline. Swap for CDN/npm builds if you prefer.

`verify.js` / `mobile.js` are the headless-Chrome (CDP) checks used during
development: console-error capture, scroll-position → progress assertions,
and screenshots into `shots/`.
# admin
