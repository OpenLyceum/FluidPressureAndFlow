/**
 * SquarePoolModel.ts
 *
 * A plain rectangular pool, three metres deep and four wide, starting half full.
 *
 * This is the control case for the whole screen: nothing varies but depth, so
 * `p = p₀ + ρgh` can be read straight off the barometer. Every other scene is a
 * departure from it.
 *
 * Geometry follows the PhET Java sim so the pool, its taps and its ruler
 * markings line up with the published artwork.
 */

import { Shape } from "scenerystack/kite";
import { MAX_POOL_HEIGHT } from "../../FluidPressureAndFlowConstants.js";
import { PoolWithFaucetsModel } from "./PoolWithFaucetsModel.js";

/** Left edge of the pool, metres. */
const SQUARE_POOL_MIN_X = -3.2;

/** Width of the pool, metres. */
const SQUARE_POOL_WIDTH = 4;

/** Right edge of the pool, metres. */
const SQUARE_POOL_MAX_X = SQUARE_POOL_MIN_X + SQUARE_POOL_WIDTH;

/** Where the fill tap pours in, just inside the left wall. */
const SQUARE_POOL_INPUT_FAUCET_X = SQUARE_POOL_MIN_X + 0.2;

/**
 * Where the drain empties, just outside the right wall.
 *
 * Outside rather than under the middle: a drain beneath the pool floor is hidden
 * by the pool itself, and the point of drawing it is that a student can see which
 * tap is open and watch the water leave.
 */
const SQUARE_POOL_DRAIN_FAUCET_X = SQUARE_POOL_MAX_X + 0.6;

export class SquarePoolModel extends PoolWithFaucetsModel {
  protected override createContainerShape(): Shape {
    return Shape.rect(SQUARE_POOL_MIN_X, -MAX_POOL_HEIGHT, SQUARE_POOL_WIDTH, MAX_POOL_HEIGHT);
  }

  protected override createWaterShape(waterLevel: number): Shape {
    return Shape.rect(SQUARE_POOL_MIN_X, -MAX_POOL_HEIGHT, SQUARE_POOL_WIDTH, waterLevel);
  }

  public override getGroundOpenings(): ReadonlyArray<{ readonly minX: number; readonly maxX: number }> {
    return [{ minX: SQUARE_POOL_MIN_X, maxX: SQUARE_POOL_MAX_X }];
  }

  public override getInputFaucetX(): number {
    return SQUARE_POOL_INPUT_FAUCET_X;
  }

  public override getDrainFaucetX(): number {
    return SQUARE_POOL_DRAIN_FAUCET_X;
  }
}
