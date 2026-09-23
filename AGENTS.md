# AGENTS.md — Fluid Pressure and Flow

Sim-specific context for AI assistants. General SceneryStack guidance:
[OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## What this is

A SceneryStack recreation of PhET's **Fluid Pressure and Flow** — three screens:
Under Pressure, Flow, Water Tower.

PhET's own HTML5 port
([phetsims/fluid-pressure-and-flow](https://github.com/phetsims/fluid-pressure-and-flow))
has **never been published**. PhET's 2019 evaluation
([#323](https://github.com/phetsims/fluid-pressure-and-flow/issues/323)) found
"significant duplication of code, particularly in the model", retracted its own
effort estimate, and shelved the sim; no design or model work has happened since.
This is a rebuild to fleet conventions rather than a transliteration, and several
of the architectural choices here are direct answers to that review — see
`doc/implementation-notes.md` § "What is shared, and why".

**Read `doc/model.md` before touching any physics.** Its "Known simplifications"
section lists ten places where the model deliberately is not the physics. Most
are inherited from PhET and most look like bugs until you read why they are
there. Two in particular have tests pinning the current behaviour so that
changing them is deliberate: the chamber pool's 5:1 width coupling, and the fact
that the Flow screen's friction checkbox does not affect pressure or flux.

## Ground truth

The PhET Java source is available locally and was the primary reference:

```
Baseline/PhET/trunk/simulations-java/simulations/fluid-pressure-and-flow/
  src/edu/colorado/phet/fluidpressureandflow/   103 .java files
  doc/model.txt  doc/implementation-notes.txt
  doc/FluidPressureandFlow-DesignDoc-6-13-2012.pdf   (pdftotext -layout)
  screenshots/                                       layout reference
```

Geometry and constants come from there; the Mystery pool and a few constants come
from the HTML5 repo, which is reachable with `gh api`.

## Key files

| File | Purpose |
|---|---|
| `src/common/model/FluidPressureAndFlowModel.ts` | Abstract base: gravity, density, units, atmosphere, sensors. `getPressureAt` is the only abstract method. |
| `src/common/model/units.ts` | `UnitSystem` enumeration; all conversion, display-time only |
| `src/common/model/airPressure.ts` | The linear air column |
| `src/common/model/fluidColor.ts` | Density → colour, and the mystery purples |
| `src/under-pressure/model/Pool.ts` | The three-way pressure branch, written once |
| `src/flow/model/Pipe.ts` | Spline wall, continuity, the friction profile |
| `src/flow/model/spline.ts` | Natural cubic spline; replaces upstream's `numeric.js` |
| `src/water-tower/model/WaterTowerModel.ts` | Torricelli, drops, fixed timestep |
| `src/under-pressure/view/PoolNode.ts` | Draws all four pools from model shapes |
| `src/common/view/SensorToolboxNode.ts` | Tray; hands presses to instrument nodes |

## Conventions that bite here

- **Model is SI throughout.** Never convert inside `model/`. `formatValue` and
  `toDisplayValue` in `units.ts` are the only places conversion happens.
- **`+y` is up, `y = 0` is ground.** Every screen. The `ModelViewTransform2` in
  each ScreenView flips it; nothing else does its own arithmetic.
- **Shape caching matters.** `getPressureAt` runs per barometer per frame and
  two pools use polygon boolean ops. Container shapes are cached; water shapes
  are `DerivedProperty`s. Don't build shapes in a hot path.
- **Flow tracers store a fraction, not a `y`.** Changing that would let them
  pass through the pipe wall as it closes.
- **Canvas for particles.** Both dynamic screens draw their particles on a
  `CanvasNode` and call `invalidatePaint()` from the ScreenView's `step`.

## Compliance carve-outs

- **Constants are partly nested.** `FluidPressureAndFlowConstants.ts` holds the
  cross-cutting SI values, but each pool's and the pipe's geometry lives as
  documented module constants in its own model file. Pool geometry is meaningless
  outside the pool that has it, and hoisting it to the root file would separate
  fourteen numbers from the only code that can explain them. This is the
  documented "nested constants" variation in Baton CONVENTIONS §2.
- **The default colour profile is light.** All three screens are an outdoor
  scene; see `FluidPressureAndFlowColors.ts` for the reasoning. `background_color`
  in the PWA manifest is correspondingly not black.
- **Hardcoded colors:** a few scene paints stay as literals because they are
  physical / atmospheric tones that must not remapped with projector chrome —
  chamber drop-zone `#ffdcf0`, hose `#00FF00` / `#555555`, water-tower metal
  gradient stops, and sky `#000000` when atmosphere is off (`SkyGroundNode`,
  `HoseNode`, `WaterTowerNode`, `ChamberMassDropZoneNode`). Themeable UI chrome
  still lives in `FluidPressureAndFlowColors.ts`.

## Testing

`tests/` mirrors `src/`. Several suites encode claims the sim makes to a student
(shape-independence of pressure, `v ≠ f(ρ)`, constant total head); if one breaks,
the sim is teaching something false. Don't relax them to make a change pass.

```bash
npm run lint && npm run check && npm run build && npm test
npm run test:fuzz:quick
```

Fleet gate, from the workspace root:

```bash
bash Baton/scripts/check-repo-compliance.sh FluidPressureAndFlow
```

## Follow-up work

The upstream issue list is the backlog. Highest-value items, in order:

1. **[#314](https://github.com/phetsims/fluid-pressure-and-flow/issues/314)** —
   friction should produce a pressure drop (Hagen–Poiseuille), not just a
   velocity profile. The most substantive physics complaint against the original.
2. **[#199](https://github.com/phetsims/fluid-pressure-and-flow/issues/199)** —
   negative Bernoulli pressure; currently clamped at 0.
3. **[#322](https://github.com/phetsims/fluid-pressure-and-flow/issues/322)** —
   the barometer reads air pressure inside the hose.
4. **[#327](https://github.com/phetsims/fluid-pressure-and-flow/issues/327)** —
   water/sky contrast for colour-blind viewers. All colours are already in
   `FluidPressureAndFlowColors.ts`, so this is a one-file change.
