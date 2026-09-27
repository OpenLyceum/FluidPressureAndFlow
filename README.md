# Fluid Pressure and Flow

An interactive physics simulation about pressure in fluids at rest and in motion:
how pressure grows with depth, why a fluid speeds up through a constriction, and
how fast water leaves a hole in a tank.

A SceneryStack recreation of the [PhET Interactive
Simulations](https://phet.colorado.edu/) simulation of the same name.

## Features

- **Under Pressure** — hydrostatics in four vessels: a plain pool, a pair of
  trapezoidal chambers that prove pressure does not care about shape, a
  Pascal's-principle press, and a mystery pool where the fluid density or the
  planet's gravity has to be worked out from a barometer reading.
- **Flow** — an incompressible fluid through a pipe you reshape by dragging its
  wall. Marker dots and an injectable grid make the velocity field visible;
  barometers, speedometers and a flux meter make continuity and Bernoulli's
  equation measurable.
- **Water Tower** — Torricelli's law and the parabola that follows from it. Open
  the hole, raise the tank, attach a hose and aim it, and measure the jet.
- Three unit systems — metric, atmospheres and imperial — across every readout,
  optionally matched across all three screens.
- Full keyboard navigation and screen-reader support, in English, Spanish and
  French.
- Installable and playable offline as a Progressive Web App.

## Quick Start

```bash
npm install
npm start
```

Then open the URL Vite prints (by default <http://localhost:5173>).

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest unit tests (includes memory-leak suite) |
| `npm run test:fuzz` | Optional Playwright fuzz smoke: pointer (`?fuzz`) + keyboard (`?fuzzBoard`), with `?ea`, 30s each |
| `npm run test:fuzz -- 90` | Same fuzz for 90 seconds (`--duration 90` or `FUZZ_DURATION=90` also work) |
| `npm run test:fuzz:quick` | Shorter fuzz smoke (10s) |
| `npm run test:fuzz:long` | Longer fuzz smoke (300s) |
| `npm run check` | TypeScript type check |
| `npm run lint` | Biome lint check |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |
| `npm run clean` | Remove `dist/` |

## Tech Stack

- [SceneryStack](https://scenerystack.org/) — scenery, kite, dot, axon, sun,
  scenery-phet and joist
- TypeScript, Vite, Vitest, Playwright, Biome
- `vite-plugin-pwa` for offline support

## License

MIT. See the [organization
defaults](https://github.com/OpenLyceum/.github/blob/main/LICENSE).

## Contributing

See the [organization contributing
guide](https://github.com/OpenLyceum/.github/blob/main/CONTRIBUTING.md).
Physics and architecture are documented in [`doc/model.md`](doc/model.md) and
[`doc/implementation-notes.md`](doc/implementation-notes.md); attribution for the
original simulation is in [`CREDITS.md`](CREDITS.md).
