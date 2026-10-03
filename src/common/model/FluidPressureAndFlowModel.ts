/**
 * FluidPressureAndFlowModel.ts
 *
 * The state every screen shares: which fluid, how strong gravity is, which unit
 * system the readouts use, whether the atmosphere is switched on, and the
 * instruments the student has dragged out.
 *
 * Screens differ only in *where* pressure comes from, so that is the single
 * abstract method. Everything else — the air column, keeping sensor readings in
 * step with the model, reset — lives here once. Upstream duplicated all of it
 * three times over (phetsims/fluid-pressure-and-flow#331, #312, #323); this
 * class is the direct answer to that.
 */

import {
  BooleanProperty,
  EnumerationProperty,
  Multilink,
  NumberProperty,
  type TReadOnlyProperty,
  type UnknownMultilink,
} from "scenerystack/axon";
import type { Vector2 } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { EARTH_GRAVITY, WATER_DENSITY } from "../../FluidPressureAndFlowConstants.js";
import { getStandardAirPressure } from "./airPressure.js";
import type { Barometer } from "./Barometer.js";
import { UnitSystem } from "./units.js";
import type { VelocitySensor } from "./VelocitySensor.js";

/**
 * The cross-screen unit system, and the preference governing whether a screen
 * follows it. Supplied by main.ts from the preferences model.
 */
export type SharedUnitSystem = {
  readonly sharedUnitSystemProperty: EnumerationProperty<UnitSystem>;
  readonly linkUnitsProperty: TReadOnlyProperty<boolean>;
};

export abstract class FluidPressureAndFlowModel implements TModel {
  /** Acceleration due to gravity, m/s². Only the Under Pressure screen exposes a control for it. */
  public readonly gravityProperty = new NumberProperty(EARTH_GRAVITY, { units: "m/s^2" });

  /** Density of the working fluid, kg/m³. Every screen exposes a control for it. */
  public readonly fluidDensityProperty = new NumberProperty(WATER_DENSITY, { units: "kg/m^3" });

  /** Which unit system every readout on this screen uses. */
  public readonly unitSystemProperty = new EnumerationProperty(UnitSystem.METRIC);

  /**
   * Whether the air above the ground exerts pressure.
   *
   * Switching it off is not physical, but it is pedagogically load-bearing: the
   * surface reading drops from ~101 kPa to 0, which is what makes it obvious
   * that the offset at the top of the water *is* the atmosphere rather than some
   * property of the water.
   */
  public readonly isAtmosphereProperty = new BooleanProperty(true);

  /** Pressure sensors the student can place. Populated by the subclass. */
  public readonly barometers: Barometer[] = [];

  /** Velocity sensors the student can place. Empty on the Under Pressure screen. */
  public readonly velocitySensors: VelocitySensor[] = [];

  /** Torn down in {@link dispose}; keeps the sensor-refresh links from leaking. */
  private readonly sensorRefreshMultilink: UnknownMultilink;

  /** Removes listeners installed on cross-screen preferences, if supplied. */
  private disposeSharedUnits: (() => void) | null = null;

  /**
   * Guards the two-way sync with the shared unit system, so setting one side
   * from the other does not immediately bounce back.
   */
  private isSyncingUnits = false;

  /**
   * @param sharedUnits - the cross-screen unit system and the preference
   *        governing whether this screen follows it. Omitted in tests, where a
   *        screen model stands alone.
   */
  public constructor(sharedUnits?: SharedUnitSystem) {
    // Any of these can change a reading without the clock advancing — moving a
    // sensor, changing the fluid, flipping the atmosphere off — so refresh on
    // each of them as well as on every step().
    this.sensorRefreshMultilink = Multilink.multilinkAny(
      [this.gravityProperty, this.fluidDensityProperty, this.isAtmosphereProperty],
      () => this.updateSensorValues(),
    );

    if (sharedUnits) {
      this.linkToSharedUnits(sharedUnits);
    }
  }

  /**
   * Mirrors this screen's unit system to and from the shared one while the
   * "match units across screens" preference is on.
   *
   * Two-way rather than one-way: the student changes units from a screen's own
   * radio buttons, so the screen has to be able to push as well as follow. The
   * guard flag is what keeps the two links from ping-ponging.
   */
  private linkToSharedUnits(sharedUnits: SharedUnitSystem): void {
    const { sharedUnitSystemProperty, linkUnitsProperty } = sharedUnits;

    if (linkUnitsProperty.value) {
      this.unitSystemProperty.value = sharedUnitSystemProperty.value;
    }

    const updateSharedUnits = (system: UnitSystem) => {
      if (this.isSyncingUnits || !linkUnitsProperty.value) {
        return;
      }
      this.isSyncingUnits = true;
      sharedUnitSystemProperty.value = system;
      this.isSyncingUnits = false;
    };
    this.unitSystemProperty.link(updateSharedUnits);

    const updateScreenUnits = (system: UnitSystem) => {
      if (this.isSyncingUnits || !linkUnitsProperty.value) {
        return;
      }
      this.isSyncingUnits = true;
      this.unitSystemProperty.value = system;
      this.isSyncingUnits = false;
    };
    sharedUnitSystemProperty.link(updateScreenUnits);

    // Turning the preference back on pulls this screen into step immediately,
    // rather than leaving it out of sync until the next change.
    const updateLinkedPreference = (isLinked: boolean) => {
      if (isLinked) {
        this.unitSystemProperty.value = sharedUnitSystemProperty.value;
      }
    };
    linkUnitsProperty.link(updateLinkedPreference);

    this.disposeSharedUnits = () => {
      this.unitSystemProperty.unlink(updateSharedUnits);
      sharedUnitSystemProperty.unlink(updateScreenUnits);
      linkUnitsProperty.unlink(updateLinkedPreference);
    };
  }

  /**
   * Pressure at a point in model coordinates, or `null` where pressure is not
   * defined (inside the ground, outside the pipe).
   *
   * @param x - metres, +x to the right
   * @param y - metres, +y up, 0 at ground level
   */
  public abstract getPressureAt(x: number, y: number): number | null;

  /**
   * Fluid velocity at a point, or `null` where nothing is flowing.
   * Screens without moving fluid inherit this and never override it.
   */
  public getVelocityAt(_x: number, _y: number): Vector2 | null {
    return null;
  }

  /**
   * Air pressure at the given altitude, honouring the atmosphere toggle.
   *
   * The result scales with gravity, since the weight of the air column above you
   * is what you are measuring. Upstream does the same; see doc/model.md for why
   * this is a coarser approximation than it looks.
   *
   * @param altitude - metres above ground level
   */
  public getAirPressure(altitude: number): number {
    return this.isAtmosphereProperty.value
      ? getStandardAirPressure(altitude) * (this.gravityProperty.value / EARTH_GRAVITY)
      : 0;
  }

  /**
   * Re-samples every active sensor at its current position.
   *
   * Call after anything that could change a reading. Inactive sensors — still in
   * the toolbox — are skipped, both to save work and so a stowed instrument does
   * not announce a changing value to a screen reader.
   */
  public updateSensorValues(): void {
    for (const barometer of this.barometers) {
      if (barometer.isActiveProperty.value) {
        const position = barometer.positionProperty.value;
        barometer.valueProperty.value = this.getPressureAt(position.x, position.y);
      }
    }
    for (const sensor of this.velocitySensors) {
      if (sensor.isActiveProperty.value) {
        const position = sensor.positionProperty.value;
        sensor.valueProperty.value = this.getVelocityAt(position.x, position.y);
      }
    }
  }

  /**
   * Registers a barometer and wires it to refresh when it is moved or stowed.
   * Subclasses call this instead of pushing onto {@link barometers} directly.
   */
  protected addBarometer(barometer: Barometer): void {
    this.barometers.push(barometer);
    barometer.positionProperty.link(() => this.updateSensorValues());
    barometer.isActiveProperty.link(() => this.updateSensorValues());
  }

  /** Registers a velocity sensor. See {@link addBarometer}. */
  protected addVelocitySensor(sensor: VelocitySensor): void {
    this.velocitySensors.push(sensor);
    sensor.positionProperty.link(() => this.updateSensorValues());
    sensor.isActiveProperty.link(() => this.updateSensorValues());
  }

  public reset(): void {
    this.gravityProperty.reset();
    this.fluidDensityProperty.reset();
    this.unitSystemProperty.reset();
    this.isAtmosphereProperty.reset();
    for (const barometer of this.barometers) {
      barometer.reset();
    }
    for (const sensor of this.velocitySensors) {
      sensor.reset();
    }
  }

  public abstract step(dt: number): void;

  public dispose(): void {
    this.disposeSharedUnits?.();
    this.sensorRefreshMultilink.dispose();
  }
}
