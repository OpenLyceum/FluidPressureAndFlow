/**
 * UnderPressureModel.ts
 *
 * The Under Pressure screen: hydrostatics with no moving fluid to distract from
 * it. Four barometers and four vessels, and the whole screen is `p = p₀ + ρgh`.
 *
 * The four pools all exist at once and only one is shown, rather than being
 * rebuilt on each switch. Their state is small, and keeping it means a student
 * who half-fills the square pool, goes to look at the trapezoid and comes back
 * finds their pool as they left it.
 */

import { EnumerationProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Barometer } from "../../common/model/Barometer.js";
import { FluidPressureAndFlowModel, type SharedUnitSystem } from "../../common/model/FluidPressureAndFlowModel.js";
import { EARTH_GRAVITY, NUMBER_OF_BAROMETERS, WATER_DENSITY } from "../../FluidPressureAndFlowConstants.js";
import { ChamberPoolModel } from "./ChamberPoolModel.js";
import { MysteryPoolModel, MysteryQuantity } from "./MysteryPoolModel.js";
import type { Pool, PressureContext } from "./Pool.js";
import { PoolScene } from "./PoolScene.js";
import { SquarePoolModel } from "./SquarePoolModel.js";
import { TrapezoidPoolModel } from "./TrapezoidPoolModel.js";

/** Where a barometer sits when first taken from the toolbox: just under the surface. */
const BAROMETER_START_POSITION = new Vector2(-4, 2);

export class UnderPressureModel extends FluidPressureAndFlowModel {
  private ordinaryGravity = EARTH_GRAVITY;
  private ordinaryFluidDensity = WATER_DENSITY;
  private wasMysteryScene = false;
  public readonly squarePool = new SquarePoolModel();
  public readonly trapezoidPool = new TrapezoidPoolModel();
  public readonly chamberPool = new ChamberPoolModel();
  public readonly mysteryPool = new MysteryPoolModel();

  /** Which vessel is on screen. */
  public readonly sceneProperty = new EnumerationProperty(PoolScene.SQUARE);

  public constructor(sharedUnits?: SharedUnitSystem) {
    super(sharedUnits);

    for (let i = 0; i < NUMBER_OF_BAROMETERS; i++) {
      this.addBarometer(new Barometer(BAROMETER_START_POSITION));
    }

    // The mystery scene overrides whichever quantity it is hiding, and hands
    // control back on the way out. Without the restore, a student who left the
    // scene mid-puzzle would find the density slider silently parked at 1700.
    this.sceneProperty.link(() => this.applyMysteryOverrides());
    this.mysteryPool.mysteryQuantityProperty.link(() => this.applyMysteryOverrides());
    this.mysteryPool.fluidChoiceProperty.link(() => this.applyMysteryOverrides());
    this.mysteryPool.planetChoiceProperty.link(() => this.applyMysteryOverrides());
  }

  /** The vessel currently on screen. */
  public getPool(): Pool {
    const scene = this.sceneProperty.value;
    return scene === PoolScene.SQUARE
      ? this.squarePool
      : scene === PoolScene.TRAPEZOID
        ? this.trapezoidPool
        : scene === PoolScene.CHAMBER
          ? this.chamberPool
          : this.mysteryPool;
  }

  /** True while the mystery scene is hiding the fluid density from the student. */
  public isFluidDensityHidden(): boolean {
    return (
      this.sceneProperty.value === PoolScene.MYSTERY &&
      this.mysteryPool.mysteryQuantityProperty.value === MysteryQuantity.FLUID_DENSITY
    );
  }

  /** True while the mystery scene is hiding gravity from the student. */
  public isGravityHidden(): boolean {
    return (
      this.sceneProperty.value === PoolScene.MYSTERY &&
      this.mysteryPool.mysteryQuantityProperty.value === MysteryQuantity.GRAVITY
    );
  }

  /**
   * Drives gravity and density from the mystery selection while that scene is
   * showing, and restores the student's previous selections on the way out.
   *
   * The quantity that is *not* hidden is pinned to its familiar value — Earth
   * gravity, or water — so the student has exactly one unknown to solve for.
   */
  private applyMysteryOverrides(): void {
    if (this.sceneProperty.value !== PoolScene.MYSTERY) {
      if (this.wasMysteryScene) {
        this.wasMysteryScene = false;
        this.fluidDensityProperty.value = this.ordinaryFluidDensity;
        this.gravityProperty.value = this.ordinaryGravity;
      }
      return;
    }

    if (!this.wasMysteryScene) {
      this.ordinaryFluidDensity = this.fluidDensityProperty.value;
      this.ordinaryGravity = this.gravityProperty.value;
      this.wasMysteryScene = true;
    }

    if (this.mysteryPool.mysteryQuantityProperty.value === MysteryQuantity.FLUID_DENSITY) {
      this.fluidDensityProperty.value = this.mysteryPool.getMysteryFluidDensity();
      this.gravityProperty.value = EARTH_GRAVITY;
    } else {
      this.fluidDensityProperty.value = WATER_DENSITY;
      this.gravityProperty.value = this.mysteryPool.getMysteryGravity();
    }
  }

  /** The surroundings each pool needs in order to report a pressure. */
  private getPressureContext(): PressureContext {
    return {
      getAirPressure: (altitude: number) => this.getAirPressure(altitude),
      fluidDensity: this.fluidDensityProperty.value,
      gravity: this.gravityProperty.value,
    };
  }

  public override getPressureAt(x: number, y: number): number | null {
    return this.getPool().getPressureAt(x, y, this.getPressureContext());
  }

  public override step(dt: number): void {
    this.getPool().step(dt, this.getPressureContext());
    this.updateSensorValues();
  }

  public override reset(): void {
    this.sceneProperty.reset();
    super.reset();
    this.ordinaryGravity = EARTH_GRAVITY;
    this.ordinaryFluidDensity = WATER_DENSITY;
    this.squarePool.reset();
    this.trapezoidPool.reset();
    this.chamberPool.reset();
    this.mysteryPool.reset();
  }
}
