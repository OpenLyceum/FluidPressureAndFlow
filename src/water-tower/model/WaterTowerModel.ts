/**
 * WaterTowerModel.ts
 *
 * The Water Tower screen: a tank of water, a hole in its side, and the jet that
 * comes out.
 *
 * ── Torricelli ────────────────────────────────────────────────────────────────
 * The efflux speed is `v = √(2gh)`, with `h` the height of the free surface above
 * the outlet — the hole in the tank's side, or the hose nozzle when the hose is
 * attached. That is Bernoulli applied between the surface (at rest, at
 * atmospheric pressure) and the outlet (moving, also at atmospheric pressure),
 * and it is the whole screen. Two things follow that students reliably predict
 * wrongly, and that the sim exists to test:
 *
 *  - the speed does not depend on how *much* water is in the tank, only on how
 *    high its surface is above the hole;
 *  - the speed does not depend on the fluid. Honey and gasoline leave at the same
 *    speed, because ρ cancels.
 *
 * There is deliberately no gravity control on this screen. PhET's design document
 * is explicit about why: a student should be able to *measure* g from the efflux
 * speed and the drop height, which they cannot do if a slider hands it to them.
 *
 * ── Fixed internal timestep ───────────────────────────────────────────────────
 * Drops are emitted once per internal step and carry the volume that left in that
 * step. If the step length varied with the frame rate, the drops would change
 * size with it — so the model accumulates real time and consumes it in fixed
 * bites. Upstream's Java version instead skipped every third frame for slow
 * motion, which quantised the slowdown; the accumulator does not.
 */

import { BooleanProperty, EnumerationProperty, NumberProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { TimeSpeed } from "scenerystack/scenery-phet";
import { Barometer } from "../../common/model/Barometer.js";
import { FluidPressureAndFlowModel, type SharedUnitSystem } from "../../common/model/FluidPressureAndFlowModel.js";
import { VelocitySensor } from "../../common/model/VelocitySensor.js";
import { EARTH_GRAVITY, MAX_DT, SLOW_MOTION_FACTOR } from "../../FluidPressureAndFlowConstants.js";
import { FaucetMode } from "./FaucetMode.js";
import { Hose } from "./Hose.js";
import { WaterDrop } from "./WaterDrop.js";
import { WaterTower } from "./WaterTower.js";

/** Instruments available on this screen. */
const NUMBER_OF_BAROMETERS = 2;
const NUMBER_OF_VELOCITY_SENSORS = 2;

/** Where an instrument sits before the student moves it, model coordinates. */
const BAROMETER_START = new Vector2(6, 22);
const VELOCITY_SENSOR_START = new Vector2(9, 20);

/** Length of one internal step, seconds. See the class comment. */
const FIXED_TIMESTEP = 0.016;

/**
 * Effective outlet area, m². Not `π(HOLE_SIZE/2)²`: a real orifice discharges
 * less than its geometric area because the jet contracts just outside it, and
 * this value is tuned so the tank empties at a rate that is watchable rather than
 * instantaneous. It sets the pace of the screen, not any of its physics.
 */
const EFFECTIVE_OUTLET_AREA = 2.8;

/** Smallest drop that is worth drawing, metres. */
const MIN_DROP_RADIUS = 0.1;

/** Maximum inflow from the faucet, m³ per second. */
const MAX_FAUCET_FLOW_RATE = 30;

/**
 * Where the faucet's spout is, model coordinates. Above the tank's highest
 * position, so it still pours *into* the tank when the tank is raised all the way.
 */
export const FAUCET_POSITION = new Vector2(0, 27);

/** Altitude at which a falling drop is considered to have landed and is removed. */
const GROUND_Y = 0;

export class WaterTowerModel extends FluidPressureAndFlowModel {
  public readonly waterTower = new WaterTower();
  public readonly hose = new Hose();

  /** How the faucet above the tank is controlled. */
  public readonly faucetModeProperty = new EnumerationProperty(FaucetMode.MANUAL);

  /** Faucet handle position, 0 (closed) to 1 (wide open). */
  public readonly faucetFlowRateProperty = new NumberProperty(0);

  /** Whether the clock is running. */
  public readonly isPlayingProperty = new BooleanProperty(true);

  /** Normal or slow motion. */
  public readonly timeSpeedProperty = new EnumerationProperty(TimeSpeed.NORMAL);

  /** Drops leaving the tank or the hose. */
  public readonly effluxDrops: WaterDrop[] = [];

  /** Drops falling from the faucet into the tank. */
  public readonly faucetDrops: WaterDrop[] = [];

  /** Real time banked but not yet consumed by a fixed step. */
  private timeAccumulator = 0;

  public constructor(sharedUnits?: SharedUnitSystem) {
    super(sharedUnits);

    for (let i = 0; i < NUMBER_OF_BAROMETERS; i++) {
      this.addBarometer(new Barometer(BAROMETER_START));
    }
    for (let i = 0; i < NUMBER_OF_VELOCITY_SENSORS; i++) {
      this.addVelocitySensor(new VelocitySensor(VELOCITY_SENSOR_START));
    }

    this.waterTower.baseCenterProperty.link(() => this.updateSensorValues());
    this.waterTower.fluidVolumeProperty.link(() => this.updateSensorValues());
    this.waterTower.capacityProperty.link(() => this.updateSensorValues());
    this.hose.isEnabledProperty.link(() => this.updateSensorValues());
    this.hose.outletYProperty.link(() => this.updateSensorValues());
    this.hose.angleProperty.link(() => this.updateSensorValues());
  }

  /** Where fluid leaves the system: the hole in the tank, or the hose nozzle. */
  public getOutletPosition(): Vector2 {
    return this.hose.isEnabledProperty.value ? this.hose.getOutletPosition() : this.waterTower.getHolePosition();
  }

  /**
   * Height of the free surface above the outlet, metres. Negative when the outlet
   * has been raised above the water, in which case nothing flows.
   */
  public getHead(): number {
    return this.waterTower.getFluidSurfaceY() - this.getOutletPosition().y;
  }

  /** Efflux speed from Torricelli's law, m/s. Zero when there is no head. */
  public getEffluxSpeed(): number {
    const head = this.getHead();
    return head > 0 ? Math.sqrt(2 * EARTH_GRAVITY * head) : 0;
  }

  /** Whether fluid is actually leaving right now. */
  public isFlowing(): boolean {
    return (
      this.waterTower.isHoleOpenProperty.value &&
      this.waterTower.fluidVolumeProperty.value > 0 &&
      this.waterTower.getFluidSurfaceY() > this.waterTower.getHolePosition().y &&
      this.getEffluxSpeed() > 0
    );
  }

  /**
   * Pressure at a point.
   *
   * Inside the tank's water: air pressure at the free surface plus ρgh. Anywhere
   * else — including inside the falling jet — plain air pressure. The jet really
   * is at atmospheric pressure once it has left the outlet, but the barometer
   * also reads air pressure *inside the hose*, which is not right and which
   * upstream has an open design question about
   * (phetsims/fluid-pressure-and-flow#322). Recorded in doc/model.md.
   */
  public override getPressureAt(x: number, y: number): number | null {
    const base = this.waterTower.baseCenterProperty.value;
    const surfaceY = this.waterTower.getFluidSurfaceY();
    const outlet = this.getOutletPosition();
    if (
      surfaceY > this.waterTower.getHolePosition().y &&
      this.getHead() > 0 &&
      this.hose.containsPoint(this.waterTower.getHolePosition(), x, y)
    ) {
      // Bernoulli between the hose point and the open nozzle: the speed is
      // constant through the hose, so only elevation changes its static
      // pressure. At the nozzle this correctly reduces to ambient pressure.
      return this.getAirPressure(outlet.y) + this.fluidDensityProperty.value * EARTH_GRAVITY * (outlet.y - y);
    }
    const isInTankWater =
      Math.abs(x - base.x) <= this.waterTower.getRadius() &&
      y >= base.y &&
      y <= surfaceY &&
      this.waterTower.getFluidLevel() > 0;

    if (isInTankWater) {
      return this.getAirPressure(surfaceY) + this.fluidDensityProperty.value * EARTH_GRAVITY * (surfaceY - y);
    }
    return y >= 0 ? this.getAirPressure(y) : null;
  }

  /**
   * Velocity at a point: zero in the still water of the tank, and the local
   * velocity of a drop if the probe is inside one.
   *
   * Reporting zero throughout the tank is one of the screen's quieter lessons —
   * the water is not "rushing toward the hole", it is standing still until the
   * moment it leaves.
   */
  public override getVelocityAt(x: number, y: number): Vector2 | null {
    for (const drop of this.effluxDrops) {
      if (drop.position.distance(new Vector2(x, y)) <= drop.getRadius()) {
        return drop.velocity;
      }
    }

    const base = this.waterTower.baseCenterProperty.value;
    const inTank =
      Math.abs(x - base.x) <= this.waterTower.getRadius() && y >= base.y && y <= this.waterTower.getFluidSurfaceY();
    return inTank ? Vector2.ZERO : null;
  }

  public override step(dt: number): void {
    if (!this.isPlayingProperty.value) {
      return;
    }
    const speedFactor = this.timeSpeedProperty.value === TimeSpeed.SLOW ? SLOW_MOTION_FACTOR : 1;
    this.timeAccumulator += Math.min(dt, MAX_DT) * speedFactor;

    while (this.timeAccumulator >= FIXED_TIMESTEP) {
      this.timeAccumulator -= FIXED_TIMESTEP;
      this.stepOnce(FIXED_TIMESTEP);
    }
  }

  /** One fixed internal step. Also what the step-forward button fires. */
  public stepOnce(dt: number): void {
    const volumeLost = this.stepEfflux(dt);
    this.stepFaucet(dt, volumeLost);
    this.stepDrops(dt);
    this.updateSensorValues();
  }

  /**
   * Lets fluid out of the tank and emits a drop carrying it.
   *
   * @returns the volume that left this step, m³
   */
  private stepEfflux(dt: number): number {
    if (!this.isFlowing()) {
      return 0;
    }

    const speed = this.getEffluxSpeed();
    const wanted = speed * EFFECTIVE_OUTLET_AREA * dt;
    const volume = Math.min(wanted, this.waterTower.fluidVolumeProperty.value);
    this.waterTower.fluidVolumeProperty.value -= volume;

    const drop = new WaterDrop(this.getOutletPosition(), this.getEffluxVelocity(speed), volume);
    if (drop.getRadius() >= MIN_DROP_RADIUS) {
      this.effluxDrops.push(drop);
    }
    return volume;
  }

  /** Direction and speed the jet leaves at: sideways from the hole, aimed from the hose. */
  private getEffluxVelocity(speed: number): Vector2 {
    return this.hose.isEnabledProperty.value ? this.hose.getDirection().timesScalar(speed) : new Vector2(speed, 0);
  }

  /**
   * Runs the faucet, either at whatever the student set or at exactly the rate
   * fluid is leaving.
   *
   * @param volumeLost - what left through the outlet this step, m³
   */
  private stepFaucet(dt: number, volumeLost: number): void {
    if (this.faucetModeProperty.value === FaucetMode.MATCH_LEAKAGE) {
      // Put back precisely what left, so the head — and so the efflux speed —
      // holds steady while the student measures the jet.
      this.faucetFlowRateProperty.value = dt > 0 ? Math.min(1, volumeLost / (MAX_FAUCET_FLOW_RATE * dt)) : 0;
      this.addToTank(volumeLost);
      return;
    }

    const inflow = this.faucetFlowRateProperty.value * MAX_FAUCET_FLOW_RATE * dt;
    if (inflow > 0) {
      this.addToTank(inflow);
      this.faucetDrops.push(new WaterDrop(FAUCET_POSITION.copy(), new Vector2(0, 0), Math.min(inflow, 0.5)));
    }
  }

  /** Adds fluid to the tank, up to its capacity. */
  private addToTank(volume: number): void {
    this.waterTower.fluidVolumeProperty.value = Math.min(
      this.waterTower.capacityProperty.value,
      this.waterTower.fluidVolumeProperty.value + volume,
    );
  }

  /** Advances every drop and retires the ones that have landed or arrived. */
  private stepDrops(dt: number): void {
    for (let i = this.effluxDrops.length - 1; i >= 0; i--) {
      const drop = this.effluxDrops[i] as WaterDrop;
      drop.step(dt, EARTH_GRAVITY);
      if (drop.position.y <= GROUND_Y) {
        this.effluxDrops.splice(i, 1);
      }
    }

    // Faucet drops fall to the top of the tank and vanish into it; the volume
    // they represent was already banked when they were created, so they are
    // purely a visual account of where it went.
    const tankTopY = this.waterTower.baseCenterProperty.value.y + this.waterTower.getFluidLevel();
    for (let i = this.faucetDrops.length - 1; i >= 0; i--) {
      const drop = this.faucetDrops[i] as WaterDrop;
      drop.step(dt, EARTH_GRAVITY);
      if (drop.position.y <= tankTopY) {
        this.faucetDrops.splice(i, 1);
      }
    }
  }

  public override reset(): void {
    super.reset();
    this.waterTower.reset();
    this.hose.reset();
    this.faucetModeProperty.reset();
    this.faucetFlowRateProperty.reset();
    this.isPlayingProperty.reset();
    this.timeSpeedProperty.reset();
    this.effluxDrops.length = 0;
    this.faucetDrops.length = 0;
    this.timeAccumulator = 0;
  }
}
