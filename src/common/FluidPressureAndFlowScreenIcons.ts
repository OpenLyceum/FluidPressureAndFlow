/**
 * FluidPressureAndFlowScreenIcons.ts
 *
 * Programmatic home-screen / navigation-bar icons for each screen.
 * Drawn on the standard PhET 548 × 373 canvas using FluidPressureAndFlowColors.
 * A submerged pressure probe, a constricted pipe, and a draining water tower.
 */
import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path, Rectangle } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { ScreenIcon } from "scenerystack/sim";
import FluidPressureAndFlowColors from "../FluidPressureAndFlowColors.js";
import { FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS, WATER_DENSITY } from "../FluidPressureAndFlowConstants.js";
import { getFluidColor } from "./view/fluidColor.js";

const W = 548;
const H = 373;
// Water uses the same density-dependent paint as the scene, rather than a UI colour.
const WATER_FILL = getFluidColor(WATER_DENSITY);

function background(): Rectangle {
  return new Rectangle(0, 0, W, H, { fill: FluidPressureAndFlowColors.backgroundColorProperty });
}

function iconFrom(content: Node): ScreenIcon {
  return new ScreenIcon(content, {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: FluidPressureAndFlowColors.backgroundColorProperty,
  });
}

export function createUnderPressureIcon(): ScreenIcon {
  const ground = new Rectangle(0, FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.GROUND_Y, W, H - 95, {
    fill: FluidPressureAndFlowColors.earthTopColorProperty,
  });
  const grass = new Rectangle(
    0,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.GRASS_Y,
    W,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.GRASS_HEIGHT,
    { fill: FluidPressureAndFlowColors.grassColorProperty },
  );
  const pool = new Rectangle(
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.POOL_X,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.POOL_Y,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.POOL_WIDTH,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.POOL_HEIGHT,
    {
      fill: FluidPressureAndFlowColors.poolInteriorColorProperty,
    },
  );
  const water = new Rectangle(
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.WATER_X,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.WATER_Y,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.WATER_WIDTH,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.WATER_HEIGHT,
    { fill: WATER_FILL },
  );
  const surface = new Line(
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.SURFACE_START_X,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.SURFACE_START_Y,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.SURFACE_END_X,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.SURFACE_END_Y,
    {
      stroke: FluidPressureAndFlowColors.waterEdgeColorProperty,
      lineWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.SURFACE_LINE_WIDTH,
    },
  );
  const lining = new Path(
    new Shape()
      .moveTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.LINING_X,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.LINING_Y,
      )
      .lineTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.LINING_X,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.LINING_X_LINE_TO_Y,
      )
      .lineTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.LINING_X_SEGMENT_2,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.LINING_Y_SEGMENT_2,
      )
      .lineTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.LINING_X_SEGMENT_2,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.LINING_Y,
      ),
    {
      stroke: FluidPressureAndFlowColors.poolEdgeColorProperty,
      lineWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.LINING_LINE_WIDTH,
      lineJoin: "round",
    },
  );
  const probeTube = new Path(
    new Shape()
      .moveTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PROBE_TUBE_X,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PROBE_TUBE_Y,
      )
      .lineTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PROBE_TUBE_X,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PROBE_TUBE_X_LINE_TO_Y,
      )
      .lineTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PROBE_TUBE_X_SEGMENT_2,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PROBE_TUBE_Y_SEGMENT_2,
      ),
    {
      stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
      lineWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PROBE_TUBE_LINE_WIDTH,
      lineJoin: "round",
    },
  );
  const probe = new Circle(FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PROBE_RADIUS, {
    centerX: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PROBE_CENTER_X,
    centerY: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PROBE_CENTER_Y,
    fill: FluidPressureAndFlowColors.gaugeFaceColorProperty,
    stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
    lineWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PROBE_LINE_WIDTH,
  });
  const dial = new Circle(FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.DIAL_RADIUS, {
    centerX: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.DIAL_CENTER_X,
    centerY: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.DIAL_CENTER_Y,
    fill: FluidPressureAndFlowColors.gaugeFaceColorProperty,
    stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
    lineWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.DIAL_LINE_WIDTH,
  });
  const ticks = [-150, -105, -60, -15, 30].map((degrees) => {
    const angle = (degrees * Math.PI) / 180;
    return new Line(
      422 + 43 * Math.cos(angle),
      105 + 43 * Math.sin(angle),
      422 + 53 * Math.cos(angle),
      105 + 53 * Math.sin(angle),
      {
        stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
        lineWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.TICKS_LINE_WIDTH,
      },
    );
  });
  const needle = new Line(
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.NEEDLE_START_X,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.NEEDLE_START_Y,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.NEEDLE_END_X,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.NEEDLE_END_Y,
    {
      stroke: FluidPressureAndFlowColors.tracerDotColorProperty,
      lineWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.NEEDLE_LINE_WIDTH,
      lineCap: "round",
    },
  );
  return iconFrom(
    new Node({
      children: [background(), ground, grass, pool, water, surface, lining, probeTube, probe, dial, ...ticks, needle],
    }),
  );
}

export function createFlowIcon(): ScreenIcon {
  const pipeShape = new Shape()
    .moveTo(
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_X,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_Y,
    )
    .lineTo(
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_X_SEGMENT_2,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_Y,
    )
    .cubicCurveTo(
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_CONTROL_1_X,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_CONTROL_1_Y,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_CONTROL_2_X,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_CONTROL_2_Y,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_END_X,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_END_Y,
    )
    .cubicCurveTo(
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_CONTROL_1_X_SEGMENT_2,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_CONTROL_1_Y_SEGMENT_2,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_CONTROL_2_X_SEGMENT_2,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_CONTROL_2_Y_SEGMENT_2,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_END_X_SEGMENT_2,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_END_Y_SEGMENT_2,
    )
    .lineTo(
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_X_SEGMENT_3,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_Y,
    )
    .lineTo(
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_X_SEGMENT_3,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_Y_SEGMENT_2,
    )
    .lineTo(
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_X_SEGMENT_4,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_Y_SEGMENT_2,
    )
    .cubicCurveTo(
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_CONTROL_1_X_SEGMENT_3,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_CONTROL_1_Y_SEGMENT_3,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_CONTROL_2_X_SEGMENT_3,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_CONTROL_2_Y_SEGMENT_3,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_END_X,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_END_Y_SEGMENT_3,
    )
    .cubicCurveTo(
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_CONTROL_1_X_SEGMENT_4,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_CONTROL_1_Y_SEGMENT_4,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_CONTROL_2_X_SEGMENT_4,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_CONTROL_2_Y_SEGMENT_4,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_END_X_SEGMENT_3,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_END_Y_SEGMENT_4,
    )
    .lineTo(
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_X,
      FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_SHAPE_X_LINE_TO_Y,
    )
    .close();
  const pipe = new Path(pipeShape, {
    fill: WATER_FILL,
    stroke: FluidPressureAndFlowColors.pipeWallColorProperty,
    lineWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.PIPE_LINE_WIDTH,
    lineJoin: "round",
  });
  // A longer arrow in the narrow section conveys the greater flow speed there.
  const arrows = (
    [
      [70, 128],
      [211, 337],
      [421, 479],
    ] as const
  ).map(
    ([start, end]) =>
      new ArrowNode(start, H / 2, end, H / 2, {
        fill: FluidPressureAndFlowColors.waterEdgeColorProperty,
        stroke: null,
        tailWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.ARROWS_TAIL_WIDTH,
        headWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.ARROWS_HEAD_WIDTH,
        headHeight: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.ARROWS_HEAD_HEIGHT,
      }),
  );
  const tracers = (
    [
      [86, 127],
      [117, 238],
      [178, 140],
      [263, 166],
      [351, 224],
      [412, 133],
      [470, 243],
    ] as const
  ).map(
    ([x, y]) =>
      new Circle(FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.TRACERS_RADIUS, {
        centerX: x,
        centerY: y,
        fill: FluidPressureAndFlowColors.tracerDotColorProperty,
      }),
  );
  return iconFrom(
    new Node({
      children: [background(), pipe, ...arrows, ...tracers],
    }),
  );
}

export function createWaterTowerIcon(): ScreenIcon {
  const ground = new Rectangle(0, FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.GROUND_Y_SEGMENT_2, W, H - 325, {
    fill: FluidPressureAndFlowColors.turfTopColorProperty,
  });
  const frame = new Path(
    new Shape()
      .moveTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_X,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_Y,
      )
      .lineTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_X_SEGMENT_2,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_Y_SEGMENT_2,
      )
      .moveTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_X_SEGMENT_3,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_Y,
      )
      .lineTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_X_SEGMENT_4,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_Y_SEGMENT_2,
      )
      .moveTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_X,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_X_MOVE_TO_Y,
      )
      .lineTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_X_SEGMENT_5,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_Y_SEGMENT_3,
      )
      .moveTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_X_SEGMENT_6,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_Y_SEGMENT_4,
      )
      .lineTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_X_SEGMENT_7,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_Y_SEGMENT_5,
      ),
    {
      stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
      lineWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.FRAME_LINE_WIDTH,
      lineJoin: "round",
    },
  );
  const tank = new Rectangle(
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.TANK_X,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.TANK_Y,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.TANK_WIDTH,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.TANK_HEIGHT,
    {
      fill: FluidPressureAndFlowColors.poolInteriorColorProperty,
      stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
      lineWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.TANK_LINE_WIDTH,
    },
  );
  const water = new Rectangle(
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.WATER_X_SEGMENT_2,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.WATER_Y_SEGMENT_2,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.WATER_WIDTH_SEGMENT_2,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.WATER_HEIGHT_SEGMENT_2,
    { fill: WATER_FILL },
  );
  const surface = new Line(
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.SURFACE_START_X_SEGMENT_2,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.SURFACE_START_Y_SEGMENT_2,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.SURFACE_END_X_SEGMENT_2,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.SURFACE_END_Y_SEGMENT_2,
    {
      stroke: FluidPressureAndFlowColors.waterEdgeColorProperty,
      lineWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.SURFACE_LINE_WIDTH,
    },
  );
  const lid = new Rectangle(
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.LID_X,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.LID_Y,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.LID_WIDTH,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.LID_HEIGHT,
    {
      fill: FluidPressureAndFlowColors.towerTrimColorProperty,
      stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
      lineWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.LID_LINE_WIDTH,
    },
  );
  const outlet = new Rectangle(
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.OUTLET_X,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.OUTLET_Y,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.OUTLET_WIDTH,
    FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.OUTLET_HEIGHT,
    {
      fill: FluidPressureAndFlowColors.towerTrimColorProperty,
      stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
      lineWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.OUTLET_LINE_WIDTH,
    },
  );
  // Horizontal launch followed by a downward-curving stream, as in the screen.
  const jet = new Path(
    new Shape()
      .moveTo(FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.JET_X, FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.JET_Y)
      .quadraticCurveTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.JET_CONTROL_X,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.JET_CONTROL_Y,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.JET_END_X,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.JET_END_Y,
      ),
    {
      stroke: WATER_FILL,
      lineWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.JET_LINE_WIDTH,
      lineCap: "round",
    },
  );
  const jetEdge = new Path(
    new Shape()
      .moveTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.JET_EDGE_X,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.JET_EDGE_Y,
      )
      .quadraticCurveTo(
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.JET_EDGE_CONTROL_X,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.JET_EDGE_CONTROL_Y,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.JET_EDGE_END_X,
        FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.JET_EDGE_END_Y,
      ),
    {
      stroke: FluidPressureAndFlowColors.waterEdgeColorProperty,
      lineWidth: FLUID_PRESSURE_AND_FLOW_SCREEN_ICONS_SETTINGS.JET_EDGE_LINE_WIDTH,
    },
  );
  return iconFrom(
    new Node({
      children: [background(), ground, frame, tank, water, surface, lid, outlet, jet, jetEdge],
    }),
  );
}
