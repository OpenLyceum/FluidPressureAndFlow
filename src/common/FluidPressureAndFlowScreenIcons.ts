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
import { WATER_DENSITY } from "../FluidPressureAndFlowConstants.js";
import { getFluidColor } from "./model/fluidColor.js";

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
  const ground = new Rectangle(0, 95, W, H - 95, {
    fill: FluidPressureAndFlowColors.earthTopColorProperty,
  });
  const grass = new Rectangle(0, 87, W, 12, { fill: FluidPressureAndFlowColors.grassColorProperty });
  const pool = new Rectangle(65, 60, 260, 260, {
    fill: FluidPressureAndFlowColors.poolInteriorColorProperty,
  });
  const water = new Rectangle(65, 135, 260, 185, { fill: WATER_FILL });
  const surface = new Line(65, 135, 325, 135, {
    stroke: FluidPressureAndFlowColors.waterEdgeColorProperty,
    lineWidth: 4,
  });
  const lining = new Path(new Shape().moveTo(65, 60).lineTo(65, 320).lineTo(325, 320).lineTo(325, 60), {
    stroke: FluidPressureAndFlowColors.poolEdgeColorProperty,
    lineWidth: 12,
    lineJoin: "round",
  });
  const probeTube = new Path(new Shape().moveTo(422, 160).lineTo(422, 263).lineTo(235, 263), {
    stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
    lineWidth: 8,
    lineJoin: "round",
  });
  const probe = new Circle(12, {
    centerX: 235,
    centerY: 263,
    fill: FluidPressureAndFlowColors.gaugeFaceColorProperty,
    stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
    lineWidth: 5,
  });
  const dial = new Circle(65, {
    centerX: 422,
    centerY: 105,
    fill: FluidPressureAndFlowColors.gaugeFaceColorProperty,
    stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
    lineWidth: 7,
  });
  const ticks = [-150, -105, -60, -15, 30].map((degrees) => {
    const angle = (degrees * Math.PI) / 180;
    return new Line(
      422 + 43 * Math.cos(angle),
      105 + 43 * Math.sin(angle),
      422 + 53 * Math.cos(angle),
      105 + 53 * Math.sin(angle),
      { stroke: FluidPressureAndFlowColors.gaugeRimColorProperty, lineWidth: 4 },
    );
  });
  const needle = new Line(422, 105, 449, 75, {
    stroke: FluidPressureAndFlowColors.tracerDotColorProperty,
    lineWidth: 7,
    lineCap: "round",
  });
  return iconFrom(
    new Node({
      children: [background(), ground, grass, pool, water, surface, lining, probeTube, probe, dial, ...ticks, needle],
    }),
  );
}

export function createFlowIcon(): ScreenIcon {
  const pipeShape = new Shape()
    .moveTo(45, 90)
    .lineTo(130, 90)
    .cubicCurveTo(205, 90, 210, 150, 274, 150)
    .cubicCurveTo(338, 150, 343, 90, 418, 90)
    .lineTo(503, 90)
    .lineTo(503, 283)
    .lineTo(418, 283)
    .cubicCurveTo(343, 283, 338, 223, 274, 223)
    .cubicCurveTo(210, 223, 205, 283, 130, 283)
    .lineTo(45, 283)
    .close();
  const pipe = new Path(pipeShape, {
    fill: WATER_FILL,
    stroke: FluidPressureAndFlowColors.pipeWallColorProperty,
    lineWidth: 10,
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
        tailWidth: 8,
        headWidth: 25,
        headHeight: 22,
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
      new Circle(7, {
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
  const ground = new Rectangle(0, 325, W, H - 325, {
    fill: FluidPressureAndFlowColors.turfTopColorProperty,
  });
  const frame = new Path(
    new Shape()
      .moveTo(120, 165)
      .lineTo(95, 325)
      .moveTo(255, 165)
      .lineTo(280, 325)
      .moveTo(120, 175)
      .lineTo(275, 305)
      .moveTo(255, 175)
      .lineTo(100, 305),
    { stroke: FluidPressureAndFlowColors.towerStructureColorProperty, lineWidth: 8, lineJoin: "round" },
  );
  const tank = new Rectangle(85, 45, 205, 130, {
    fill: FluidPressureAndFlowColors.poolInteriorColorProperty,
    stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
    lineWidth: 7,
  });
  const water = new Rectangle(89, 85, 197, 86, { fill: WATER_FILL });
  const surface = new Line(89, 85, 286, 85, {
    stroke: FluidPressureAndFlowColors.waterEdgeColorProperty,
    lineWidth: 4,
  });
  const lid = new Rectangle(75, 35, 225, 16, {
    fill: FluidPressureAndFlowColors.towerTrimColorProperty,
    stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
    lineWidth: 5,
  });
  const outlet = new Rectangle(282, 130, 40, 24, {
    fill: FluidPressureAndFlowColors.towerTrimColorProperty,
    stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
    lineWidth: 5,
  });
  // Horizontal launch followed by a downward-curving stream, as in the screen.
  const jet = new Path(new Shape().moveTo(319, 142).quadraticCurveTo(423, 142, 480, 321), {
    stroke: WATER_FILL,
    lineWidth: 17,
    lineCap: "round",
  });
  const jetEdge = new Path(new Shape().moveTo(319, 132).quadraticCurveTo(431, 132, 489, 318), {
    stroke: FluidPressureAndFlowColors.waterEdgeColorProperty,
    lineWidth: 3,
  });
  return iconFrom(
    new Node({
      children: [background(), ground, frame, tank, water, surface, lid, outlet, jet, jetEdge],
    }),
  );
}
