# Inkwell — Write, Sketch, Study

A responsive writing & drawing board built with **React + Vite**. Pen, calligraphy pen,
eraser, text with handwriting/calligraphy font styles, image insertion, undo/redo, a
day/night toggle, and export to **PDF**, **DOCX**, and **TXT** — all client-side, no backend needed.

## Features

- **Pen** — freehand drawing with adjustable color and thickness
- **Calligraphy pen** — angled-nib effect (thick/thin strokes based on direction)
- **Eraser**
- **Text tool** — plain, typewriter, "own handwriting," and multiple calligraphy/script fonts,
  each with adjustable color and size
- **Insert image** — drag/upload an image onto the page, then move it with the Select tool
- **Undo / Redo** (also `Ctrl/Cmd+Z` and `Ctrl/Cmd+Y`)
- **Day / Night mode** — dark UI chrome with a warm, low-glare tone for night use
- **Export** — real PDF (via `jsPDF`), a genuine OOXML `.docx` (built with `jszip`, image +
  any typed notes as real text), and plain `.txt`
- **Fully responsive** — the toolbar, canvas, and controls auto-adjust to any screen size,
  from phones to desktops, using fluid CSS (`clamp()`, flexible layout, touch-friendly hit
  targets, and a canvas that scales to its container while keeping crisp resolution on
  high-DPI screens)

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview   # optional: preview the production build locally
```

The production build is output to `dist/` and can be deployed to any static host
(Vercel, Netlify, GitHub Pages, etc.).

## Project structure

```
inkwell-react-vite/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles.css
    ├── components/
    │   ├── CanvasBoard.jsx   # drawing engine: pen/eraser/text/image objects, undo/redo
    │   └── Toolbar.jsx       # sidebar controls
    └── utils/
        └── exporters.js      # PDF / DOCX / TXT export logic
```

---
© 2026 — developed and designed by Aditya
