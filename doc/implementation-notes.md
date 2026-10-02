# Implementation notes — Fluid Pressure and Flow

Architecture and the decisions behind it. The physics is in
[`model.md`](model.md); this is about how the code is arranged and why.

## The shape of the codebase

```
src/
  FluidPressureAndFlowColors.ts      every ProfileColorProperty
  FluidPressureAndFlowConstants.ts   named SI constants
  FluidPressureAndFlowNamespace.ts
  i18n/            StringManager + strings_{en,es,fr}.json
  preferences/     PreferencesModel, PreferencesNode, queryParameters
  common/
    model/         shared base model, sensors, units, air pressure, fluid colour
    view/          instruments, backdrop, accordion boxes, unit slider, ruler
  under-pressure/  model/ + view/    Screen 1
  flow/            model/ + view/    Screen 2
  water-tower/     model/ + view/    Screen 3
```

Screen folders are kebab-case, each with `model/` and `view/`, and `model/` never
imports from `view/`. This is the fleet convention
([Baton/CONVENTIONS.md](https://github.com/OpenLyceum/Baton/blob/main/CONVENTIONS.md) §2).

## What is shared, and why

`common/model/FluidPressureAndFlowModel.ts` is an abstract base carrying the
state all three screens have: gravity, fluid density, unit system, the atmosphere
toggle, and the instruments. Screens differ in exactly one thing — where pressure
comes from — so that is the single abstract method (`getPressureAt`), and the air
column, sensor refresh and reset live in the base.

This is the direct answer to PhET's own review of the upstream sim
([#323](https://github.com/phetsims/fluid-pressure-and-flow/issues/323),
[#331](https://github.com/phetsims/fluid-pressure-and-flow/issues/331),
[#312](https://github.com/phetsims/fluid-pressure-and-flow/issues/312)), which
found "significant duplication of code, particularly in the model" and shelved
the sim over it. Upstream repeats the three-way above-ground / outside / in-water
pressure branch verbatim in every pool class; here it is written once in
`under-pressure/model/Pool.ts`, and subclasses supply only geometry.

The same consolidation happens in the view. Upstream has a four-class quartet — a
view, a back, a grid and a water node — for each of four pools. Here one
`PoolNode` draws all four, because the model already exposes each vessel's
outline and its water outline as shapes, and nothing in the drawing needs to know
which vessel it is looking at.

`FluidDensityAccordionBox` and `GravityAccordionBox` are the two classes PhET's
review asked for by name and never got; upstream assembles those boxes inline in
each of the three ScreenViews.

## Sensors

`Sensor<T>` holds a position and a last reading, and computes nothing. Only the
screen model knows the pool shape, the pipe geometry or the water column that
determines a reading, so sampling lives there — which is what lets one
`Barometer` class serve all three screens.

A reading can change without the clock advancing: moving the probe, changing the
fluid, reshaping the pipe, flipping the atmosphere off. Each screen model links
those to `updateSensorValues()`, and also calls it once per `step`.

The toolbox holds *drawings* of the instruments, not the instruments themselves.
Pressing one activates a real sensor and hands the press straight to its node
(`BarometerNode.grabFromToolbox`), so the instrument follows the pointer out of
the tray in one motion. Keeping the stowed and the placed instrument as separate
nodes avoids reparenting between the panel's coordinate frame and the play
area's.

## Units

The model is SI throughout; `common/model/units.ts` holds a `UnitSystem`
enumeration with one linear conversion per quantity, applied only at display
time. Doing it the other way round — a Property whose units change under the
physics — is the classic way to get a bug that shows up as a wrong number on one
screen and nowhere else.

`UnitSystem` deliberately does **not** know about strings. A view passes in the
localized abbreviations (`UnitSystem.labels(groups)`), which keeps the module
free of the i18n system and directly unit-testable — `tests/common/units.test.ts`
round-trips every quantity through every system.

## Shape caching

Two of the pools union and intersect polygons to get their outline, and
`getPressureAt` runs for every active barometer on every frame. Container shapes
are therefore built once and cached (`Pool.getContainerShape`), and water shapes
are `DerivedProperty`s over the water level — which caches them and gives the
view something to link to at the same time. The Flow screen's pipe does the same
with an explicit `shapeVersionProperty`, because its shape depends on fourteen
separate Properties and everything downstream wants one dependency, not fourteen.

## Canvas for particles

Both the Flow screen's tracers and the Water Tower's drops are drawn on a
`CanvasNode` rather than as one node apiece. There can be several hundred at
once, all moving every frame; a scene-graph node each means several hundred
transform updates per frame, which is upstream's long-standing performance
complaint ([#140](https://github.com/phetsims/fluid-pressure-and-flow/issues/140),
[#254](https://github.com/phetsims/fluid-pressure-and-flow/issues/254)). The
canvas has to be told to repaint, which each ScreenView does in `step`.

Flow tracers store their height as a **fraction** of the pipe's local height, not
as a `y`. A tracer carried into a constriction must be squeezed toward the
centreline along with the streamlines; keeping the fraction fixed and deriving
`y` does that for free, whereas tracking `y` would let tracers pass through the
wall as the pipe closes around them.

## Time stepping

The Flow screen clamps `dt` and scales it for slow motion, then integrates
directly. The Water Tower screen instead accumulates real time and consumes it in
**fixed 0.016 s bites**, because a drop carries the volume that left during the
step it was born in — if the step length varied with the frame rate, the drops
would change size with it. Upstream's Java version handled this by skipping every
third frame for slow motion, which quantised the slowdown to integer factors; the
accumulator does not.

## Deliberate departures from upstream

- **Fleet-default `layoutBounds`** (1024 × 618), not upstream's legacy 768 × 504.
  Upstream kept those only for PhET-iO back-compatibility, which does not apply
  here. Every view-pixel constant was recalibrated for the larger frame; because
  the new aspect ratio is wider (1.66 vs 1.52), no single factor served all three
  screens. Under Pressure and Water Tower are limited by height and scale by
  618/504, spending the extra width on clearance around the right-hand control
  column. Flow is limited by width and scales by 1024/768, because its bitmap
  pipe heads are pinned to the layout edges while the spline middle spans a fixed
  model range — at the old 50 px/m the spline would stop short of the right head.
  Chrome deliberately did **not** scale: panel content widths, instrument bodies
  and gauge radii are unchanged, so the play area gained room at chrome's expense.
- **Vector artwork throughout.** No raster assets: `kite` shapes, gradients, and
  scenery-phet's `FaucetNode`, `MeasuringTapeNode`, `RulerNode`, `GaugeNode` and
  `TimeControlNode`. This also closes upstream
  [#333](https://github.com/phetsims/fluid-pressure-and-flow/issues/333),
  [#306](https://github.com/phetsims/fluid-pressure-and-flow/issues/306) and
  [#279](https://github.com/phetsims/fluid-pressure-and-flow/issues/279).
- **A local cubic spline** (`flow/model/spline.ts`) replaces upstream's bundled
  `numeric.js` global, which was duplicated across two PhET repos
  ([#206](https://github.com/phetsims/fluid-pressure-and-flow/issues/206)).
- **Full keyboard and screen-reader support**, which upstream has none of. Every
  interactive node carries an `accessibleName` from the `a11y` string group; every
  `DragListener` is paired with a `KeyboardDragListener`; each screen has a
  `ScreenSummaryContent` with a live details paragraph and an explicit
  `pdomOrder`.
- **Dynamic locale from day one** — upstream's publication blocker
  [#341](https://github.com/phetsims/fluid-pressure-and-flow/issues/341). Three
  locales ship, with build-time key parity enforced in `StringManager.ts`.
- **Colours go through `FluidPressureAndFlowColors.ts`**, which is where the
  water/sky contrast question
  ([#327](https://github.com/phetsims/fluid-pressure-and-flow/issues/327)) can be
  addressed in one place.

## Colour profile

This sim's **default profile is light**, which is unusual for the fleet. All three
screens are an outdoor scene with sky above and earth below, and the pressure
story only reads if "above ground" and "below ground" are obviously different
places. Projector mode lightens the ground and strengthens every stroke rather
than inverting anything.

The water's colour is not a profile colour: it is a continuous function of fluid
density (`common/model/fluidColor.ts`), so it cannot be a fixed pair of values.
The stroke around it is a profile colour, since that stays constant.

## Object lifetime

Each screen's model, view and screen-summary content are created once and live as long as the
sim. Their `link`s and `DerivedProperty`s (for example the six links in `WaterTowerModel` and the
seven in `UnderPressureScreenView`) connect objects that are torn down together, never, so they are
not unlinked and those classes do not dispose them. Nodes created and removed at runtime must dispose
what they attach; the leak suite covers the screen models.

## Tests

`tests/` mirrors `src/`. The suites worth knowing about:

| Suite | What it protects |
|---|---|
| `common/airPressure` | both anchors of the air column and its linearity |
| `common/units` | every quantity round-trips through every unit system |
| `under-pressure/pressure` | one test per learning goal, including shape-independence |
| `under-pressure/ChamberPoolModel` | the press, and the 5:1 coupling ratio |
| `flow/spline` | interpolation, natural end condition, clamping |
| `flow/Pipe` | continuity, the minimum-height clamp, the friction profile |
| `flow/bernoulli` | constant total head, no negative pressure, tracer containment |
| `water-tower/torricelli` | `v = √(2gh)`, its two independences, volume conservation |
| `memory-leak` | dispose regressions on the three screen models |

Several of these encode claims the sim makes *to a student*. If one breaks, the
sim is teaching something false — a worse failure than a crash, and a quieter one.
