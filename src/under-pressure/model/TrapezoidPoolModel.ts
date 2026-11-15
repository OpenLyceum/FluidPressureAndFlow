/**
 * TrapezoidPoolModel.ts
 *
 * Two chambers of opposite taper — one narrow at the top and wide at the floor,
 * one wide at the top and narrow at the floor — joined by a passage across the
 * bottom so they hold a single connected body of water.
 *
 * The shape exists to make "pressure depends on the shape of the container" a
 * testable claim and then refute it: put one barometer in each chamber at the
 * same depth and they agree, even though the water standing above them differs
 * enormously in volume. The wide-over-narrow chamber is the harder case for a
 * student to predict, which is why the mirroring is worth the geometry.
 *
 * Dimensions follow the PhET Java sim.
 */

import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { MAX_POOL_HEIGHT } from "../../FluidPressureAndFlowConstants.js";
import { PoolWithFaucetsModel } from "./PoolWithFaucetsModel.js";

/** Width of the narrow end of either chamber, metres. */
const WIDTH_AT_NARROW_END = 1;

/** Width of the wide end of either chamber, metres. */
const WIDTH_AT_WIDE_END = 4;

/**
 * Centre of the left chamber's opening at ground level, metres.
 * @internal Exported for unit tests; not part of the application API.
 */
export const TRAPEZOID_LEFT_CHAMBER_CENTER_X = -2.9;

/** Horizontal distance between the two chambers' openings, metres. */
const CHAMBER_SEPARATION = 3.9;

/**
 * Centre of the right chamber's floor, metres.
 * @internal Exported for unit tests; not part of the application API.
 */
export const TRAPEZOID_RIGHT_CHAMBER_CENTER_X = TRAPEZOID_LEFT_CHAMBER_CENTER_X + CHAMBER_SEPARATION;

/** Height of the passage joining the two chambers along the floor, metres. */
const PASSAGE_HEIGHT = 0.25;

/**
 * Half-width of a chamber at the given depth, linearly interpolated between its
 * two ends.
 *
 * @param waterLevel - metres above the floor
 * @param halfWidthAtFloor - metres
 * @param halfWidthAtGround - metres
 */
function halfWidthAt(waterLevel: number, halfWidthAtFloor: number, halfWidthAtGround: number): number {
  const fraction = waterLevel / MAX_POOL_HEIGHT;
  return halfWidthAtFloor + (halfWidthAtGround - halfWidthAtFloor) * fraction;
}

export class TrapezoidPoolModel extends PoolWithFaucetsModel {
  /** The left chamber: narrow at the top, flaring out toward the floor. */
  private static getLeftChamberShape(): Shape {
    return Shape.polygon([
      new Vector2(TRAPEZOID_LEFT_CHAMBER_CENTER_X - WIDTH_AT_NARROW_END / 2, 0),
      new Vector2(TRAPEZOID_LEFT_CHAMBER_CENTER_X - WIDTH_AT_WIDE_END / 2, -MAX_POOL_HEIGHT),
      new Vector2(TRAPEZOID_LEFT_CHAMBER_CENTER_X + WIDTH_AT_WIDE_END / 2, -MAX_POOL_HEIGHT),
      new Vector2(TRAPEZOID_LEFT_CHAMBER_CENTER_X + WIDTH_AT_NARROW_END / 2, 0),
    ]);
  }

  /** The right chamber: wide at the top, tapering in toward the floor. */
  private static getRightChamberShape(): Shape {
    return Shape.polygon([
      new Vector2(TRAPEZOID_RIGHT_CHAMBER_CENTER_X - WIDTH_AT_WIDE_END / 2, 0),
      new Vector2(TRAPEZOID_RIGHT_CHAMBER_CENTER_X - WIDTH_AT_NARROW_END / 2, -MAX_POOL_HEIGHT),
      new Vector2(TRAPEZOID_RIGHT_CHAMBER_CENTER_X + WIDTH_AT_NARROW_END / 2, -MAX_POOL_HEIGHT),
      new Vector2(TRAPEZOID_RIGHT_CHAMBER_CENTER_X + WIDTH_AT_WIDE_END / 2, 0),
    ]);
  }

  /** The channel across the floor that makes the two chambers one body of water. */
  private static getPassageShape(): Shape {
    return Shape.rect(TRAPEZOID_LEFT_CHAMBER_CENTER_X, -MAX_POOL_HEIGHT, CHAMBER_SEPARATION, PASSAGE_HEIGHT);
  }

  protected override createContainerShape(): Shape {
    return TrapezoidPoolModel.getLeftChamberShape()
      .shapeUnion(TrapezoidPoolModel.getRightChamberShape())
      .shapeUnion(TrapezoidPoolModel.getPassageShape());
  }

  /**
   * The water, built directly as two trapezoids plus the passage rather than by
   * clipping the container. Intersecting polygons every time the level ticks
   * would be both slower and prone to leaving hairline artifacts along the
   * sloped walls where the cut lands between vertices.
   */
  protected override createWaterShape(waterLevel: number): Shape {
    const floorY = -MAX_POOL_HEIGHT;
    const surfaceY = floorY + waterLevel;

    // Left chamber tapers inward going up; right chamber outward.
    const leftHalfWidth = halfWidthAt(waterLevel, WIDTH_AT_WIDE_END / 2, WIDTH_AT_NARROW_END / 2);
    const rightHalfWidth = halfWidthAt(waterLevel, WIDTH_AT_NARROW_END / 2, WIDTH_AT_WIDE_END / 2);

    const leftWater = Shape.polygon([
      new Vector2(TRAPEZOID_LEFT_CHAMBER_CENTER_X - WIDTH_AT_WIDE_END / 2, floorY),
      new Vector2(TRAPEZOID_LEFT_CHAMBER_CENTER_X + WIDTH_AT_WIDE_END / 2, floorY),
      new Vector2(TRAPEZOID_LEFT_CHAMBER_CENTER_X + leftHalfWidth, surfaceY),
      new Vector2(TRAPEZOID_LEFT_CHAMBER_CENTER_X - leftHalfWidth, surfaceY),
    ]);

    const rightWater = Shape.polygon([
      new Vector2(TRAPEZOID_RIGHT_CHAMBER_CENTER_X - WIDTH_AT_NARROW_END / 2, floorY),
      new Vector2(TRAPEZOID_RIGHT_CHAMBER_CENTER_X + WIDTH_AT_NARROW_END / 2, floorY),
      new Vector2(TRAPEZOID_RIGHT_CHAMBER_CENTER_X + rightHalfWidth, surfaceY),
      new Vector2(TRAPEZOID_RIGHT_CHAMBER_CENTER_X - rightHalfWidth, surfaceY),
    ]);

    const passageWater = Shape.rect(
      TRAPEZOID_LEFT_CHAMBER_CENTER_X,
      floorY,
      CHAMBER_SEPARATION,
      Math.min(waterLevel, PASSAGE_HEIGHT),
    );

    return leftWater.shapeUnion(rightWater).shapeUnion(passageWater);
  }

  /**
   * Two openings with solid ground between them — the narrow mouth of the left
   * chamber and the wide mouth of the right.
   */
  public override getGroundOpenings(): ReadonlyArray<{ readonly minX: number; readonly maxX: number }> {
    return [
      {
        minX: TRAPEZOID_LEFT_CHAMBER_CENTER_X - WIDTH_AT_NARROW_END / 2,
        maxX: TRAPEZOID_LEFT_CHAMBER_CENTER_X + WIDTH_AT_NARROW_END / 2,
      },
      {
        minX: TRAPEZOID_RIGHT_CHAMBER_CENTER_X - WIDTH_AT_WIDE_END / 2,
        maxX: TRAPEZOID_RIGHT_CHAMBER_CENTER_X + WIDTH_AT_WIDE_END / 2,
      },
    ];
  }

  public override getInputFaucetX(): number {
    return TRAPEZOID_LEFT_CHAMBER_CENTER_X;
  }

  /**
   * Clear of the right chamber's wide mouth. Draining from beneath the joining
   * passage would be the lowest point, but it would also be hidden behind the pool.
   */
  public override getDrainFaucetX(): number {
    return TRAPEZOID_RIGHT_CHAMBER_CENTER_X + WIDTH_AT_WIDE_END / 2 + 0.6;
  }
}
