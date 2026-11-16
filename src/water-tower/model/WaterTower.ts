import { WATER_TOWER_SETTINGS } from "../../FluidPressureAndFlowConstants.js";
/**
 * WaterTower.ts
 *
 * The tank itself: a cylinder on legs, with a hole near its base that the
 * student can uncover.
 *
 * The tank's height above ground is adjustable, and that is the screen's central
 * control. Torricelli's law says the efflux speed depends on the head of water
 * above the hole and on nothing else — not on how much water there is, not on
 * what the fluid is. Being able to raise the whole tank without changing the
 * water in it is what makes "not the height above the ground, the height above
 * the hole" testable.
 */

import { BooleanProperty, DerivedProperty, NumberProperty, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";

/**
 * Radius of the tank, metres.
 * @internal Exported for unit tests; not part of the application API.
 */
export const TANK_RADIUS: number = WATER_TOWER_SETTINGS.TANK_RADIUS;

/** Height of the tank, metres. */
export const TANK_HEIGHT: number = WATER_TOWER_SETTINGS.TANK_HEIGHT;

/**
 * Highest the tank's base may be dragged, metres.
 *
 * Capped so the tank's lid still clears the faucet above it; a tank that could be
 * raised past its own supply would be filling from nowhere.
 */
export const MAX_TANK_BASE_Y: number = WATER_TOWER_SETTINGS.MAX_TANK_BASE_Y;

/** Lowest the tank's base may be dragged, metres. Keeps the legs on the ground. */
export const MIN_TANK_BASE_Y: number = WATER_TOWER_SETTINGS.MIN_TANK_BASE_Y;

/** Where the tank's base starts, metres. Not at the top, so it can be raised as well as lowered. */
const INITIAL_TANK_BASE_Y: number = WATER_TOWER_SETTINGS.INITIAL_TANK_BASE_Y;

/** Diameter of the hole in the tank's side, metres. */
export const HOLE_SIZE = 1;

/**
 * Full capacity of the tank, m³.
 * @internal Exported for unit tests; not part of the application API.
 */
export const TANK_VOLUME = Math.PI * TANK_RADIUS * TANK_RADIUS * TANK_HEIGHT;

/** Smallest and largest tank radii the capacity slider can produce, metres. */
const MIN_TANK_RADIUS: number = WATER_TOWER_SETTINGS.MIN_TANK_RADIUS;
const MAX_TANK_RADIUS: number = WATER_TOWER_SETTINGS.MAX_TANK_RADIUS;

/** Smallest and largest capacities available to the student, m³. */
export const MIN_TANK_VOLUME = Math.PI * MIN_TANK_RADIUS * MIN_TANK_RADIUS * TANK_HEIGHT;
export const MAX_TANK_VOLUME = Math.PI * MAX_TANK_RADIUS * MAX_TANK_RADIUS * TANK_HEIGHT;

/**
 * How full the tank starts, as a fraction of capacity.
 *
 * Not completely full, so the fill button and the faucet are both live from the
 * first frame — a control that starts disabled is one a student may never
 * discover.
 */
const INITIAL_FILL_FRACTION: number = WATER_TOWER_SETTINGS.INITIAL_FILL_FRACTION;

/** Volume slack (m³) below capacity that still counts as "full", to absorb float error. */
const FULL_VOLUME_TOLERANCE: number = WATER_TOWER_SETTINGS.FULL_VOLUME_TOLERANCE;

export class WaterTower {
  /** Centre of the tank's base, model coordinates (metres). */
  public readonly baseCenterProperty = new Property(new Vector2(0, INITIAL_TANK_BASE_Y));

  /** Volume of fluid in the tank, m³. */
  public readonly fluidVolumeProperty = new NumberProperty(TANK_VOLUME * INITIAL_FILL_FRACTION);

  /**
   * Tank capacity, m³. Changing it alters the tank radius while preserving the
   * water level, isolating volume from head as requested in upstream issue #336.
   */
  public readonly capacityProperty = new NumberProperty(TANK_VOLUME);

  /** Whether the hole in the side is uncovered. Closed at first, so nothing happens until asked. */
  public readonly isHoleOpenProperty = new BooleanProperty(false);

  /** True when the tank cannot take any more. */
  public readonly isFullProperty: TReadOnlyProperty<boolean>;

  public constructor() {
    let previousCapacity = this.capacityProperty.value;
    this.capacityProperty.link((capacity) => {
      const previousArea = previousCapacity / TANK_HEIGHT;
      const currentLevel = this.fluidVolumeProperty.value / previousArea;
      this.fluidVolumeProperty.value = Math.min(capacity, currentLevel * (capacity / TANK_HEIGHT));
      previousCapacity = capacity;
    });
    this.isFullProperty = new DerivedProperty(
      [this.fluidVolumeProperty, this.capacityProperty],
      (volume, capacity) => volume >= capacity - FULL_VOLUME_TOLERANCE,
    );
  }

  /** Radius implied by the current capacity, metres. */
  public getRadius(): number {
    return Math.sqrt(this.capacityProperty.value / (Math.PI * TANK_HEIGHT));
  }

  /** Depth of fluid standing in the tank, metres. */
  public getFluidLevel(): number {
    return this.fluidVolumeProperty.value / (Math.PI * this.getRadius() * this.getRadius());
  }

  /** Altitude of the fluid's surface, metres. */
  public getFluidSurfaceY(): number {
    return this.baseCenterProperty.value.y + this.getFluidLevel();
  }

  /** Where fluid leaves the tank: the hole in the right-hand wall, at the base. */
  public getHolePosition(): Vector2 {
    const base = this.baseCenterProperty.value;
    return new Vector2(base.x + this.getRadius(), base.y + HOLE_SIZE / 2);
  }

  /** Fills the tank to capacity. Wired to the Fill button. */
  public fill(): void {
    this.fluidVolumeProperty.value = this.capacityProperty.value;
  }

  public reset(): void {
    this.baseCenterProperty.reset();
    this.capacityProperty.reset();
    this.fluidVolumeProperty.reset();
    this.isHoleOpenProperty.reset();
  }
}
