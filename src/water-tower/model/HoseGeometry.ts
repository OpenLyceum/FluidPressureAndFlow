/**
 * HoseGeometry.ts
 *
 * Filled hose shape built from Kite arcs, ported from PhET's HTML5
 * fluid-pressure-and-flow HoseNode (createTopShape / createBottomShape).
 *
 * Layout coordinates are metres from the hole's x and the tank's base y:
 * +x out towards the nozzle, +y up. Only the origin differs from world coordinates, so the mapping
 * back is a translation and nothing is rescaled. That matters: the port's outline
 * mixes horizontal and vertical offsets of the same bore width, and the elbow is
 * closed with a circular arc of that radius, so any difference between the x and
 * y scales shows up as a riser thinner than the runs and a bend that does not
 * meet the spout.
 */

import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";

/** Length of the nozzle, metres. */
export const HOSE_NOZZLE_LENGTH = 2.4;

/** Corner fillet radius in metres, matching the artwork at its 12 px/m scale. */
const CORNER_RADIUS = 0.25;

/**
 * Where the riser stands, as a fraction of the run from the tank to the nozzle.
 * A fraction rather than a fixed distance because the run shortens as the
 * student widens the tank, and the riser has to stay clear of the elbow.
 */
const RISER_FRACTION = 0.36;

/** Straight segment between the elbow and the nozzle, metres. */
export const HOSE_LAYOUT_H2 = 2.1;

/** Hose bore diameter, metres. */
export const HOSE_LAYOUT_WIDTH = 1.5;

export type HoseLayout = {
  readonly angleWithVertical: number;
  readonly mouthX: number;
  readonly mouthY: number;
  readonly nozzleAttachmentOuterX: number;
  readonly nozzleAttachmentOuterY: number;
  readonly elbowOuterX: number;
  readonly elbowOuterY: number;
  readonly nozzleAttachmentInnerX: number;
  readonly nozzleAttachmentInnerY: number;
  readonly elbowInnerX: number;
  readonly elbowInnerY: number;
  readonly elbowLowerX: number;
  readonly elbowLowerY: number;
  readonly width: number;
  readonly L1: number;
};

/**
 * Layout geometry from the HTML5 Hose model's `update()`.
 *
 * @param pivotX - nozzle mouth's distance out from the tank's hole, metres
 * @param pivotY - nozzle mouth's height above the tank's base, metres
 * @param angle - aim, radians from horizontal
 */
export function computeHoseLayout(pivotX: number, pivotY: number, angle: number): HoseLayout {
  const angleWithVertical = Math.PI / 2 - angle;
  // Back off the spout so the nozzle bitmap, not the green pipe, reaches the outlet.
  const mouthX = pivotX - HOSE_NOZZLE_LENGTH * Math.cos(angle);
  const mouthY = pivotY - HOSE_NOZZLE_LENGTH * Math.sin(angle);
  const nozzleAttachmentOuterX = mouthX + (HOSE_LAYOUT_WIDTH / 2) * Math.sin(angle);
  const nozzleAttachmentOuterY = mouthY - (HOSE_LAYOUT_WIDTH / 2) * Math.cos(angle);
  const elbowOuterX = nozzleAttachmentOuterX - HOSE_LAYOUT_H2 * Math.cos(angle);
  const elbowOuterY = nozzleAttachmentOuterY - HOSE_LAYOUT_H2 * Math.sin(angle);
  const nozzleAttachmentInnerX = nozzleAttachmentOuterX - HOSE_LAYOUT_WIDTH * Math.sin(angle);
  const nozzleAttachmentInnerY = nozzleAttachmentOuterY + HOSE_LAYOUT_WIDTH * Math.cos(angle);
  const elbowInnerX = nozzleAttachmentInnerX - HOSE_LAYOUT_H2 * Math.cos(angle);
  const elbowInnerY = nozzleAttachmentInnerY - HOSE_LAYOUT_H2 * Math.sin(angle);
  const elbowLowerX = elbowOuterX - HOSE_LAYOUT_WIDTH * Math.sin(angle);
  const elbowLowerY = elbowOuterY - (HOSE_LAYOUT_WIDTH - HOSE_LAYOUT_WIDTH * Math.cos(angle));

  return {
    angleWithVertical,
    mouthX,
    mouthY,
    nozzleAttachmentOuterX,
    nozzleAttachmentOuterY,
    elbowOuterX,
    elbowOuterY,
    nozzleAttachmentInnerX,
    nozzleAttachmentInnerY,
    elbowInnerX,
    elbowInnerY,
    elbowLowerX,
    elbowLowerY,
    width: HOSE_LAYOUT_WIDTH,
    L1: RISER_FRACTION * pivotX,
  };
}

/**
 * Lowest the nozzle may sit at this aim without the hose dipping underground.
 *
 * The far run hangs a spout plus an elbow plus a bore below the nozzle when the
 * nozzle points up, and almost nothing below it when the nozzle points sideways,
 * so the limit has to follow the aim rather than being one conservative number.
 */
export function getMinOutletY(angle: number): number {
  return (HOSE_NOZZLE_LENGTH + HOSE_LAYOUT_H2) * Math.sin(angle) + HOSE_LAYOUT_WIDTH * (1 - Math.cos(angle) / 2);
}

function useTopShape(layout: HoseLayout): boolean {
  return layout.elbowOuterY >= 0.2 * Math.cos(layout.angleWithVertical);
}

function mapLayoutX(layoutX: number, holeX: number): number {
  return holeX + layoutX;
}

function mapLayoutY(layoutY: number, tankBaseY: number): number {
  return tankBaseY + layoutY;
}

/** Centre of the hose's open mouth — where the nozzle bitmap joins the pipe. */
export function getHoseMouthPoint(layout: HoseLayout, holeX: number, tankBaseY: number): Vector2 {
  return new Vector2(mapLayoutX(layout.mouthX, holeX), mapLayoutY(layout.mouthY, tankBaseY));
}

/** Upper edge of the run the nozzle hangs off — where the height drag handle sits. */
export function getHoseHeightHandlePoint(layout: HoseLayout, holeX: number, tankBaseY: number): Vector2 {
  return new Vector2(
    mapLayoutX((layout.elbowInnerX + layout.L1) / 2, holeX),
    mapLayoutY(layout.elbowInnerY, tankBaseY),
  );
}

/** Filled hose path in SI coordinates, shared by rendering and pressure sampling. */
export function createHoseShape(layout: HoseLayout, holeX: number, tankBaseY: number): Shape {
  return useTopShape(layout) ? createTopShape(layout, holeX, tankBaseY) : createBottomShape(layout, holeX, tankBaseY);
}

// Shape when the height handle sits above the hole (HTML5 createTopShape).
function createTopShape(hose: HoseLayout, holeX: number, tankBaseY: number): Shape {
  const mx = (layoutX: number) => mapLayoutX(layoutX, holeX);
  const my = (layoutY: number) => mapLayoutY(layoutY, tankBaseY);

  let shape = new Shape();
  shape = shape
    .moveTo(mx(hose.elbowOuterX), my(hose.elbowOuterY))
    .lineTo(mx(hose.nozzleAttachmentOuterX), my(hose.nozzleAttachmentOuterY))
    .lineTo(mx(hose.nozzleAttachmentInnerX), my(hose.nozzleAttachmentInnerY))
    .lineTo(mx(hose.elbowInnerX), my(hose.elbowInnerY) + CORNER_RADIUS * Math.cos(hose.angleWithVertical))
    .arc(
      mx(hose.elbowInnerX) - CORNER_RADIUS,
      my(hose.elbowInnerY) + CORNER_RADIUS,
      CORNER_RADIUS,
      -hose.angleWithVertical,
      -Math.PI / 2,
      true,
    )
    .lineTo(mx(hose.L1 - hose.width) + CORNER_RADIUS, my(hose.elbowInnerY));

  if (hose.elbowInnerY - hose.width > 0.6) {
    shape = shape
      .arc(
        mx(hose.L1 - hose.width) + CORNER_RADIUS,
        my(hose.elbowInnerY) - CORNER_RADIUS,
        CORNER_RADIUS,
        Math.PI / 2,
        -Math.PI,
        false,
      )
      .lineTo(mx(hose.L1 - hose.width), my(hose.width) + CORNER_RADIUS)
      .arc(
        mx(hose.L1 - hose.width) - CORNER_RADIUS,
        my(hose.width) + CORNER_RADIUS,
        CORNER_RADIUS,
        0,
        -Math.PI / 2,
        true,
      );
  }

  shape = shape.lineTo(mx(0), my(hose.width)).lineTo(mx(0), my(0));

  if (hose.elbowInnerY - hose.width > 0.6) {
    shape = shape
      .lineTo(mx(hose.L1) - CORNER_RADIUS, my(0))
      .arc(mx(hose.L1) - CORNER_RADIUS, my(0) + CORNER_RADIUS, CORNER_RADIUS, -Math.PI / 2, 0, false)
      .lineTo(mx(hose.L1), my(hose.elbowLowerY) - CORNER_RADIUS)
      .arc(
        mx(hose.L1) + CORNER_RADIUS,
        my(hose.elbowLowerY) - CORNER_RADIUS,
        CORNER_RADIUS,
        -Math.PI,
        Math.PI / 2,
        true,
      );
  } else {
    shape = shape.lineTo(mx(hose.L1), my(hose.elbowLowerY));
  }

  shape = shape
    .lineTo(mx(hose.elbowLowerX), my(hose.elbowLowerY))
    .arc(mx(hose.elbowInnerX), my(hose.elbowInnerY), hose.width, -Math.PI / 2, -hose.angleWithVertical, false);

  return shape;
}

// Shape when the height handle sits below the hole (HTML5 createBottomShape).
function createBottomShape(hose: HoseLayout, holeX: number, tankBaseY: number): Shape {
  const mx = (layoutX: number) => mapLayoutX(layoutX, holeX);
  const my = (layoutY: number) => mapLayoutY(layoutY, tankBaseY);

  let shape = new Shape();
  shape = shape
    .moveTo(mx(hose.elbowOuterX), my(hose.elbowOuterY))
    .lineTo(mx(hose.nozzleAttachmentOuterX), my(hose.nozzleAttachmentOuterY))
    .lineTo(mx(hose.nozzleAttachmentInnerX), my(hose.nozzleAttachmentInnerY))
    .lineTo(mx(hose.elbowInnerX), my(hose.elbowInnerY) + CORNER_RADIUS * Math.cos(hose.angleWithVertical))
    .arc(
      mx(hose.elbowInnerX) - CORNER_RADIUS,
      my(hose.elbowInnerY) + CORNER_RADIUS,
      CORNER_RADIUS,
      -hose.angleWithVertical,
      -Math.PI / 2,
      true,
    )
    .lineTo(mx(hose.L1) + CORNER_RADIUS, my(hose.elbowInnerY));

  if (-hose.elbowInnerY + hose.width > 0.6) {
    shape = shape
      .arc(
        mx(hose.L1) + CORNER_RADIUS,
        my(hose.elbowInnerY) + CORNER_RADIUS,
        CORNER_RADIUS,
        -Math.PI / 2,
        -Math.PI,
        true,
      )
      .lineTo(mx(hose.L1), my(hose.width) - CORNER_RADIUS)
      .arc(mx(hose.L1) - CORNER_RADIUS, my(hose.width) - CORNER_RADIUS, CORNER_RADIUS, 0, Math.PI / 2, false);
  }

  shape = shape.lineTo(mx(0), my(hose.width)).lineTo(mx(0), my(0));

  if (-hose.elbowInnerY + hose.width > 0.6) {
    shape = shape
      .lineTo(mx(hose.L1 - hose.width) - CORNER_RADIUS, my(0))
      .arc(mx(hose.L1 - hose.width) - CORNER_RADIUS, my(0) - CORNER_RADIUS, CORNER_RADIUS, Math.PI / 2, 0, true)
      .lineTo(mx(hose.L1 - hose.width), my(hose.elbowLowerY) + CORNER_RADIUS)
      .arc(
        mx(hose.L1 - hose.width) + CORNER_RADIUS,
        my(hose.elbowLowerY) + CORNER_RADIUS,
        CORNER_RADIUS,
        -Math.PI,
        -Math.PI / 2,
        false,
      );
  } else {
    shape = shape.lineTo(mx(hose.L1 - hose.width), my(hose.elbowLowerY));
  }

  shape = shape
    .lineTo(mx(hose.elbowLowerX), my(hose.elbowLowerY))
    .arc(mx(hose.elbowInnerX), my(hose.elbowInnerY), hose.width, -Math.PI / 2, -hose.angleWithVertical, false);

  return shape;
}
