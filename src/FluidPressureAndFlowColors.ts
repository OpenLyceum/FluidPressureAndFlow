/**
 * FluidPressureAndFlowColors.ts
 *
 * Every dynamic colour in the simulation, as ProfileColorProperty entries with a
 * "default" and a "projector" value. SceneryStack swaps profiles when the user
 * turns on Projector Mode in Preferences.
 *
 * ── Why this sim's default profile is light ──────────────────────────────────
 * Most sims in the fleet default to a dark play area. This one cannot: all three
 * screens are an outdoor scene with sky above and earth below, and the pressure
 * story only reads if "above ground" and "below ground" are obviously different
 * places. So the default profile is the daylight scene, and projector mode
 * lightens the ground and strengthens every stroke for a washed-out projector
 * rather than inverting anything.
 *
 * The water is *not* here: its colour is a continuous function of fluid density
 * (see common/model/fluidColor.ts), so it cannot be a fixed pair of profile
 * values. The stroke around the water is here, since that stays constant.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 *   import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
 *   new Rectangle(0, 0, 100, 50, { fill: FluidPressureAndFlowColors.groundColorProperty });
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import FluidPressureAndFlowNamespace from "./FluidPressureAndFlowNamespace.js";

const FluidPressureAndFlowColors = {
  // ── Scene ───────────────────────────────────────────────────────────────────

  /**
   * Screen background, and the sky at the horizon. PhET's SkyNode fades to white
   * at the ground line; keeping the horizon pale is what makes the grass strip
   * read as a horizon rather than as a stripe painted across a flat blue field.
   */
  backgroundColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "background", {
    default: "#d0ecfb",
    projector: "#eaf6fd",
  }),

  /** Sky at the top of the screen; fades down into the background colour. */
  skyTopColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "skyTop", {
    default: "#01ace4",
    projector: "#8ad6f0",
  }),

  /** Earth immediately below the grass line, on the screens that cut into it. */
  earthTopColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "earthTop", {
    default: "#9d8b61",
    projector: "#c2b48d",
  }),

  /** Earth at depth; the cross-section darkens as it goes down. */
  earthBottomColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "earthBottom", {
    default: "#645a3c",
    projector: "#94886a",
  }),

  /** Lawn on the Water Tower screen, which buries nothing. */
  turfTopColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "turfTop", {
    default: "#90c756",
    projector: "#aedd7c",
  }),

  /** Lawn in shade, a little way down. */
  turfBottomColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "turfBottom", {
    default: "#67a257",
    projector: "#8cbe7c",
  }),

  /** The strip of grass along the ground line. */
  grassColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "grass", {
    default: "#63b74d",
    projector: "#7fc96b",
  }),

  /** Shadow along the underside of the grass, so the strip reads as turf with depth. */
  grassShadowColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "grassShadow", {
    default: "#3f7c30",
    projector: "#5a9848",
  }),

  // ── Pools and pipes ─────────────────────────────────────────────────────────

  /** Concrete lining the pools, and the empty part of a partly filled pool. */
  poolLiningColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "poolLining", {
    default: "#e8e8e8",
    projector: "#f2f2f2",
  }),

  /** Interior wall colour visible behind the water, matching the published sim. */
  poolInteriorColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "poolInterior", {
    default: "#f3f0e9",
    projector: "#faf8f2",
  }),

  /** Cement lip traced around the pool opening at ground level. */
  poolCementColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "poolCement", {
    default: "#8a8070",
    projector: "#6a6050",
  }),

  /** The heavy outline around a pool or pipe wall. */
  poolEdgeColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "poolEdge", {
    default: "#8f8f8f",
    projector: "#555555",
  }),

  /** Outline around the water surface and sides. */
  waterEdgeColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "waterEdge", {
    default: "#2a7fa0",
    projector: "#1a5f7a",
  }),

  /** The optional measurement grid drawn over a pool. */
  gridLineColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "gridLine", {
    default: "#606060",
    projector: "#303030",
  }),

  /**
   * Stand-in colour for a mystery fluid in the scene-chooser icon. The fluids
   * themselves are coloured in common/model/fluidColor.ts, where the three
   * purples live together; this is just the button.
   */
  mysteryFluidColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "mysteryFluid", {
    default: "#9b59b6",
    projector: "#7d3f96",
  }),

  /**
   * The water tower's frame: legs, bracing, and the tank's wall.
   *
   * Near-black, because the tower is the one structure in the sim drawn against
   * open sky rather than against ground. A mid-grey that reads as concrete at the
   * pools disappears against the horizon here.
   */
  towerStructureColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "towerStructure", {
    default: "#1a1a1a",
    projector: "#000000",
  }),

  /** The tank's lid, and the band around its base. */
  towerTrimColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "towerTrim", {
    default: "#9a9a9a",
    projector: "#7d7d7d",
  }),

  /** The stackable weights in the chamber pool. */
  massColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "mass", {
    default: "#8e7a5c",
    projector: "#7a6748",
  }),

  /** Dashed outline showing where a weight may be dropped. */
  dropTargetColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "dropTarget", {
    default: "#404040",
    projector: "#202020",
  }),

  /**
   * The tracer dots dripped continuously into the pipe. A red-orange rather than
   * a pure red, so it stays distinguishable from the pipe wall for viewers with
   * protanopia or deuteranopia — the contrast problem PhET raised in
   * phetsims/fluid-pressure-and-flow#327.
   */
  tracerDotColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "tracerDot", {
    default: "#e8503a",
    projector: "#c8341f",
  }),

  /** The injected grid of tracers. Dark, so it reads against the dripped dots. */
  gridTracerColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "gridTracer", {
    default: "#1a1a1a",
    projector: "#000000",
  }),

  /** Brown stroke around the Flow pipe's flexible middle section, from the PhET artwork. */
  pipeWallColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "pipeWall", {
    default: "#613705",
    projector: "#4a2a04",
  }),

  /** The grid-injector plunger button: bulb, fill, and stroke all share this red. */
  injectorButtonColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "injectorButton", {
    default: "#ff0000",
    projector: "#cc0000",
  }),

  // ── Instruments ─────────────────────────────────────────────────────────────

  /** Face of a barometer dial. */
  gaugeFaceColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "gaugeFace", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Rim of a barometer dial, and the outline of a speedometer body. */
  gaugeRimColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "gaugeRim", {
    default: "#555555",
    projector: "#333333",
  }),

  /** Body of a speedometer readout. */
  speedometerBodyColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "speedometerBody", {
    default: "#c77b3a",
    projector: "#b06a2c",
  }),

  // ── Chrome ──────────────────────────────────────────────────────────────────

  /** Background fill for control panels and accordion boxes. */
  panelBackgroundColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "panelBackground", {
    default: "#f0f0b8",
    projector: "#fafae0",
  }),

  /** Border around control panels and accordion boxes. */
  panelBorderColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "panelBorder", {
    default: "#8a8a5c",
    projector: "#666644",
  }),

  /** Text on panels, and general UI text over the light play area. */
  textColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "text", {
    default: "#1a1a1a",
    projector: "#000000",
  }),

  /** Accent for selected scene buttons and other highlighted chrome. */
  accentColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "accent", {
    default: "#2a7fa0",
    projector: "#1a5f7a",
  }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays
  // light in both profiles; its text stays dark. Defined here so every colour
  // lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (greyed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(
    FluidPressureAndFlowNamespace,
    "controlSurfaceDisabled",
    {
      default: "#cccccc",
      projector: "#cccccc",
    },
  ),

  /** Text on light control surfaces: combo items, flat-button labels, field values. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),

  /** Body of the optional hose on the Water Tower screen. */
  hoseFillColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "hoseFill", {
    default: "#00ff00",
    projector: "#00cc00",
  }),

  /** Rim of the optional hose. */
  hoseStrokeColorProperty: new ProfileColorProperty(FluidPressureAndFlowNamespace, "hoseStroke", {
    default: "#555555",
    projector: "#333333",
  }),

  /** Crosshair beside the measuring-tape toolbox icon (the tape's own orange). */
  measuringTapeCrosshairColorProperty: new ProfileColorProperty(
    FluidPressureAndFlowNamespace,
    "measuringTapeCrosshair",
    {
      default: "#E05F20",
    },
  ),
};

export default FluidPressureAndFlowColors;
