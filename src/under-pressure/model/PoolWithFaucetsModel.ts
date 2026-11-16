import { POOL_WITH_FAUCETS_MODEL_SETTINGS } from "../../FluidPressureAndFlowConstants.js";
/**
 * PoolWithFaucetsModel.ts
 *
 * A pool the student fills and drains with two taps: the square pool and the
 * trapezoid pool, and through the square pool the mystery pool as well.
 *
 * The water *level*, not the volume, is the state variable. That is a deliberate
 * simplification: in the trapezoid pool the cross-section changes with depth, so
 * a constant inflow would raise the level at a varying rate, and watching it
 * crawl and then race would invite exactly the wrong inference — that the shape
 * of the vessel matters to the pressure. Tracking level directly keeps the fill
 * uniform and leaves depth as the only variable in play. Upstream does the same,
 * calling the quantity "volume" while treating it as a height.
 */

import { DerivedProperty, NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { Shape } from "scenerystack/kite";
import { MAX_POOL_HEIGHT } from "../../FluidPressureAndFlowConstants.js";
import { FaucetModel } from "./FaucetModel.js";
import { Pool, type PressureContext } from "./Pool.js";

/**
 * Metres of water level gained per second with the fill tap wide open. Tuned so
 * an empty pool fills in about six seconds — long enough to watch the barometer
 * climb, short enough not to be a chore.
 */
const MAX_FILL_RATE: number = POOL_WITH_FAUCETS_MODEL_SETTINGS.MAX_FILL_RATE;

export abstract class PoolWithFaucetsModel extends Pool {
  /** Depth of water above the pool floor, in metres. */
  public readonly waterLevelProperty = new NumberProperty(MAX_POOL_HEIGHT / 2, { units: "m" });

  /** The tap above the pool. */
  public readonly inputFaucet = new FaucetModel();

  /** The drain in the pool floor. */
  public readonly drainFaucet = new FaucetModel();

  public readonly waterShapeProperty: TReadOnlyProperty<Shape>;

  public constructor() {
    super();

    this.waterShapeProperty = new DerivedProperty([this.waterLevelProperty], (waterLevel) =>
      this.createWaterShape(waterLevel),
    );

    this.waterLevelProperty.link((waterLevel) => {
      this.inputFaucet.isEnabledProperty.value = waterLevel < MAX_POOL_HEIGHT;
      this.drainFaucet.isEnabledProperty.value = waterLevel > 0;
    });
  }

  /**
   * Builds the outline of the water at the given level.
   * @param waterLevel - metres of water above the pool floor
   */
  protected abstract createWaterShape(waterLevel: number): Shape;

  /** Model x the fill tap pours into. Inside an opening, or the water misses. */
  public abstract getInputFaucetX(): number;

  /** Model x the drain empties from, below the pool floor. */
  public abstract getDrainFaucetX(): number;

  /** Altitude (m) of the water surface. Uniform across a connected pool. */
  public getWaterSurfaceY(): number {
    return -MAX_POOL_HEIGHT + this.waterLevelProperty.value;
  }

  public override getPressureSurfaceY(_x: number): number {
    return this.getWaterSurfaceY();
  }

  public override step(dt: number, _context: PressureContext): void {
    const rate = this.inputFaucet.flowRateProperty.value - this.drainFaucet.flowRateProperty.value;
    const level = this.waterLevelProperty.value + rate * MAX_FILL_RATE * dt;
    this.waterLevelProperty.value = Math.max(0, Math.min(MAX_POOL_HEIGHT, level));
  }

  public override reset(): void {
    this.waterLevelProperty.reset();
    this.inputFaucet.reset();
    this.drainFaucet.reset();
  }
}
