# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser-based tool for decomposing and validating Brazilian electronic fiscal document access keys (chave de acesso). Parses 44-digit keys into structured fields (UF, CNPJ, model, series, etc.) with Mod 11 check digit validation. Supports 8 document models: NF-e, CT-e, NFC-e, MDF-e, BP-e, CF-e SAT, NF3e, CT-e OS.

100% client-side, zero runtime dependencies, no API calls, no database.

## Commands

```bash
npm run dev       # Vite dev server (localhost:5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

No test framework, linter, or type checker is configured.

## Architecture

Vanilla JS (ES modules) + Vite 6.2.0. No framework.

### Source Layout (`src/`)

- **`js/chave-acesso.js`** — Core domain logic: parsing, validation (Mod 11), lookup tables (`ESTADOS`, `MODELOS`, `TIPOS_EMISSAO`, `SEGMENTS`). Pure functions, no side effects.
- **`js/app.js`** — UI: state management, DOM rendering, event binding. Renders entirely from a plain JS state object (`tabs[]`, `activeTabId`, `historyOpen`, etc.). Full re-render on every state change.
- **`js/history.js`** — localStorage-based history (max 10 items) with dedup and relative time formatting.
- **`js/theme.js`** — Dark/light theme via `data-theme` attribute, persisted in localStorage, auto-detects system preference.
- **`js/analytics.js`** — GA4 event tracking (graceful no-op if blocked).
- **`js/icons.js`** — Inline SVG icon functions.
- **`css/styles.css`** — All styling. Uses CSS custom properties for theming (dark/light) and segment colors (`--seg-uf`, `--seg-cnpj`, etc.).
- **`index.html`** — Entry point with SEO meta tags, JSON-LD structured data, and static fallback content.

### Key Patterns

- **State-driven rendering**: `app.js` maintains a state object and calls `render()` to rebuild the DOM. `bindEvents()` reattaches listeners after each render.
- **Segment coloring**: Each of the 10 key segments has a CSS variable (`--seg-uf`, `--seg-ano`, etc.) mapped in `SEG_COLORS` in `app.js` and `SEGMENTS` in `chave-acesso.js`.
- **Multi-tab**: Up to 15 tabs (`MAX_TABS`), each with independent chave/parsed/validation state. Auto-closes oldest tab when limit is reached.
- **URL sharing**: `?chave=...&chave=...` query params load keys into tabs on init.
- **Global paste**: Ctrl+V anywhere on the page triggers key input.

### Build Config

Vite root is `src/`, base path is `/` (custom domain `chaveacesso.heidiks.com`), public assets in `public/`, output to `dist/`. The `public/CNAME` file ensures GitHub Pages uses the custom domain on each deploy.

## Deployment

GitHub Actions (`.github/workflows/static.yml`) builds and deploys to GitHub Pages on push to `master`. Uses Node 20. Custom domain: `chaveacesso.heidiks.com`.

## Language

The project UI, README, and code comments are in Brazilian Portuguese. Variable names and function names are in Portuguese (e.g., `calcularDigitoVerificador`, `formatarCnpj`, `validarDigito`).
