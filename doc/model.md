# Model — Fluid Pressure and Flow

The physics behind each screen, the values it uses, and — at the end — an honest
list of the places where the model is not the physics.

All model code works in **SI units**: pascals, metres, seconds, kilograms,
kg/m³, m/s. Conversion to the student's chosen unit system happens once, at the
moment a value is put on screen (`src/common/model/units.ts`). Nothing in
`model/` ever converts.

**Coordinates.** `+x` is to the right, `+y` is **up**, and `y = 0` is ground
level. Pools occupy `y ∈ [-3, 0]`; the water tower stands above `y = 0`. The
view's `ModelViewTransform2` flips `y`.

---

## Screen 1 — Under Pressure

Hydrostatics with nothing moving, so that depth is the only variable in play.

### Learning goals

- Pressure at depth `h` is `p = p₀ + ρgh`.
- Water pressure increases **linearly** with depth.
- Air pressure **decreases** with altitude.
- Water pressure at the surface equals the air pressure there.
- Pressure does **not** change as you move horizontally through a fluid.
- Pressure increases linearly with fluid density, and with gravity.

### Equations

Above ground, at altitude `y`:

```
p(y) = airPressure(y)
```

Underground and inside a vessel, below the free surface at `y₀`:

```
p(x, y) = airPressure(y₀) + ρ · g · (y₀ − y)
```

Underground and outside any vessel, the model reports **nothing** (`null`), and
the barometer shows a dash rather than a misleading zero.

`airPressure` is a straight line from 101 325 Pa at `y = 0` to 99 490 Pa at
`y = 150 m` (`src/common/model/airPressure.ts`), scaled by `g / 9.8` — the
weight of the air column above you scales with gravity. Switching the atmosphere
off sets it to 0 everywhere.

### Constants

| Quantity | Value |
|---|---|
| Gravity: Mars / Earth / Jupiter | 3.71 / 9.8 / 24.79 m/s² |
| Density: gasoline / water / honey | 700 / 1000 / 1420 kg/m³ |
| Sea-level air pressure | 101 325 Pa |
| Air pressure at 150 m | 99 490 Pa |
| Pool depth | 3 m |
| Barometer dial range | 50–250 kPa |

### The four vessels

**Square pool.** A plain 4 m × 3 m rectangle, starting half full, with a fill tap
and a drain. The control case: nothing varies but depth.

**Trapezoid pool.** Two chambers of opposite taper — one narrow at the top and
wide at the floor, one wide at the top and narrow at the floor — joined by a
0.25 m passage along the bottom, so they hold one connected body of water. Put a
barometer in each at the same depth and they agree, even though the volume of
water standing above them differs enormously. This is the "pressure does not
depend on the shape of the container" goal, made falsifiable and then not
falsified.

**Chamber pool.** A hydraulic press: a 0.5 m-wide shaft and a 2.5 m-wide one,
dropping into chambers joined along the floor. Three stackable weights (one
500 kg, two 250 kg) go on the narrow column and the wide one rises. See "Known
simplifications" below — this scene has two.

**Mystery pool.** The square pool with one number hidden. The student picks an
unlabelled fluid (1700, 840 or 1100 kg/m³) or an unnamed planet (20, 14 or
6.5 m/s²); the corresponding slider disappears and the value has to be recovered
by reading a barometer at a known depth and inverting `p = p₀ + ρgh`. Only ever
one unknown at a time — two would leave one equation and two unknowns.

---

## Screen 2 — Flow

An incompressible, inviscid, steady flow through a pipe the student reshapes.

### Learning goals

- `P + ½ρv² + ρgy` is constant along a streamline (Bernoulli).
- Fluid moves **faster** through a constriction.
- Pressure is **lower** in a constriction.
- Fluid is conserved, redistributed by the shape of the container (continuity).
- Screen 1's goals still hold in a moving fluid.

### Equations

Continuity fixes the speed from the flow rate `Q`:

```
v(x) = Q / A(x),        A(x) = π · (h(x)/2)²
```

where `h(x)` is the pipe's height at `x`. The pipe is treated as a **circular
duct seen in section**, not as the two-dimensional slot it is drawn as. That is a
deliberate choice inherited from PhET: a slot's area would go as `h`, and the
quadratic is what makes the speed-up large enough to notice.

Bernoulli gives the pressure:

```
P(x, y) = P₀ − ρ · g · y − ½ · ρ · v²
```

with `P₀` sea-level air pressure and `g` fixed at Earth's (this screen has no
gravity control). Outside the pipe, or within 0.05 m of the wall, the model
reports nothing.

The wall is a **natural cubic spline** through seven draggable cross-sections
(`src/flow/model/spline.ts`), sampled at 70 points. Straight lines between the
handles would put a corner — and so a discontinuity in area, speed and pressure —
at every one.

The **friction** checkbox adds a laminar velocity profile and a
Hagen–Poiseuille resistance. At a fixed slider (pump) setting, a narrower pipe
therefore carries less fluid, and static pressure falls downstream.

**Flux meter**: `flux = Q / A(x)`, shown alongside `A(x)` and `Q` so the three
can be watched trading off.

### Constants

| Quantity | Value |
|---|---|
| Cross-sections | 7, at x = −6 … 6 m, spacing 2 m |
| Initial pipe | y ∈ [−3, −1], i.e. 2 m tall |
| Flow rate range | 1–10 m³/s (1000–10 000 L/s), default 5 |
| Minimum pipe height | 1 m |
| Handle limits | −4 ≤ y ≤ 0 |
| Tracer drip rate | 10 per second, at fractions 0.15–0.85 |
| Injected grid | 4 columns × 9 rows, 0.2 m apart, 4 s lockout |

---

## Screen 3 — Water Tower

Torricelli's law, and the projectile that follows from it.

### Learning goals

- Efflux speed is `v = √(2gh)`, with `h` the head above the outlet.
- `v = f(g, h)` and `v ≠ f(ρ, y)` — the speed does **not** depend on the fluid,
  nor on how much water is in the tank.
- Bernoulli again, as it pertains to Torricelli.

### Equations

```
v = √(2 · g · h),       h = (free surface) − (outlet)
```

The outlet is the hole in the tank's side, or the hose nozzle when the hose is
attached. Volume leaving per step is `v · A_eff · dt`, and each step emits one
drop carrying exactly that volume — so the tank loses precisely what the drops
take away. Drops then fly ballistically under `g`.

Pressure in the tank is hydrostatic, as on screen 1. Inside an attached hose it
follows the same hydrostatic elevation term relative to the open nozzle; in the
free jet it is atmospheric. The hose's cached SI outline is shared by pressure
sampling and rendering, including its stepped riser and bends.

There is deliberately **no gravity control** on this screen. PhET's design
document is explicit: a student should be able to *measure* `g` from the efflux
speed and the drop height, which they cannot do if a slider hands it to them.

### Constants

| Quantity | Value |
|---|---|
| Tank radius / height | 5 m / 10 m |
| Tank base altitude | 6–15 m, starting at 11 m |
| Initial fill | 80 % of capacity |
| Hole diameter | 1 m |
| Effective outlet area | 2.8 m² (tuned; see below) |
| Internal timestep | 0.016 s, fixed |
| Hose nozzle | x = 17 m, angle-dependent ground clearance ≤ y ≤ 14 m, angle ∈ [0, π/2] |

---

## Known simplifications

Every item here is a place where the sim is deliberately not the physics. Most
are inherited from PhET's original, and each is kept because changing it would
cost more pedagogically than it would gain in rigour — but a reader should not
have to reverse-engineer that from the code.

**1. The chamber pool couples its columns by width, not by area.**
Pascal's principle relates the two columns by their *areas*, which for these
openings would be a ratio of 25:1. At that ratio the wide column barely twitches
and the effect the scene exists to show is invisible. The model uses the ratio of
the openings' *widths* (5:1) instead. `ChamberPoolModel`.

**2. The chamber pool relaxes rather than oscillates.**
With the weights removed, the columns return to level by shedding a tenth of the
remaining displacement per step. A physical coupled-fluid relaxation would ring,
and a ringing water column reads as a bug. `ChamberPoolModel.step`.

**3. The chamber pool's stack balance is dimensionally inconsistent.**
The upward term on the stack of weights is `ρgh`, which is a pressure, not a
force — the contact area is missing. This is upstream's formulation; correcting
it in isolation would change the tuning of the whole scene without changing what
it teaches. Marked in `ChamberPoolModel.stepMasses`.

**4. Air pressure scales with gravity.**
`airPressure(y) · g / 9.8`. Defensible — the weight of the air column does scale
with `g` — but it also means changing gravity moves the *offset* at the top of
the water as well as the `ρgh` term, which is more than the learning goal asks
for.

**5. The air column is linear, and its endpoint is mislabelled.**
The interpolation runs from 101 325 Pa at 0 m to 99 490 Pa at **150 m**, but the
constant that value came from is documented upstream as "air pressure at 500 ft"
(≈152.4 m). The discrepancy is under a readout digit over the ~30 m the sim
actually exposes, and the value is kept so readouts match upstream.

**6. Friction is a relative, not material-specific, viscosity model.**
It uses the Hagen–Poiseuille fourth-power radius relationship to produce a
pressure loss and reduced flow through a constriction, but the single checkbox
does not expose a viscosity value or differentiate water from honey.

**7. Pressure on the Flow screen is clamped at zero.**
Bernoulli's `−½ρv²` term can be driven negative in a narrow, fast pipe. Negative
pressure is meaningless; it is a sign the model has left its domain. The pipe's
1 m minimum height is the upstream mitigation and is known to be insufficient
([#199](https://github.com/phetsims/fluid-pressure-and-flow/issues/199)), so the
reported value is additionally clamped at 0.

**8. The hose has a constant-speed approximation.**
The static pressure changes with elevation through the hose and equals ambient
pressure at the open nozzle, but bends and wall losses in the hose are omitted.

**9. The Water Tower's outlet area is tuned, not derived.**
`A_eff = 2.8 m²` is not `π(d/2)²`. A real orifice discharges less than its
geometric area because the jet contracts just outside it; this value is chosen so
the tank empties at a watchable rate. It sets the pace of the screen, not any of
its physics — `v = √(2gh)` is untouched by it.

**10. Pool filling tracks level, not volume.**
The fill tap raises the water *level* at a constant rate. In the trapezoid pool a
constant volumetric inflow would raise the level at a varying rate, and watching
it crawl then race would suggest that the vessel's shape matters to the pressure
— which is the opposite of the scene's point.

---

## Provenance

Ported from PhET Interactive Simulations' **Fluid Pressure and Flow**, which
exists as a published Java simulation and as an unpublished HTML5 port
([phetsims/fluid-pressure-and-flow](https://github.com/phetsims/fluid-pressure-and-flow)).
Geometry, constants and the learning goals above come from the Java source and
its 2012 design document; the Mystery pool and several constants come from the
HTML5 port. Both were read directly rather than transcribed from the running sim.
