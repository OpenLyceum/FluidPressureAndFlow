/**
 * FlowModel.ts
 *
 * The Flow screen: an incompressible fluid moving through a pipe the student can
 * reshape, with barometers and speedometers to catch what happens when it does.
 *
 * ── Pressure ─────────────────────────────────────────────────────────────────
 * Inside the pipe, Bernoulli along a streamline:
 *
 *     P = P₀ − ρgy − ½ρv²
 *
 * with P₀ taken as sea-level air pressure. The two terms are the whole lesson:
 * raise the pipe and the pressure falls with height, narrow it and the pressure
 * falls with speed. The second is the counter-intuitive one, and it is why the
 * flux meter and the barometer are on the same screen.
 *
 * Two departures from a strict reading of Bernoulli, both documented in
 * doc/model.md:
 *
 *  - Gravity is fixed at Earth's here, unlike the Under Pressure screen. There
 *    is no gravity control on this screen, and letting the pressure term follow a
 *    slider that is not on screen would be worse than pinning it.
 *  - The reported pressure is clamped at zero. Bernoulli can be driven negative
 *    in a narrow, fast pipe, which is not a pressure but a sign the model has
 *    left its domain (phetsims/fluid-pressure-and-flow#199).
 */

import { BooleanProperty, EnumerationProperty, NumberProperty } from "scenerystack/axon";
import { dotRandom, Vector2 } from "scenerystack/dot";
import { TimeSpeed } from "scenerystack/scenery-phet";
import { getStandardAirPressure } from "../../common/model/airPressure.js";
import { Barometer } from "../../common/model/Barometer.js";
import { FluidPressureAndFlowModel, type SharedUnitSystem } from "../../common/model/FluidPressureAndFlowModel.js";
import { VelocitySensor } from "../../common/model/VelocitySensor.js";
import { DEFAULT_FLOW_RATE, EARTH_GRAVITY, MAX_DT, SLOW_MOTION_FACTOR } from "../../FluidPressureAndFlowConstants.js";
import { FluxMeter } from "./FluxMeter.js";
import { Particle } from "./Particle.js";
import { Pipe } from "./Pipe.js";

/** Barometers and speedometers available on this screen. */
const NUMBER_OF_BAROMETERS = 2;
const NUMBER_OF_VELOCITY_SENSORS = 2;

/** Where an instrument sits before the student moves it, model coordinates. */
const BAROMETER_START = new Vector2(3, 1.2);
const VELOCITY_SENSOR_START = new Vector2(1, 0.5);

/** Marker dots dripped into the pipe per second. */
const DRIP_RATE = 10;

/** Radius of a dripped dot, metres. */
const DRIP_RADIUS = 0.1;

/** Radius of an injected grid dot, metres. */
const GRID_RADIUS = 0.06;

/**
 * Dots are dripped between these fractions of the pipe height, never right
 * against the wall — with friction on, a dot at the very edge would crawl, and
 * a student would read that as the sim being stuck.
 */
const DRIP_MIN_FRACTION = 0.15;
const DRIP_MAX_FRACTION = 0.85;

/** Shape of the injected grid: columns across, rows up. */
const GRID_COLUMNS = 4;
const GRID_ROWS = 9;
const GRID_COLUMN_SPACING = 0.2;
const GRID_MIN_FRACTION = 0.1;
const GRID_MAX_FRACTION = 0.9;

/** Seconds the grid injector is unavailable after firing, so the grid stays readable. */
const GRID_INJECTOR_COOLDOWN = 4;

/**
 * Model-x nudge (metres) for a particle spawned at the pipe's left edge, so it
 * starts strictly inside the pipe rather than exactly on the boundary.
 */
const PARTICLE_SPAWN_EPSILON = 1e-6;

/**
 * Base pressure inside the pipe, Pa. Sea-level air pressure — the fluid is
 * arriving from a reservoir open to the atmosphere off the left of the screen.
 */
const PIPE_REFERENCE_PRESSURE = getStandardAirPressure(0);

/**
 * How close to the wall the model declines to report a pressure, metres. Right at
 * the wall the velocity profile is ambiguous, and a barometer resting on the
 * boundary would flicker between a reading and a dash.
 */
const WALL_MARGIN = 0.05;

/**
 * Pressure loss through the initial straight pipe at the slider's default
 * setting, Pa. The value makes the loss measurable while retaining a positive
 * absolute pressure across the supported range; shape dependence comes from
 * Hagen–Poiseuille's r⁻⁴ resistance in Pipe.
 */
const DEFAULT_FRICTION_PRESSURE_DROP = 12000;

export class FlowModel extends FluidPressureAndFlowModel {
  public readonly pipe = new Pipe();
  public readonly fluxMeter: FluxMeter;

  /** Whether the continuous drip of marker dots is running. */
  public readonly areDotsVisibleProperty = new BooleanProperty(true);

  /** Whether the clock is running. */
  public readonly isPlayingProperty = new BooleanProperty(true);

  /**
   * Normal or slow motion.
   *
   * Slow motion matters here more than on most screens: at full speed a tracer
   * crosses a constriction in well under a second, which is not long enough to
   * watch it accelerate. `TimeSpeed` comes from scenery-phet but is a plain
   * enumeration with no view attached, and using it lets TimeControlNode bind
   * straight to this Property.
   */
  public readonly timeSpeedProperty = new EnumerationProperty(TimeSpeed.NORMAL);

  /** Seconds left before the grid injector can fire again; 0 means ready. */
  public readonly gridInjectorCooldownProperty = new NumberProperty(0, { units: "s" });

  /** Tracers currently in the pipe. Not a Property — the view redraws every frame. */
  public readonly particles: Particle[] = [];

  /** Fractional dots owed since the last frame, so the drip rate is dt-independent. */
  private dripAccumulator = 0;

  public constructor(sharedUnits?: SharedUnitSystem) {
    super(sharedUnits);

    this.fluxMeter = new FluxMeter(this.pipe, this.pipe.shapeVersionProperty);

    for (let i = 0; i < NUMBER_OF_BAROMETERS; i++) {
      this.addBarometer(new Barometer(BAROMETER_START));
    }
    for (let i = 0; i < NUMBER_OF_VELOCITY_SENSORS; i++) {
      this.addVelocitySensor(new VelocitySensor(VELOCITY_SENSOR_START));
    }

    // Reshaping the pipe changes every reading without the clock advancing.
    this.pipe.shapeVersionProperty.link(() => this.updateSensorValues());
    this.pipe.flowRateProperty.link(() => this.updateSensorValues());
    this.pipe.isFrictionEnabledProperty.link(() => this.updateSensorValues());
  }

  public override getPressureAt(x: number, y: number): number | null {
    if (!this.pipe.containsPoint(x, y)) {
      return y >= 0 ? this.getAirPressure(y) : null;
    }

    const section = this.pipe.getCrossSectionAt(x);
    if (y - section.bottomY < WALL_MARGIN || section.topY - y < WALL_MARGIN) {
      return null;
    }

    const speed = this.pipe.getTweakedVelocity(x, y).magnitude;
    const density = this.fluidDensityProperty.value;
    const frictionLoss = this.pipe.isFrictionEnabledProperty.value
      ? DEFAULT_FRICTION_PRESSURE_DROP *
        (this.pipe.flowRateProperty.value / DEFAULT_FLOW_RATE) *
        this.pipe.getResistanceFractionAt(x)
      : 0;
    const pressure =
      PIPE_REFERENCE_PRESSURE - density * EARTH_GRAVITY * y - 0.5 * density * speed * speed - frictionLoss;

    // Negative pressure is not a pressure; see the class comment.
    return Math.max(0, pressure);
  }

  public override getVelocityAt(x: number, y: number): Vector2 | null {
    return this.pipe.containsPoint(x, y) ? this.pipe.getTweakedVelocity(x, y) : null;
  }

  /**
   * Releases a rectangular grid of dark tracers at the pipe's mouth.
   *
   * A grid deforms visibly as it travels: it stretches lengthwise where the
   * fluid speeds up and squeezes across where the pipe narrows. A single dot
   * cannot show that, which is why this exists alongside the drip.
   */
  public injectGrid(): void {
    if (this.gridInjectorCooldownProperty.value > 0) {
      return;
    }
    const startX = this.pipe.getMinX() + PARTICLE_SPAWN_EPSILON;
    for (let column = 0; column < GRID_COLUMNS; column++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const fraction = GRID_MIN_FRACTION + ((GRID_MAX_FRACTION - GRID_MIN_FRACTION) * row) / (GRID_ROWS - 1);
        this.particles.push(new Particle(startX + column * GRID_COLUMN_SPACING, fraction, GRID_RADIUS, true));
      }
    }
    this.gridInjectorCooldownProperty.value = GRID_INJECTOR_COOLDOWN;
  }

  public override step(dt: number): void {
    if (!this.isPlayingProperty.value) {
      return;
    }
    const speedFactor = this.timeSpeedProperty.value === TimeSpeed.SLOW ? SLOW_MOTION_FACTOR : 1;
    this.stepOnce(Math.min(dt, MAX_DT) * speedFactor);
  }

  /** Advances one frame at the given (already clamped and scaled) dt. */
  public stepOnce(dt: number): void {
    this.gridInjectorCooldownProperty.value = Math.max(0, this.gridInjectorCooldownProperty.value - dt);

    if (this.areDotsVisibleProperty.value) {
      this.dripAccumulator += dt * DRIP_RATE;
      while (this.dripAccumulator >= 1) {
        this.dripAccumulator -= 1;
        const fraction = dotRandom.nextDoubleBetween(DRIP_MIN_FRACTION, DRIP_MAX_FRACTION);
        this.particles.push(new Particle(this.pipe.getMinX() + PARTICLE_SPAWN_EPSILON, fraction, DRIP_RADIUS, false));
      }
    }

    const maxX = this.pipe.getMaxX();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i] as Particle;
      const y = particle.getY(this.pipe);
      particle.x += this.pipe.getTweakedVx(particle.x, y) * dt;
      if (particle.x >= maxX) {
        this.particles.splice(i, 1);
      }
    }

    this.updateSensorValues();
  }

  public override reset(): void {
    super.reset();
    this.particles.length = 0;
    this.dripAccumulator = 0;
    this.pipe.reset();
    this.fluxMeter.reset();
    this.areDotsVisibleProperty.reset();
    this.isPlayingProperty.reset();
    this.timeSpeedProperty.reset();
    this.gridInjectorCooldownProperty.reset();
  }
}
