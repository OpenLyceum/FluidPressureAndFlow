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

/** Settings for common/FluidPressureAndFlowControlOptions.ts. */
export const FLUID_PRESSURE_AND_FLOW_CONTROL_OPTIONS_SETTINGS = {
  /** Slider thumb size width (px). */
  SLIDER_THUMB_SIZE_WIDTH: 12,
  /** Slider thumb size height (px). */
  SLIDER_THUMB_SIZE_HEIGHT: 22,
  /** Standalone slider track size width (px). */
  STANDALONE_SLIDER_TRACK_SIZE_WIDTH: 150,
  /** Standalone slider track size height (px). */
  STANDALONE_SLIDER_TRACK_SIZE_HEIGHT: 3,
  /** Number control slider track size width (px). */
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_WIDTH: 110,
  /** Number control slider track size height (px). */
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_HEIGHT: 3,
  /** Checkbox box width (px). */
  CHECKBOX_BOX_WIDTH: 16,
  /** Number control options scale (dimensionless). */
  NUMBER_CONTROL_OPTIONS_SCALE: 0.75,
  /** Number control options slider padding (px). */
  NUMBER_CONTROL_OPTIONS_SLIDER_PADDING: 4,
  /** Number control options arrow button spacing (px). */
  NUMBER_CONTROL_OPTIONS_ARROW_BUTTON_SPACING: 3,
  /** Number control options vertical spacing (px). */
  NUMBER_CONTROL_OPTIONS_VERTICAL_SPACING: 4,
  /** Checkbox options spacing (px). */
  CHECKBOX_OPTIONS_SPACING: 4,
} as const;

/** Settings for common/FluidPressureAndFlowPanel.ts. */
export const FLUID_PRESSURE_AND_FLOW_PANEL_SETTINGS = {
  /** Options x margin (px). */
  OPTIONS_X_MARGIN: 10,
  /** Options y margin (px). */
  OPTIONS_Y_MARGIN: 7,
} as const;

/** Settings for common/FluidPressureAndFlowScreenIcons.ts. */
export const FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS = {
  LINING_X_LINE_TO_Y: 320, // px
  LINING_X_SEGMENT_2: 325, // px
  LINING_Y_SEGMENT_2: 320, // px
  PROBE_TUBE_X_LINE_TO_Y: 263, // px
  PROBE_TUBE_X_SEGMENT_2: 235, // px
  PROBE_TUBE_Y_SEGMENT_2: 263, // px
  PIPE_SHAPE_X_SEGMENT_2: 130, // px
  PIPE_SHAPE_CONTROL_1_X_SEGMENT_2: 338, // px
  PIPE_SHAPE_CONTROL_1_Y_SEGMENT_2: 150, // px
  PIPE_SHAPE_CONTROL_2_X_SEGMENT_2: 343, // px
  PIPE_SHAPE_CONTROL_2_Y_SEGMENT_2: 90, // px
  PIPE_SHAPE_END_X_SEGMENT_2: 418, // px
  PIPE_SHAPE_END_Y_SEGMENT_2: 90, // px
  PIPE_SHAPE_X_SEGMENT_3: 503, // px
  PIPE_SHAPE_Y_SEGMENT_2: 283, // px
  PIPE_SHAPE_X_SEGMENT_4: 418, // px
  PIPE_SHAPE_CONTROL_1_X_SEGMENT_3: 343, // px
  PIPE_SHAPE_CONTROL_1_Y_SEGMENT_3: 283, // px
  PIPE_SHAPE_CONTROL_2_X_SEGMENT_3: 338, // px
  PIPE_SHAPE_CONTROL_2_Y_SEGMENT_3: 223, // px
  PIPE_SHAPE_END_Y_SEGMENT_3: 223, // px
  PIPE_SHAPE_CONTROL_1_X_SEGMENT_4: 210, // px
  PIPE_SHAPE_CONTROL_1_Y_SEGMENT_4: 223, // px
  PIPE_SHAPE_CONTROL_2_X_SEGMENT_4: 205, // px
  PIPE_SHAPE_CONTROL_2_Y_SEGMENT_4: 283, // px
  PIPE_SHAPE_END_X_SEGMENT_3: 130, // px
  PIPE_SHAPE_END_Y_SEGMENT_4: 283, // px
  PIPE_SHAPE_X_LINE_TO_Y: 283, // px
  GROUND_Y_SEGMENT_2: 325, // px
  FRAME_X_SEGMENT_2: 95, // px
  FRAME_Y_SEGMENT_2: 325, // px
  FRAME_X_SEGMENT_3: 255, // px
  FRAME_X_SEGMENT_4: 280, // px
  FRAME_X_MOVE_TO_Y: 175, // px
  FRAME_X_SEGMENT_5: 275, // px
  FRAME_Y_SEGMENT_3: 305, // px
  FRAME_X_SEGMENT_6: 255, // px
  FRAME_Y_SEGMENT_4: 175, // px
  FRAME_X_SEGMENT_7: 100, // px
  FRAME_Y_SEGMENT_5: 305, // px
  WATER_X_SEGMENT_2: 89, // px
  WATER_Y_SEGMENT_2: 85, // px
  WATER_WIDTH_SEGMENT_2: 197, // px
  WATER_HEIGHT_SEGMENT_2: 86, // px
  SURFACE_START_X_SEGMENT_2: 89, // px
  SURFACE_START_Y_SEGMENT_2: 85, // px
  SURFACE_END_X_SEGMENT_2: 286, // px
  SURFACE_END_Y_SEGMENT_2: 85, // px

  /** Ground y (px). */
  GROUND_Y: 95,
  /** Grass y (px). */
  GRASS_Y: 87,
  /** Grass height (px). */
  GRASS_HEIGHT: 12,
  /** Pool x (px). */
  POOL_X: 65,
  /** Pool y (px). */
  POOL_Y: 60,
  /** Pool width (px). */
  POOL_WIDTH: 260,
  /** Pool height (px). */
  POOL_HEIGHT: 260,
  /** Water x (px). */
  WATER_X: 65,
  /** Water y (px). */
  WATER_Y: 135,
  /** Water width (px). */
  WATER_WIDTH: 260,
  /** Water height (px). */
  WATER_HEIGHT: 185,
  /** Surface start x (px). */
  SURFACE_START_X: 65,
  /** Surface start y (px). */
  SURFACE_START_Y: 135,
  /** Surface end x (px). */
  SURFACE_END_X: 325,
  /** Surface end y (px). */
  SURFACE_END_Y: 135,
  /** Surface line width (px). */
  SURFACE_LINE_WIDTH: 4,
  /** Lining x (px). */
  LINING_X: 65,
  /** Lining y (px). */
  LINING_Y: 60,
  /** Lining line width (px). */
  LINING_LINE_WIDTH: 12,
  /** Probe tube x (px). */
  PROBE_TUBE_X: 422,
  /** Probe tube y (px). */
  PROBE_TUBE_Y: 160,
  /** Probe tube line width (px). */
  PROBE_TUBE_LINE_WIDTH: 8,
  /** Probe radius (px). */
  PROBE_RADIUS: 12,
  /** Probe center x (px). */
  PROBE_CENTER_X: 235,
  /** Probe center y (px). */
  PROBE_CENTER_Y: 263,
  /** Probe line width (px). */
  PROBE_LINE_WIDTH: 5,
  /** Dial radius (px). */
  DIAL_RADIUS: 65,
  /** Dial center x (px). */
  DIAL_CENTER_X: 422,
  /** Dial center y (px). */
  DIAL_CENTER_Y: 105,
  /** Dial line width (px). */
  DIAL_LINE_WIDTH: 7,
  /** Ticks line width (px). */
  TICKS_LINE_WIDTH: 4,
  /** Needle start x (px). */
  NEEDLE_START_X: 422,
  /** Needle start y (px). */
  NEEDLE_START_Y: 105,
  /** Needle end x (px). */
  NEEDLE_END_X: 449,
  /** Needle end y (px). */
  NEEDLE_END_Y: 75,
  /** Needle line width (px). */
  NEEDLE_LINE_WIDTH: 7,
  /** Pipe shape x (px). */
  PIPE_SHAPE_X: 45,
  /** Pipe shape y (px). */
  PIPE_SHAPE_Y: 90,
  /** Pipe shape control 1 x (px). */
  PIPE_SHAPE_CONTROL_1_X: 205,
  /** Pipe shape control 1 y (px). */
  PIPE_SHAPE_CONTROL_1_Y: 90,
  /** Pipe shape control 2 x (px). */
  PIPE_SHAPE_CONTROL_2_X: 210,
  /** Pipe shape control 2 y (px). */
  PIPE_SHAPE_CONTROL_2_Y: 150,
  /** Pipe shape end x (px). */
  PIPE_SHAPE_END_X: 274,
  /** Pipe shape end y (px). */
  PIPE_SHAPE_END_Y: 150,
  /** Pipe line width (px). */
  PIPE_LINE_WIDTH: 10,
  /** Arrows tail width (px). */
  ARROWS_TAIL_WIDTH: 8,
  /** Arrows head width (px). */
  ARROWS_HEAD_WIDTH: 25,
  /** Arrows head height (px). */
  ARROWS_HEAD_HEIGHT: 22,
  /** Tracers radius (px). */
  TRACERS_RADIUS: 7,
  /** Frame x (px). */
  FRAME_X: 120,
  /** Frame y (px). */
  FRAME_Y: 165,
  /** Frame line width (px). */
  FRAME_LINE_WIDTH: 8,
  /** Tank x (px). */
  TANK_X: 85,
  /** Tank y (px). */
  TANK_Y: 45,
  /** Tank width (px). */
  TANK_WIDTH: 205,
  /** Tank height (px). */
  TANK_HEIGHT: 130,
  /** Tank line width (px). */
  TANK_LINE_WIDTH: 7,
  /** Lid x (px). */
  LID_X: 75,
  /** Lid y (px). */
  LID_Y: 35,
  /** Lid width (px). */
  LID_WIDTH: 225,
  /** Lid height (px). */
  LID_HEIGHT: 16,
  /** Lid line width (px). */
  LID_LINE_WIDTH: 5,
  /** Outlet x (px). */
  OUTLET_X: 282,
  /** Outlet y (px). */
  OUTLET_Y: 130,
  /** Outlet width (px). */
  OUTLET_WIDTH: 40,
  /** Outlet height (px). */
  OUTLET_HEIGHT: 24,
  /** Outlet line width (px). */
  OUTLET_LINE_WIDTH: 5,
  /** Jet x (px). */
  JET_X: 319,
  /** Jet y (px). */
  JET_Y: 142,
  /** Jet control x (px). */
  JET_CONTROL_X: 423,
  /** Jet control y (px). */
  JET_CONTROL_Y: 142,
  /** Jet end x (px). */
  JET_END_X: 480,
  /** Jet end y (px). */
  JET_END_Y: 321,
  /** Jet line width (px). */
  JET_LINE_WIDTH: 17,
  /** Jet edge x (px). */
  JET_EDGE_X: 319,
  /** Jet edge y (px). */
  JET_EDGE_Y: 132,
  /** Jet edge control x (px). */
  JET_EDGE_CONTROL_X: 431,
  /** Jet edge control y (px). */
  JET_EDGE_CONTROL_Y: 132,
  /** Jet edge end x (px). */
  JET_EDGE_END_X: 489,
  /** Jet edge end y (px). */
  JET_EDGE_END_Y: 318,
  /** Jet edge line width (px). */
  JET_EDGE_LINE_WIDTH: 3,
} as const;

/** Settings for common/model/units.ts. */
export const UNITS_SETTINGS = {
  /** Feet per metre. Also serves for ft/s per m/s. */
  FEET_PER_METER: 3.2808399,
  /** Atmospheres per pascal. */
  ATM_PER_PASCAL: 9.8692e-6,
  /** Pounds per square inch, per pascal. */
  PSI_PER_PASCAL: 145.04e-6,
  /** Litres per cubic metre. */
  LITERS_PER_M3: 1000,
} as const;

/** Settings for common/view/BarometerNode.ts. */
export const BAROMETER_NODE_SETTINGS = {
  /** Gauge radius (px). */
  GAUGE_RADIUS: 34,
  /** Tip height (px). */
  TIP_HEIGHT: 12,
  /** Tip half width (px). */
  TIP_HALF_WIDTH: 7,
  /** Metres the sampling point moves per arrow-key press. */
  KEYBOARD_DRAG_SPEED: 3,
  /** Width of the digital readout text, relative to the dial radius — narrower than the background behind it. */
  READOUT_TEXT_MAX_WIDTH_RATIO: 1.9,
  /** Width of the readout background relative to the dial radius (dimensionless). */
  READOUT_BACKGROUND_WIDTH_RATIO: 2.1,
  /** Readout background height (px). */
  READOUT_BACKGROUND_HEIGHT: 19,
  /** Readout background corner radius (px). */
  READOUT_BACKGROUND_CORNER_RADIUS: 3,
  /** Readout overlap with gauge (px). */
  READOUT_OVERLAP_WITH_GAUGE: 10,
  /** Tip overlap with readout (px). */
  TIP_OVERLAP_WITH_READOUT: 2,
  /** Readout background line width (px). */
  READOUT_BACKGROUND_LINE_WIDTH: 2,
} as const;

/** Settings for common/view/FPAFRulerNode.ts. */
export const FPAF_RULER_NODE_SETTINGS = {
  /** Width of the ruler body, view pixels. */
  RULER_WIDTH: 42,
  /** Tick font size (px). */
  TICK_FONT_SIZE: 11,
  /** Least spacing between major ticks that keeps their labels legible, view pixels. */
  MIN_MAJOR_TICK_SPACING: 34,
  /** Metres the ruler moves per arrow-key press. */
  KEYBOARD_DRAG_SPEED: 3,
} as const;

/** Settings for common/view/SensorToolboxNode.ts. */
export const SENSOR_TOOLBOX_NODE_SETTINGS = {
  /** Opacity of a slot with nothing left in it. */
  DISABLED_OPACITY: 0.4,
  /** Constructor spacing (px). */
  CONSTRUCTOR_SPACING: 12,
} as const;

/** Settings for common/view/SkyGroundNode.ts. */
export const SKY_GROUND_NODE_SETTINGS = {
  /** Thickness of the grass strip, in view pixels. */
  GRASS_HEIGHT: 12,
  /** Thickness of the darker band along the bottom of the grass. */
  GRASS_SHADOW_HEIGHT: 4,
  /** Sky gradient height (px). */
  SKY_GRADIENT_HEIGHT: 245,
  /** Depth, in view pixels, over which earth darkens to its full colour. */
  EARTH_GRADIENT_DEPTH: 490,
  /** Depth over which turf darkens. Shallow: a lawn is not a cross-section. */
  TURF_GRADIENT_DEPTH: 61,
} as const;

/** Settings for common/view/UnitSlider.ts. */
export const UNIT_SLIDER_SETTINGS = {
  /** Default track width, wide enough for three tick labels without crowding. */
  DEFAULT_TRACK_WIDTH: 150,
  /** Track height (px). */
  TRACK_HEIGHT: 4,
  /** Thumb size width (px). */
  THUMB_SIZE_WIDTH: 12,
  /** Thumb size height (px). */
  THUMB_SIZE_HEIGHT: 20,
  /** Fraction of the range crossed per arrow-key press: fine enough to land on a particular value, coarse enough to cross the range in a few seconds. */
  KEYBOARD_STEP_DIVISOR: 100,
  /** Fraction of the range crossed per arrow-key press while Shift is held, for fine control. */
  SHIFT_KEYBOARD_STEP_DIVISOR: 500,
  /** Fraction of the range crossed per Page Up/Down press. */
  PAGE_KEYBOARD_STEP_DIVISOR: 10,
  /** Tick label max width (px). */
  TICK_LABEL_MAX_WIDTH: 60,
  /** Readout spacing (px). */
  READOUT_SPACING: 2,
} as const;

/** Settings for common/view/UnitsControlPanel.ts. */
export const UNITS_CONTROL_PANEL_SETTINGS = {
  /** Radio button group spacing (px). */
  RADIO_BUTTON_GROUP_SPACING: 4,
  /** Radio button group radius (px). */
  RADIO_BUTTON_GROUP_RADIUS: 7,
  /** Constructor spacing (px). */
  CONSTRUCTOR_SPACING: 5,
  /** Constructor max width (px). */
  CONSTRUCTOR_MAX_WIDTH: 130,
  /** Create label max width (px). */
  CREATE_LABEL_MAX_WIDTH: 110,
} as const;

/** Settings for common/view/VelocitySensorNode.ts. */
export const VELOCITY_SENSOR_NODE_SETTINGS = {
  LABEL_MAX_WIDTH_OFFSET: 8, // px
  LABEL_TOP_OFFSET: 3, // px
  READOUT_BACKGROUND_BOTTOM_OFFSET: 4, // px
  READOUT_TEXT_MAX_WIDTH_OFFSET: 14, // px

  /** Body width (px). */
  BODY_WIDTH: 76,
  /** Body height (px). */
  BODY_HEIGHT: 44,
  /** Tip height (px). */
  TIP_HEIGHT: 12,
  /** Tip half width (px). */
  TIP_HALF_WIDTH: 8,
  /** View pixels of arrow per m/s of flow. */
  ARROW_SCALE: 22,
  /** Longest the direction arrow is allowed to grow, view pixels. */
  MAX_ARROW_LENGTH: 90,
  /** Metres the sampling point moves per arrow-key press. */
  KEYBOARD_DRAG_SPEED: 3,
  /** Body corner x (px). */
  BODY_CORNER_X: 5,
  /** Body corner y (px). */
  BODY_CORNER_Y: 5,
  /** Body line width (px). */
  BODY_LINE_WIDTH: 2,
  /** Readout background height (px). */
  READOUT_BACKGROUND_HEIGHT: 18,
  /** Readout background corner x (px). */
  READOUT_BACKGROUND_CORNER_X: 3,
  /** Readout background corner y (px). */
  READOUT_BACKGROUND_CORNER_Y: 3,
  /** Arrow head height (px). */
  ARROW_HEAD_HEIGHT: 12,
  /** Arrow head width (px). */
  ARROW_HEAD_WIDTH: 12,
  /** Arrow tail width (px). */
  ARROW_TAIL_WIDTH: 5,
} as const;

/** Settings for common/view/createSensorIcons.ts. */
export const CREATE_SENSOR_ICONS_SETTINGS = {
  /** Caption max width relative to the icon body (dimensionless). */
  CAPTION_MAX_WIDTH_RATIO: 1.6,
  /** Caption vertical offset relative to the icon body (dimensionless). */
  CAPTION_Y_OFFSET_RATIO: 0.35,
  /** Needle tip x as a fraction of the speedometer face (dimensionless). */
  NEEDLE_TIP_X_RATIO: 0.3,
  /** Needle tip y as a fraction of the speedometer face (dimensionless). */
  NEEDLE_TIP_Y_RATIO: 0.25,
  /** Speedometer body corner radius (px). */
  SPEEDOMETER_BODY_CORNER_RADIUS: 5,
  /** Speedometer caption horizontal inset (px). */
  SPEEDOMETER_CAPTION_HORIZONTAL_INSET: 8,
  /** Speedometer caption top inset (px). */
  SPEEDOMETER_CAPTION_TOP_INSET: 3,
  /** Speedometer readout width inset (px). */
  SPEEDOMETER_READOUT_WIDTH_INSET: 10,
  /** Speedometer readout bottom inset (px). */
  SPEEDOMETER_READOUT_BOTTOM_INSET: 22,
  /** Speedometer tip overlap with body (px). */
  SPEEDOMETER_TIP_OVERLAP_WITH_BODY: 2,
  /** Face line width (px). */
  FACE_LINE_WIDTH: 2,
  /** Needle line width (px). */
  NEEDLE_LINE_WIDTH: 2,
  /** Body line width (px). */
  BODY_LINE_WIDTH: 2,
  /** Background line width (px). */
  BACKGROUND_LINE_WIDTH: 2,
} as const;

/** Settings for common/view/pinAccordionBox.ts. */
export const PIN_ACCORDION_BOX_SETTINGS = {
  /** Title max width (px). */
  TITLE_MAX_WIDTH: 150,
  /** Content x margin (px). */
  CONTENT_X_MARGIN: 10,
  /** Content y margin (px). */
  CONTENT_Y_MARGIN: 5,
  /** Button x margin (px). */
  BUTTON_X_MARGIN: 8,
  /** Button y margin (px). */
  BUTTON_Y_MARGIN: 4,
  /** Expand collapse button side length (px). */
  EXPAND_COLLAPSE_BUTTON_SIDE_LENGTH: 16,
} as const;

/** Settings for flow/model/FlowModel.ts. */
export const FLOW_MODEL_SETTINGS = {
  /** Barometers and speedometers available on this screen. */
  NUMBER_OF_BAROMETERS: 2,
  /** Number of velocity sensors (count). */
  NUMBER_OF_VELOCITY_SENSORS: 2,
  /** Marker dots dripped into the pipe per second. */
  DRIP_RATE: 10,
  /** Radius of a dripped dot, metres. */
  DRIP_RADIUS: 0.1,
  /** Radius of an injected grid dot, metres. */
  GRID_RADIUS: 0.06,
  /** Dots are dripped between these fractions of the pipe height, never right against the wall — with friction on, a dot at the very edge would crawl, and a student would read that as the sim being stuck. */
  DRIP_MIN_FRACTION: 0.15,
  /** Drip max fraction (dimensionless). */
  DRIP_MAX_FRACTION: 0.85,
  /** Shape of the injected grid: columns across, rows up. */
  GRID_COLUMNS: 4,
  /** Grid rows (dimensionless). */
  GRID_ROWS: 9,
  /** Grid column spacing (m). */
  GRID_COLUMN_SPACING: 0.2,
  /** Grid min fraction (dimensionless). */
  GRID_MIN_FRACTION: 0.1,
  /** Grid max fraction (dimensionless). */
  GRID_MAX_FRACTION: 0.9,
  /** Seconds the grid injector is unavailable after firing, so the grid stays readable. */
  GRID_INJECTOR_COOLDOWN: 4,
  /** Model-x nudge (metres) for a particle spawned at the pipe's left edge, so it starts strictly inside the pipe rather than exactly on the boundary. */
  PARTICLE_SPAWN_EPSILON: 1e-6,
  /** How close to the wall the model declines to report a pressure, metres. Right at the wall the velocity profile is ambiguous, and a barometer resting on the boundary would flicker between a reading and a dash. */
  WALL_MARGIN: 0.05,
  /** Default friction pressure drop (Pa). */
  DEFAULT_FRICTION_PRESSURE_DROP: 12000,
} as const;

/** Settings for flow/model/FluxMeter.ts. */
export const FLUX_METER_SETTINGS = {
  /** Where the hoop sits before the student moves it, metres. */
  INITIAL_X: -3,
} as const;

/** Settings for flow/view/FlowControlPanel.ts. */
export const FLOW_CONTROL_PANEL_SETTINGS = {
  CHECKBOX_MAX_WIDTH_OFFSET: 30, // px

  /** Width the panel's contents are held to, so the layout does not jump. */
  CONTENT_WIDTH: 150,
  /** Toggles spacing (px). */
  TOGGLES_SPACING: 8,
} as const;

/** Settings for flow/view/FlowScreenView.ts. */
export const FLOW_SCREEN_VIEW_SETTINGS = {
  /** How high above the ground a tool may be dragged, metres. */
  MAX_TOOL_ALTITUDE: 3.2,
  /** Length of the draggable ruler, metres. */
  RULER_LENGTH: 4,
  /** Ruler home position x (px). */
  RULER_HOME_POSITION_X: 4.4,
  /** Ruler home position y (px). */
  RULER_HOME_POSITION_Y: 0.8,
  /** Tool drag bounds min y (px). */
  TOOL_DRAG_BOUNDS_MIN_Y: -4,
  /** Keyboard grab position y (px). */
  KEYBOARD_GRAB_POSITION_Y: 1.4,
} as const;

/** Settings for flow/view/FluxMeterNode.ts. */
export const FLUX_METER_NODE_SETTINGS = {
  LAYOUT_BOTTOM_OFFSET: 8, // px

  /** Metres the hoop moves per arrow-key press. */
  KEYBOARD_DRAG_SPEED: 1.5,
  /** Thickness of the hoop, view pixels. */
  HOOP_LINE_WIDTH: 7,
  /** How much wider than the pipe the hoop is drawn, view pixels. */
  HOOP_OVERHANG: 8,
  /** Opacity of the back half of the hoop, so it reads as behind the fluid without disappearing. */
  BACK_RING_OPACITY: 0.5,
  /** Readout max width (px). */
  READOUT_MAX_WIDTH: 180,
  /** Readout spacing (px). */
  READOUT_SPACING: 3,
} as const;

/** Settings for flow/view/GridInjectorNode.ts. */
export const GRID_INJECTOR_NODE_SETTINGS = {
  /** Radius of the plunger head, view pixels. */
  PLUNGER_RADIUS: 33,
  /** Model x where the injector sits, from the HTML5 reference. */
  INJECTOR_MODEL_X: -6,
  /** View-pixel offset from the pipe mouth to the bulb artwork. */
  INJECTOR_X_OFFSET: 67,
  /** View-pixel offset above the pipe ceiling to the bulb artwork. Has to match the height of the scaled bulb, whose tube reaches down to the mouth, so it moves with BULB_SCALE. */
  INJECTOR_Y_OFFSET: 200,
  /** Bulb scale (dimensionless). */
  BULB_SCALE: 0.47,
  /** View-pixel drop from the top of the bulb to the plunger it houses. */
  PLUNGER_Y_OFFSET: 41,
  /** Button touch area dilation (px). */
  BUTTON_TOUCH_AREA_DILATION: 10,
} as const;

/** Settings for flow/view/PipeHandlesNode.ts. */
export const PIPE_HANDLES_NODE_SETTINGS = {
  /** Scale applied to every handle bitmap, tracking the pipe artwork it sits on. */
  HANDLE_IMAGE_SCALE: 0.43,
  /** Horizontal inset of the left main drag handle from the layout edge. */
  LEFT_MAIN_HANDLE_INSET: 13,
  /** Horizontal inset of the right main drag handle from the layout edge. */
  RIGHT_MAIN_HANDLE_INSET: 67,
  /** Extra touch width on each side of a main handle. */
  MAIN_HANDLE_TOUCH_X_EXPAND: 30,
  /** Extra touch height below a main handle. */
  MAIN_HANDLE_TOUCH_Y_EXPAND: 60,
  /** Extra touch width on each side of a middle or rim handle. */
  VERTICAL_HANDLE_TOUCH_X_EXPAND: 30,
  /** Extra touch height below a top vertical handle, which has no room to grow upward. */
  TOP_HANDLE_TOUCH_BOTTOM_EXPAND: 40,
  /** Extra touch height above a bottom vertical handle. */
  BOTTOM_HANDLE_TOUCH_TOP_EXPAND: 30,
  /** Extra touch height below a bottom vertical handle. */
  BOTTOM_HANDLE_TOUCH_BOTTOM_EXPAND: 60,
  /** Extra touch height below the main handle's image, beyond MAIN_HANDLE_TOUCH_Y_EXPAND. */
  MAIN_HANDLE_TOUCH_TOP_INSET: 25,
  /** View-pixel gap between a pipe-head rim and its rim handle. */
  RIM_HANDLE_OFFSET: 2,
  /** Distance from a pipe-head image's mouth edge to its brown rim centre, bitmap pixels. */
  RIM_HANDLE_X_INSET: 48,
  /** Metres the handle moves per arrow-key press. */
  KEYBOARD_DRAG_SPEED: 1.5,
} as const;

/** Settings for flow/view/PipeNode.ts. */
export const PIPE_NODE_SETTINGS = {
  /** Middle wall line width (px). */
  MIDDLE_WALL_LINE_WIDTH: 8,
  /** Horizontal stretch of the repeating pipe-segment bitmap off-screen. */
  PIPE_SEGMENT_X_SCALE: 100,
  /** Gap between the left head and the repeating segment, in unscaled bitmap pixels: both live inside the head assembly, which is scaled as a whole. */
  LEFT_SEGMENT_GAP: 30,
  /** Overlap between the right head and the repeating segment, same frame as above. */
  RIGHT_SEGMENT_OVERLAP: 50,
} as const;

/** Settings for flow/view/pipeEndLayout.ts. */
export const PIPE_END_LAYOUT_SETTINGS = {
  /** Pipe head x scale (dimensionless). */
  PIPE_HEAD_X_SCALE: 0.48,
  /** Reference cross-section height used to compute the vertical head scale (PhET: 2.1 m). */
  PIPE_REFERENCE_HEIGHT: 2.1,
  /** Smallest allowed vertical scale for a pipe head. */
  MIN_PIPE_HEAD_SCALE: 0.24,
  /** Offset from the top control point to the pipe-head node origin, in unscaled bitmap pixels — it is multiplied by the head's own scale below, so it does not move with the layout bounds. */
  LEFT_PIPE_Y_OFFSET: 30,
} as const;

/** Settings for preferences/FluidPressureAndFlowPreferencesNode.ts. */
export const FLUID_PRESSURE_AND_FLOW_PREFERENCES_NODE_SETTINGS = {
  /** Header font size (px). */
  HEADER_FONT_SIZE: 18,
  /** Checkbox label font size (px). */
  CHECKBOX_LABEL_FONT_SIZE: 14,
  /** Description font size (px). */
  DESCRIPTION_FONT_SIZE: 12,
  /** Description max width (px). */
  DESCRIPTION_MAX_WIDTH: 380,
  /** Checkbox spacing (px). */
  CHECKBOX_SPACING: 8,
  /** Content spacing (px). */
  CONTENT_SPACING: 8,
} as const;

/** Settings for under-pressure/model/PoolWithFaucetsModel.ts. */
export const POOL_WITH_FAUCETS_MODEL_SETTINGS = {
  /** Metres of water level gained per second with the fill tap wide open. Tuned so an empty pool fills in about six seconds — long enough to watch the barometer climb, short enough not to be a chore. */
  MAX_FILL_RATE: 0.5,
} as const;

/** Settings for under-pressure/view/ChamberMassDropZoneNode.ts. */
export const CHAMBER_MASS_DROP_ZONE_NODE_SETTINGS = {
  OUTLINE_LINE_DASH_DASH: 10, // px
  CONSTRUCTOR_OUTLINE_LINE_DASH_DASH: 5, // px

  /** Height of the drop zone above the water surface, metres — fits one large block. */
  DROP_ZONE_HEIGHT: 0.55,
  /** Outline line width (px). */
  OUTLINE_LINE_WIDTH: 2,
} as const;

/** Settings for under-pressure/view/MassNode.ts. */
export const MASS_NODE_SETTINGS = {
  LABEL_MAX_WIDTH_OFFSET: 4, // px

  /** Metres the block moves per arrow-key press. */
  KEYBOARD_DRAG_SPEED: 2,
  /** Block corner x (px). */
  BLOCK_CORNER_X: 2,
  /** Block corner y (px). */
  BLOCK_CORNER_Y: 2,
} as const;

/** Settings for under-pressure/view/MysteryPoolControlsNode.ts. */
export const MYSTERY_POOL_CONTROLS_NODE_SETTINGS = {
  TEXT_OPTIONS_MAX_WIDTH_FACTOR: 0.8, // dimensionless

  /** Combo label max width (px). */
  COMBO_LABEL_MAX_WIDTH: 70,
  /** Mystery fluid radio radius (px). */
  MYSTERY_FLUID_RADIO_RADIUS: 6,
  /** Mystery planet radio radius (px). */
  MYSTERY_PLANET_RADIO_RADIUS: 6,
  /** Choice panel spacing (px). */
  CHOICE_PANEL_SPACING: 5,
} as const;

/** Settings for under-pressure/view/PoolFaucetsNode.ts. */
export const POOL_FAUCETS_NODE_SETTINGS = {
  /** Length of the supply pipe feeding the fill tap, view pixels. Long enough to run off the left of the screen, so the water reads as coming from the mains rather than from a floating spout. */
  SUPPLY_PIPE_LENGTH: 900,
  /** Drain pipe length (px). */
  DRAIN_PIPE_LENGTH: 120,
  /** How wide the falling column of water is drawn, view pixels. */
  STREAM_WIDTH: 15,
  /** Scale applied to the whole faucet assembly, to fit the pool. */
  FAUCET_SCALE: 0.61,
  /** Vertical run of pipe above the fill tap's spout, view pixels. */
  INPUT_FAUCET_VERTICAL_PIPE_LENGTH: 20,
  /** Vertical run of pipe above the drain's spout, view pixels. */
  DRAIN_FAUCET_VERTICAL_PIPE_LENGTH: 16,
  /** How far a faucet's right edge sits from its spout's model x, view pixels. */
  FAUCET_SPOUT_RIGHT_INSET: 25,
  /** How far above the water's resting surface the fill tap's spout sits, view pixels. */
  INPUT_FAUCET_BOTTOM_INSET: 32,
  /** Overlap between a stream's top and the spout it falls from, so no gap shows, view pixels. */
  STREAM_SPOUT_OVERLAP: 2,
  /** How far below the pool floor the drain's spout sits, view pixels. */
  DRAIN_FAUCET_BOTTOM_INSET: 37,
  /** Length of the drain's falling column, long enough to run off the bottom of the screen, view pixels. */
  DRAIN_STREAM_FALL_LENGTH: 490,
} as const;

/** Settings for under-pressure/view/PoolGridNode.ts. */
export const POOL_GRID_NODE_SETTINGS = {
  LABEL_LEFT_OFFSET: 4, // px
  CONSTRUCTOR_LINE_DASH_DASH: 4, // px

  /** Vertical spacing between grid lines, metres. */
  MINOR_SPACING: 0.5,
  /** Every this many lines gets a label. */
  LINES_PER_LABEL: 2,
  /** Slack added to the loop bound so float error doesn't drop the last grid line. */
  LOOP_EPSILON: 1e-9,
} as const;

/** Settings for under-pressure/view/PoolNode.ts. */
export const POOL_NODE_SETTINGS = {
  /** Stroke width of the pool wall and the water outline, view pixels. */
  EDGE_LINE_WIDTH: 3,
  /** Cement lip traced outside the pool walls at the cutaway, view pixels. */
  CEMENT_LINE_WIDTH: 4,
  /** How far the cement lip sits outside the pool wall, model metres. */
  CEMENT_OUTSET: 0.1,
} as const;

/** Settings for under-pressure/view/SceneRadioButtonGroup.ts. */
export const SCENE_RADIO_BUTTON_GROUP_SETTINGS = {
  LEFT_X_SEGMENT_2: 5, // px
  LEFT_X_SEGMENT_3: 20, // px
  LEFT_X_SEGMENT_4: 17, // px
  RIGHT_X_SEGMENT_2: 31, // px
  RIGHT_X_SEGMENT_3: 45, // px
  RIGHT_X_SEGMENT_4: 40, // px
  CHAMBER_ICON_SHAPE_X_SEGMENT_2: 27, // px
  CHAMBER_ICON_SHAPE_WIDTH_SEGMENT_2: 14, // px
  CHAMBER_ICON_SHAPE_X_SEGMENT_3: 7, // px
  CHAMBER_ICON_SHAPE_WIDTH_SEGMENT_3: 37, // px

  /** Size of one scene icon, view pixels. Four of these plus their button chrome have to stack between the ground line and the bottom of the play area. */
  ICON_WIDTH: 50,
  /** Icon height (px). */
  ICON_HEIGHT: 40,
  /** View y within an icon of its ground line. */
  ICON_GROUND_Y: 10,
  /** How full each icon's pool is drawn, as a fraction of its depth. */
  ICON_FILL_FRACTION: 0.55,
  /** Horizontal gap between the square icon's basin and the icon's own edges. */
  SQUARE_ICON_SIDE_MARGIN: 12,
  /** Constructor spacing (px). */
  CONSTRUCTOR_SPACING: 6,
  /** Constructor x margin (px). */
  CONSTRUCTOR_X_MARGIN: 3,
  /** Constructor y margin (px). */
  CONSTRUCTOR_Y_MARGIN: 3,
  /** Left x (px). */
  LEFT_X: 10,
  /** Right x (px). */
  RIGHT_X: 27,
  /** Trapezoid icon shape x (px). */
  TRAPEZOID_ICON_SHAPE_X: 10,
  /** Trapezoid icon shape width (px). */
  TRAPEZOID_ICON_SHAPE_WIDTH: 30,
  /** Trapezoid icon shape height (px). */
  TRAPEZOID_ICON_SHAPE_HEIGHT: 5,
  /** Chamber icon shape x (px). */
  CHAMBER_ICON_SHAPE_X: 11,
  /** Chamber icon shape width (px). */
  CHAMBER_ICON_SHAPE_WIDTH: 5,
  /** Chamber icon shape height (px). */
  CHAMBER_ICON_SHAPE_HEIGHT: 7,
} as const;

/** Settings for under-pressure/view/UnderPressureControlPanel.ts. */
export const UNDER_PRESSURE_CONTROL_PANEL_SETTINGS = {
  RULER_CHECKBOX_MAX_WIDTH_OFFSET: 30, // px
  GRID_CHECKBOX_MAX_WIDTH_OFFSET: 30, // px

  /** Width the panel's contents are held to, so the layout does not jump. */
  CONTENT_WIDTH: 150,
  /** Atmosphere buttons max width (px). */
  ATMOSPHERE_BUTTONS_MAX_WIDTH: 60,
  /** Atmosphere buttons spacing (px). */
  ATMOSPHERE_BUTTONS_SPACING: 14,
  /** Atmosphere buttons radius (px). */
  ATMOSPHERE_BUTTONS_RADIUS: 7,
  /** Atmosphere control spacing (px). */
  ATMOSPHERE_CONTROL_SPACING: 5,
  /** Tools and atmosphere spacing (px). */
  TOOLS_AND_ATMOSPHERE_SPACING: 6,
} as const;

/** Settings for under-pressure/view/UnderPressureScreenView.ts. */
export const UNDER_PRESSURE_SCREEN_VIEW_SETTINGS = {
  STACK_RIGHT_COLUMN_RIGHT_OFFSET: 10, // px

  /** View pixels per model metre. Sized so the widest pool and its drain faucet fit between the scene chooser and the expanded right-hand controls, including clearance for the faucet handle when fully open. */
  VIEW_SCALE: 76,
  /** View y of the ground line (model y = 0). */
  GROUND_VIEW_Y: 300,
  /** Model x at the play-area anchor; keeps the widest pool clear of the scene chooser. */
  MODEL_CENTER_X: -0.15,
  /** How high above the ground a tool may be dragged, metres. */
  MAX_TOOL_ALTITUDE: 3.6,
  /** Vertical offset from an accordion box top to its slider readout, view pixels. */
  MYSTERY_COMBO_TOP_INSET: 28,
  /** Panel width shared by the control column and mystery choice panel. */
  CONTROL_PANEL_WIDTH: 150,
  /** Length of the draggable ruler, metres. */
  RULER_LENGTH: 4,
  /** Ruler home position x (px). */
  RULER_HOME_POSITION_X: 1.6,
  /** Ruler home position y (px). */
  RULER_HOME_POSITION_Y: 0.6,
  /** Mass drag bounds min x (px). */
  MASS_DRAG_BOUNDS_MIN_X: -5.4,
  /** Mass drag bounds max x (px). */
  MASS_DRAG_BOUNDS_MAX_X: 2.6,
  /** Keyboard grab position y (px). */
  KEYBOARD_GRAB_POSITION_Y: 1.5,
} as const;

/** Settings for water-tower/model/Hose.ts. */
export const HOSE_SETTINGS = {
  /** Hose outlet x (m). */
  HOSE_OUTLET_X: 17,
  /** Max hose outlet y (m). */
  MAX_HOSE_OUTLET_Y: 14,
  /** Radius of the straight nozzle bore, metres. */
  HOSE_RADIUS: 0.4,
  /** Where the nozzle starts, metres. Below the tank's hole, so there is head to measure from the first frame, and high enough that the hose's own lower bend clears the ground while the nozzle points straight up. */
  INITIAL_OUTLET_Y: 9,
} as const;

/** Settings for water-tower/model/HoseGeometry.ts. */
export const HOSE_GEOMETRY_SETTINGS = {
  /** Minimum elbow ground clearance projected by hose angle (m). */
  OUTLET_GROUND_CLEARANCE: 0.2,
  /** Vertical clearance above which the bend uses its extended path (m). */
  BEND_VERTICAL_CLEARANCE: 0.6,
  /** Hose nozzle length (m). */
  HOSE_NOZZLE_LENGTH: 2.4,
  /** Corner fillet radius in metres, matching the artwork at its 12 px/m scale. */
  CORNER_RADIUS: 0.25,
  /** Where the riser stands, as a fraction of the run from the tank to the nozzle. A fraction rather than a fixed distance because the run shortens as the student widens the tank, and the riser has to stay clear of the elbow. */
  RISER_FRACTION: 0.36,
  /** Straight segment between the elbow and the nozzle, metres. */
  HOSE_LAYOUT_H2: 2.1,
  /** Hose layout width (m). */
  HOSE_LAYOUT_WIDTH: 1.5,
} as const;

/** Settings for water-tower/model/WaterTower.ts. */
export const WATER_TOWER_SETTINGS = {
  /** Tank radius (m). */
  TANK_RADIUS: 5,
  /** Tank height (m). */
  TANK_HEIGHT: 10,
  /** Max tank base y (m). */
  MAX_TANK_BASE_Y: 15,
  /** Min tank base y (m). */
  MIN_TANK_BASE_Y: 6,
  /** Where the tank's base starts, metres. Not at the top, so it can be raised as well as lowered. */
  INITIAL_TANK_BASE_Y: 11,
  /** Smallest and largest tank radii the capacity slider can produce, metres. */
  MIN_TANK_RADIUS: 3.5,
  /** Max tank radius (m). */
  MAX_TANK_RADIUS: 6.5,
  /** How full the tank starts, as a fraction of capacity.  Not completely full, so the fill button and the faucet are both live from the first frame — a control that starts disabled is one a student may never discover. */
  INITIAL_FILL_FRACTION: 0.8,
  /** Volume slack (m³) below capacity that still counts as "full", to absorb float error. */
  FULL_VOLUME_TOLERANCE: 1e-9,
} as const;

/** Settings for water-tower/model/WaterTowerModel.ts. */
export const WATER_TOWER_MODEL_SETTINGS = {
  /** Largest displayed water volume in one faucet drop (m³). */
  MAX_FAUCET_DROP_VOLUME: 0.5,
  /** Instruments available on this screen. */
  NUMBER_OF_BAROMETERS: 2,
  /** Number of velocity sensors (count). */
  NUMBER_OF_VELOCITY_SENSORS: 2,
  /** Length of one internal step, seconds. See the class comment. */
  FIXED_TIMESTEP: 0.016,
  /** Effective outlet area (m²). */
  EFFECTIVE_OUTLET_AREA: 2.8,
  /** Smallest drop that is worth drawing, metres. */
  MIN_DROP_RADIUS: 0.1,
  /** Maximum inflow from the faucet, m³ per second. */
  MAX_FAUCET_FLOW_RATE: 30,
} as const;

/** Settings for water-tower/view/FaucetControlPanel.ts. */
export const FAUCET_CONTROL_PANEL_SETTINGS = {
  /** Label max width (px). */
  LABEL_MAX_WIDTH: 120,
  /** Mode buttons spacing (px). */
  MODE_BUTTONS_SPACING: 4,
  /** Mode buttons radius (px). */
  MODE_BUTTONS_RADIUS: 7,
  /** Fill button max width (px). */
  FILL_BUTTON_MAX_WIDTH: 80,
  /** Constructor spacing (px). */
  CONSTRUCTOR_SPACING: 8,
} as const;

/** Settings for water-tower/view/HoseNode.ts. */
export const HOSE_NODE_SETTINGS = {
  CONSTRUCTOR_LEFT_OFFSET: 4, // px

  HEIGHT_HANDLE_X_DILATION: 20, // px
  HEIGHT_HANDLE_Y_DILATION: 20, // px

  /** Scale for the height and spout drag handles. */
  HANDLE_SCALE: 0.3,
  /** Scale for the nozzle bitmap. */
  NOZZLE_SCALE: 0.75,
  /** Scale for the spout rotation handle. */
  SPOUT_HANDLE_SCALE: 0.75,
  /** Radius of grab padding around the spout handle, view pixels. */
  SPOUT_HANDLE_HIT_PADDING: 10,
  /** Metres the nozzle moves per arrow-key press. */
  KEYBOARD_DRAG_SPEED: 3,
  /** Radians the nozzle swings per arrow-key press. */
  KEYBOARD_ANGLE_SPEED: 0.6,
} as const;

/** Settings for water-tower/view/SluiceControlPanel.ts. */
export const SLUICE_CONTROL_PANEL_SETTINGS = {
  FLOW_LEFT_OFFSET: 3, // px
  FLOW_TOP_OFFSET: 6, // px

  /** Option width (px). */
  OPTION_WIDTH: 48,
  /** Option height (px). */
  OPTION_HEIGHT: 36,
  /** Flow control x (px). */
  FLOW_CONTROL_X: 10,
  /** Flow end x (px). */
  FLOW_END_X: 13,
  /** Flow end y (px). */
  FLOW_END_Y: 15,
  /** Flow line width (px). */
  FLOW_LINE_WIDTH: 4,
} as const;

/** Settings for water-tower/view/WaterTowerControlPanel.ts. */
export const WATER_TOWER_CONTROL_PANEL_SETTINGS = {
  LABEL_MAX_WIDTH_OFFSET: 60, // px

  /** Width the panel's contents are held to, so the layout does not jump. */
  CONTENT_WIDTH: 150,
  /** Toggles spacing (px). */
  TOGGLES_SPACING: 8,
} as const;

/** Settings for water-tower/view/WaterTowerNode.ts. */
export const WATER_TOWER_NODE_SETTINGS = {
  LAYOUT_RIGHT_OFFSET: 3, // px

  /** How far the legs splay out from the tank wall, metres. */
  LEG_SPLAY: 3,
  /** Thickness of the tank wall and the legs, view pixels. */
  STRUCTURE_LINE_WIDTH: 4,
  /** Thickness of the cross-bracing between the legs. Thinner than the legs it braces. */
  BRACE_LINE_WIDTH: 2,
  /** Height of the lid on top of the tank, view pixels. */
  LID_HEIGHT: 10,
  /** Metres the tank moves per arrow-key press. */
  KEYBOARD_DRAG_SPEED: 4,
  /** How far the lid overhangs the tank wall on each side, view pixels. */
  LID_OVERHANG: 3,
  /** Scale for the tank-lift handle bitmap. */
  HANDLE_SCALE: 0.45,
  /** Scale for the sluice wheel bitmap. */
  WHEEL_SCALE: 0.4,
  /** Width of the sluice gate, view pixels. */
  GATE_WIDTH: 5,
  /** Height of the sluice gate, relative to the hole size. */
  GATE_HEIGHT_RATIO: 2.5,
  /** View pixels the gate drops past the hole when fully open (PhET HTML5 port). */
  GATE_OPEN_VIEW_NUDGE: 5,
  /** Lid line width (px). */
  LID_LINE_WIDTH: 2,
  /** Sluice gate line width (px). */
  SLUICE_GATE_LINE_WIDTH: 0.5,
} as const;

/** Settings for water-tower/view/WaterTowerScreenView.ts. */
export const WATER_TOWER_SCREEN_VIEW_SETTINGS = {
  CONSTRUCTOR_RIGHT_OFFSET: 37, // px
  CONSTRUCTOR_LEFT_OFFSET: 184, // px
  CONSTRUCTOR_BOTTOM_OFFSET: 70, // px

  MEASURING_TAPE_X_SEGMENT_2: 8, // px

  /** View pixels per model metre.  Set by the tallest thing that has to fit: the tank raised to its limit, with the faucet still above it and still on screen. The jet's horizontal range fits comfortably at the same scale. */
  VIEW_SCALE: 12,
  /** View y of the ground line (model y = 0). */
  GROUND_VIEW_Y: 429,
  /** Model x that lands at the left of the play area. */
  MODEL_LEFT_X: -6,
  /** View x of {@link MODEL_LEFT_X}, measured in from the left edge. */
  MODEL_LEFT_VIEW_INSET: 49,
  /** Length of the draggable ruler, metres. */
  RULER_LENGTH: 20,
  /** Ruler home position x (px). */
  RULER_HOME_POSITION_X: -4,
  /** Ruler home position y (px). */
  RULER_HOME_POSITION_Y: 20,
  /** Faucet scale (dimensionless). */
  FAUCET_SCALE: 0.43,
  /** Keyboard grab position y (px). */
  KEYBOARD_GRAB_POSITION_Y: 24,
  /** Measuring tape x (px). */
  MEASURING_TAPE_X: 2,
  /** Measuring tape y (px). */
  MEASURING_TAPE_Y: 3,
  /** Tank volume control spacing (px). */
  TANK_VOLUME_CONTROL_SPACING: 4,
  /** Tank volume control track width (px). */
  TANK_VOLUME_CONTROL_TRACK_WIDTH: 140,
} as const;

/** Settings for water-tower/view/createWaterTowerToolIcons.ts. */
export const CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS = {
  CREATE_MEASURING_TAPE_ICON_LEFT_OFFSET: 12, // px
  CREATE_MEASURING_TAPE_ICON_TOP_OFFSET: 12, // px
  CREATE_HOSE_ICON_BOTTOM_OFFSET: 3, // px

  /** Create ruler icon font size (px). */
  CREATE_RULER_ICON_FONT_SIZE: 12,
  /** Create ruler icon width (px). */
  CREATE_RULER_ICON_WIDTH: 44,
  /** Create ruler icon height (px). */
  CREATE_RULER_ICON_HEIGHT: 22,
  /** Icon scale (dimensionless). */
  ICON_SCALE: 0.6,
  /** Crosshair size (px). */
  CROSSHAIR_SIZE: 5,
  /** Create measuring tape icon line width (px). */
  CREATE_MEASURING_TAPE_ICON_LINE_WIDTH: 2,
  /** Icon center x (px). */
  ICON_CENTER_X: -16,
  /** Icon center y (px). */
  ICON_CENTER_Y: 8,
  /** Icon radius (px). */
  ICON_RADIUS: 8,
  /** Icon x (px). */
  ICON_X: 10,
  /** Icon y (px). */
  ICON_Y: 16,
  /** Create hose icon scale (dimensionless). */
  CREATE_HOSE_ICON_SCALE: 0.8,
  /** Create labeled tool row spacing (px). */
  CREATE_LABELED_TOOL_ROW_SPACING: 5,
} as const;

/** Initial positions and dimensions for flow/model/FlowModel.ts (m). */
export const FLOW_MODEL_COORDINATES = {
  BAROMETER_START_X: 3, // m
  BAROMETER_START_Y: 1.2, // m
  VELOCITY_SENSOR_START_X: 1, // m
  VELOCITY_SENSOR_START_Y: 0.5, // m
} as const;

/** Initial positions and dimensions for under-pressure/model/UnderPressureModel.ts (m). */
export const UNDER_PRESSURE_MODEL_COORDINATES = {
  BAROMETER_START_POSITION_X: -4, // m
  BAROMETER_START_POSITION_Y: 2, // m
} as const;

/** Initial positions and dimensions for water-tower/model/WaterTowerModel.ts (m). */
export const WATER_TOWER_MODEL_COORDINATES = {
  BAROMETER_START_X: 6, // m
  BAROMETER_START_Y: 22, // m
  VELOCITY_SENSOR_START_X: 9, // m
  VELOCITY_SENSOR_START_Y: 20, // m
  FAUCET_POSITION_Y: 27, // m
} as const;

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
