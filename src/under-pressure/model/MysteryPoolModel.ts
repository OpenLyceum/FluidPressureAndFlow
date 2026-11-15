/**
 * MysteryPoolModel.ts
 *
 * The square pool with one number taken away.
 *
 * The student picks either an unlabelled fluid or an unnamed planet; the
 * corresponding slider disappears, and the only way to recover the hidden value
 * is to read a barometer at a known depth and invert `p = p₀ + ρgh`. It turns
 * the screen's identity from something to be confirmed into something to be
 * used.
 *
 * Only one quantity is ever hidden at a time. Hiding both would leave two
 * unknowns and one equation, which is a different and much less tractable
 * problem than the one intended.
 */

import { EnumerationProperty, NumberProperty } from "scenerystack/axon";
import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import { SquarePoolModel } from "./SquarePoolModel.js";

/** Which quantity the student is being asked to work out. */
export class MysteryQuantity extends EnumerationValue {
  /** Gravity is known (Earth); the fluid is unlabelled. */
  public static readonly FLUID_DENSITY = new MysteryQuantity();

  /** The fluid is water; the planet is unnamed. */
  public static readonly GRAVITY = new MysteryQuantity();

  public static readonly enumeration = new Enumeration(MysteryQuantity);
}

/**
 * The three unlabelled fluids, kg/m³.
 *
 * Chosen to sit away from the named fluids on the density slider, so a student
 * cannot match one by eye against gasoline, water or honey — and none is a round
 * number, so a lucky guess is unlikely to look right.
 */
const MYSTERY_FLUID_DENSITIES = [1700, 840, 1100] as const;

/** The three unnamed planets, m/s². Also deliberately off the slider's labels. */
const MYSTERY_GRAVITIES = [20, 14, 6.5] as const;

export class MysteryPoolModel extends SquarePoolModel {
  /** Which quantity is currently hidden. */
  public readonly mysteryQuantityProperty = new EnumerationProperty(MysteryQuantity.FLUID_DENSITY);

  /** Index into {@link MYSTERY_FLUID_DENSITIES}: which unlabelled fluid is in the pool. */
  public readonly fluidChoiceProperty = new NumberProperty(0);

  /** Index into {@link MYSTERY_GRAVITIES}: which unnamed planet the pool is on. */
  public readonly planetChoiceProperty = new NumberProperty(0);

  /** Density of the currently selected mystery fluid, kg/m³. */
  public getMysteryFluidDensity(): number {
    return MYSTERY_FLUID_DENSITIES[this.fluidChoiceProperty.value] ?? MYSTERY_FLUID_DENSITIES[0];
  }

  /** Surface gravity of the currently selected mystery planet, m/s². */
  public getMysteryGravity(): number {
    return MYSTERY_GRAVITIES[this.planetChoiceProperty.value] ?? MYSTERY_GRAVITIES[0];
  }

  public override reset(): void {
    super.reset();
    this.mysteryQuantityProperty.reset();
    this.fluidChoiceProperty.reset();
    this.planetChoiceProperty.reset();
  }
}
