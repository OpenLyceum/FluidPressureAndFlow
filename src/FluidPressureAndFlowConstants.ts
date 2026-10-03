/**
 * FluidPressureAndFlowConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation. Bare numbers that carry semantic meaning (sizes, margins,
 * physics defaults, ranges) belong here rather than inline in model or view
 * code, so they are named, documented, and changed in one place.
 *
 * Conventions
 * ───────────
 *  - Physics / model values use SI units (metres, seconds, kilograms, …);
 *    note the unit in a comment on each value.
 *  - Layout / chrome values are in screen pixels.
 *  - Colour strings live in FluidPressureAndFlowColors.ts, not here.
 *
 * Model coordinate convention (all three screens)
 * ───────────────────────────────────────────────
 *  - +x points right, +y points UP, and y = 0 is ground level.
 *  - Pools on the Under Pressure screen therefore occupy y ∈ [-3, 0].
 *  - The ModelViewTransform2 in each ScreenView flips y for the view.
 *
 * Values are taken from the PhET "Fluid Pressure and Flow" Java source and its
 * HTML5 port; see doc/model.md for the provenance of each group.
 */

import { Bounds2, Range, Vector2 } from "scenerystack/dot";
import FluidPressureAndFlowNamespace from "./FluidPressureAndFlowNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/**
 * Play-area bounds for all three screens: the fleet default.
 *
 * Upstream drew everything against 768 × 504, so each screen's view-pixel
 * geometry — ground line, metres-per-pixel, pipe-head insets, artwork scales —
 * was recalibrated for this frame. The new frame is relatively wider (aspect
 * 1.66 vs 1.52), so no single factor fits both axes:
 *
 *  - Under Pressure and Water Tower are limited by height, and use 618/504.
 *    Their extra width becomes clearance between the scene and the right-hand
 *    control column.
 *  - Flow is limited by width, and uses 1024/768. Its spline middle spans a
 *    fixed model range, with bitmap pipe heads anchored to the end sections.
 *    Its metres-per-pixel tracks the width to keep those ends near the edges.
 *
 * Chrome does not scale with the frame — panel content widths, instrument
 * bodies, gauge radii. Holding those fixed while the play area grows is what
 * the larger frame buys.
 */
export const LAYOUT_BOUNDS = new Bounds2(0, 0, 1024, 618);

/**
 * Margin between the screen edge and edge-anchored controls (e.g. Reset All).
 *
 * Tight, because on Under Pressure the right-hand column is nearly full: a tools
 * panel, a units chooser and two expanded sliders stacked above Reset All. Every
 * pixel spent on the outer margin is one the sliders do not have.
 */
export const SCREEN_VIEW_MARGIN = 10;

/** Corner radius shared by control panels and dialogs. */
export const PANEL_CORNER_RADIUS = 6;

/** Vertical spacing between stacked control panels along the right edge. */
export const PANEL_SPACING = 8;

// ── Gravity (m/s²) ────────────────────────────────────────────────────────────

/** Surface gravity of Earth. The default for every screen. */
export const EARTH_GRAVITY = 9.8;

/** Surface gravity of Mars — the low end of the gravity slider. */
export const MARS_GRAVITY = 3.71;

/** Surface gravity of Jupiter — the high end of the gravity slider. */
export const JUPITER_GRAVITY = 24.79;

/** Range spanned by the gravity slider, labelled Mars / Earth / Jupiter. */
export const GRAVITY_RANGE = new Range(MARS_GRAVITY, JUPITER_GRAVITY);

// ── Fluid density (kg/m³) ─────────────────────────────────────────────────────

/** Density of gasoline — the low end of the fluid-density slider. */
export const GASOLINE_DENSITY = 700;

/** Density of water. The default for every screen. */
export const WATER_DENSITY = 1000;

/** Density of honey — the high end of the fluid-density slider. */
export const HONEY_DENSITY = 1420;

/** Range spanned by the fluid-density slider, labelled gasoline / water / honey. */
export const DENSITY_RANGE = new Range(GASOLINE_DENSITY, HONEY_DENSITY);

// ── Atmospheric pressure (Pa) ─────────────────────────────────────────────────

/** Standard atmospheric pressure at sea level (y = 0). */
export const EARTH_AIR_PRESSURE = 101325;

/**
 * Atmospheric pressure at the top of the modelled air column.
 * PhET names this constant "at 500 ft" but interpolates it over 0–150 m; the
 * discrepancy is inherited deliberately so readouts match upstream. See
 * doc/model.md § "Known simplifications".
 */
export const AIR_PRESSURE_AT_MAX_ALTITUDE = 99490;

/** Altitude (m) at which the air pressure reaches AIR_PRESSURE_AT_MAX_ALTITUDE. */
export const MAX_MODELLED_ALTITUDE = 150;

// ── Pressure readout ──────────────────────────────────────────────────────────

/** Range of the barometer dial (Pa). Values outside it peg the needle. */
export const PRESSURE_RANGE = new Range(50000, 250000);

// ── Under Pressure screen ─────────────────────────────────────────────────────

/** Depth (m) of every pool on the Under Pressure screen. */
export const MAX_POOL_HEIGHT = 3;

/** Number of barometers available on the Under Pressure screen. */
export const NUMBER_OF_BAROMETERS = 4;

// ── Flow screen ───────────────────────────────────────────────────────────────

/**
 * Range of the pipe flow-rate slider, in m³/s. Displayed as 1000–10000 L/s.
 * The upper bound is held down deliberately: a faster flow through a narrow
 * pipe drives Bernoulli's -½ρv² term below zero. See doc/model.md.
 */
export const FLOW_RATE_RANGE = new Range(1, 10);

/** Initial pipe flow rate (m³/s), i.e. 5000 L/s. */
export const DEFAULT_FLOW_RATE = 5;

/**
 * Flow screen model-view mapping. The HTML5 reference in totality
 * (`FlowScreenView.js`) puts the model origin at view (370, 140) with 50 view px
 * per metre; these are those values widened by 1024/768 for this frame. The
 * bitmap pipe heads use the same mapping as the spline's end sections.
 */
export const FLOW_MODEL_VIEW_ANCHOR = new Vector2(493, 187);

export const FLOW_VIEW_SCALE = 66.67;

/** Canvas bounds for pipe tracers; upstream `ParticleCanvasNode` options, widened. */
export const FLOW_PARTICLE_CANVAS_BOUNDS = new Bounds2(27, 107, 1067, 800);

// ── Keyboard interaction ─────────────────────────────────────────────────────

/**
 * Divisor applied to a draggable's keyboard speed while Shift is held, shared by
 * every KeyboardDragListener in the sim (sensors, tools, masses, the hose, the
 * pipe handles). Holding Shift halves-then-some the speed for fine positioning.
 */
export const SHIFT_KEY_SPEED_DIVISOR = 4;

// ── Time stepping ─────────────────────────────────────────────────────────────

/**
 * Largest dt (s) any screen will integrate in one call. Browser tab switches and
 * slow frames produce huge dt values that would otherwise tunnel particles
 * straight through the pipe or the water tower wall.
 */
export const MAX_DT = 0.04;

/** Multiplier applied to dt when the user selects "Slow Motion". */
export const SLOW_MOTION_FACTOR = 0.33;

FluidPressureAndFlowNamespace.register("FluidPressureAndFlowConstants", {
  LAYOUT_BOUNDS,
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  PANEL_SPACING,
  EARTH_GRAVITY,
  MARS_GRAVITY,
  JUPITER_GRAVITY,
  GRAVITY_RANGE,
  GASOLINE_DENSITY,
  WATER_DENSITY,
  HONEY_DENSITY,
  DENSITY_RANGE,
  EARTH_AIR_PRESSURE,
  AIR_PRESSURE_AT_MAX_ALTITUDE,
  MAX_MODELLED_ALTITUDE,
  PRESSURE_RANGE,
  MAX_POOL_HEIGHT,
  NUMBER_OF_BAROMETERS,
  FLOW_RATE_RANGE,
  DEFAULT_FLOW_RATE,
  FLOW_MODEL_VIEW_ANCHOR,
  FLOW_VIEW_SCALE,
  FLOW_PARTICLE_CANVAS_BOUNDS,
  SHIFT_KEY_SPEED_DIVISOR,
  MAX_DT,
  SLOW_MOTION_FACTOR,
});
