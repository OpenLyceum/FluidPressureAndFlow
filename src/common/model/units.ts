/**
 * units.ts
 *
 * The three unit systems a student can switch between, and the conversions from
 * the model's SI values into each of them.
 *
 * The model is SI throughout — pascals, metres, m/s, kg/m³, m³/s. Nothing in
 * model/ ever converts; conversion happens once, at the moment a value is put on
 * screen. That keeps the physics free of unit bookkeeping and means a readout
 * change can never perturb a calculation.
 *
 * Each system supplies one {@link UnitConversion} per physical quantity. The
 * localized abbreviations are *not* here — a view passes in the string group and
 * {@link UnitSystem.labels} picks the matching set, so this module stays free of
 * the i18n system and remains directly unit-testable.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

/**
 * A linear conversion from an SI value to a display value.
 *
 * @property factor - multiply the SI value by this to get the display value
 * @property decimalPlaces - digits after the decimal point in the readout
 */
export type UnitConversion = {
  readonly factor: number;
  readonly decimalPlaces: number;
};

/** Converts an SI value into its display value under the given conversion. */
export function toDisplayValue(conversion: UnitConversion, siValue: number): number {
  return siValue * conversion.factor;
}

/** Converts a display value back into SI. The inverse of {@link toDisplayValue}. */
export function toSIValue(conversion: UnitConversion, displayValue: number): number {
  return displayValue / conversion.factor;
}

/** Formats an SI value as a display string with the conversion's precision. */
export function formatValue(conversion: UnitConversion, siValue: number): string {
  return toFixed(toDisplayValue(conversion, siValue), conversion.decimalPlaces);
}

// ── Conversion factors ────────────────────────────────────────────────────────
// Sourced from the PhET Java sim's Units.java and the HTML5 port's Units.js.

/** Feet per metre. Also serves for ft/s per m/s. */
export const FEET_PER_METER = 3.2808399;

/** Atmospheres per pascal. */
const ATM_PER_PASCAL = 9.8692e-6;

/** Pounds per square inch, per pascal. */
const PSI_PER_PASCAL = 145.04e-6;

/** Pounds per cubic foot, per kg/m³. */
const LB_PER_FT3_PER_KG_PER_M3 = 62.4 / 1000;

/** ft/s² per m/s². Standard gravity is 32.16 ft/s² and 9.80665 m/s². */
const FT_PER_S2_PER_M_PER_S2 = 32.16 / 9.80665;

/** Square feet per square metre. */
const FT2_PER_M2 = FEET_PER_METER * FEET_PER_METER;

/** Cubic feet per cubic metre. */
const FT3_PER_M3 = FEET_PER_METER * FEET_PER_METER * FEET_PER_METER;

/** Litres per cubic metre. */
const LITERS_PER_M3 = 1000;

// ── Per-quantity conversions ──────────────────────────────────────────────────

const KILOPASCALS: UnitConversion = { factor: 1 / 1000, decimalPlaces: 3 };
const ATMOSPHERES_PRESSURE: UnitConversion = { factor: ATM_PER_PASCAL, decimalPlaces: 4 };
const PSI: UnitConversion = { factor: PSI_PER_PASCAL, decimalPlaces: 2 };

const METERS: UnitConversion = { factor: 1, decimalPlaces: 1 };
const FEET: UnitConversion = { factor: FEET_PER_METER, decimalPlaces: 1 };

const METERS_PER_SECOND: UnitConversion = { factor: 1, decimalPlaces: 1 };
const FEET_PER_SECOND: UnitConversion = { factor: FEET_PER_METER, decimalPlaces: 1 };

const KG_PER_M3: UnitConversion = { factor: 1, decimalPlaces: 0 };
const LB_PER_FT3: UnitConversion = { factor: LB_PER_FT3_PER_KG_PER_M3, decimalPlaces: 0 };

const M_PER_S2: UnitConversion = { factor: 1, decimalPlaces: 1 };
const FT_PER_S2: UnitConversion = { factor: FT_PER_S2_PER_M_PER_S2, decimalPlaces: 1 };

const LITERS_PER_SECOND: UnitConversion = { factor: LITERS_PER_M3, decimalPlaces: 0 };
const FT3_PER_SECOND: UnitConversion = { factor: FT3_PER_M3, decimalPlaces: 0 };

// Flux is volumetric flow per unit area, so dimensionally a velocity (m³ m⁻² s⁻¹
// = m/s). Metric readouts state it as L/(m²·s), hence the litre factor.
const LITERS_PER_M2_PER_SECOND: UnitConversion = { factor: LITERS_PER_M3, decimalPlaces: 2 };
const FT3_PER_FT2_PER_SECOND: UnitConversion = { factor: FEET_PER_METER, decimalPlaces: 2 };

const SQUARE_METERS: UnitConversion = { factor: 1, decimalPlaces: 2 };
const SQUARE_FEET: UnitConversion = { factor: FT2_PER_M2, decimalPlaces: 2 };
const CUBIC_METERS: UnitConversion = { factor: 1, decimalPlaces: 0 };
const CUBIC_FEET: UnitConversion = { factor: FT3_PER_M3, decimalPlaces: 0 };

/**
 * The localized unit abbreviations, one per quantity. Any object exposing these
 * StringProperties satisfies this — in practice one of the three unit groups in
 * the `units` string group from {@link StringManager}.
 */
export type UnitLabelProperties = {
  readonly pressureStringProperty: TReadOnlyProperty<string>;
  readonly distanceStringProperty: TReadOnlyProperty<string>;
  readonly velocityStringProperty: TReadOnlyProperty<string>;
  readonly densityStringProperty: TReadOnlyProperty<string>;
  readonly gravityStringProperty: TReadOnlyProperty<string>;
  readonly flowRateStringProperty: TReadOnlyProperty<string>;
  readonly fluxStringProperty: TReadOnlyProperty<string>;
  readonly areaStringProperty: TReadOnlyProperty<string>;
  readonly volumeStringProperty: TReadOnlyProperty<string>;
};

/** The three unit-label groups a view must supply to {@link UnitSystem.labels}. */
export type UnitLabelGroups = {
  readonly metric: UnitLabelProperties;
  readonly atmospheres: UnitLabelProperties;
  readonly english: UnitLabelProperties;
};

export class UnitSystem extends EnumerationValue {
  /** SI-flavoured readouts: kPa, m, m/s, kg/m³. The default. */
  public static readonly METRIC = new UnitSystem(
    KILOPASCALS,
    METERS,
    METERS_PER_SECOND,
    KG_PER_M3,
    M_PER_S2,
    LITERS_PER_SECOND,
    LITERS_PER_M2_PER_SECOND,
    SQUARE_METERS,
    CUBIC_METERS,
  );

  /**
   * Metric everywhere except pressure, which reads in atmospheres. Offered
   * because "one atmosphere at the surface" is the most concrete anchor a
   * student has for what the barometer is showing.
   */
  public static readonly ATMOSPHERES = new UnitSystem(
    ATMOSPHERES_PRESSURE,
    METERS,
    METERS_PER_SECOND,
    KG_PER_M3,
    M_PER_S2,
    LITERS_PER_SECOND,
    LITERS_PER_M2_PER_SECOND,
    SQUARE_METERS,
    CUBIC_METERS,
  );

  /** Imperial readouts: psi, ft, ft/s, lb/ft³. */
  public static readonly ENGLISH = new UnitSystem(
    PSI,
    FEET,
    FEET_PER_SECOND,
    LB_PER_FT3,
    FT_PER_S2,
    FT3_PER_SECOND,
    FT3_PER_FT2_PER_SECOND,
    SQUARE_FEET,
    CUBIC_FEET,
  );

  public static readonly enumeration = new Enumeration(UnitSystem);

  public readonly pressure: UnitConversion;
  public readonly distance: UnitConversion;
  public readonly velocity: UnitConversion;
  public readonly density: UnitConversion;
  public readonly gravity: UnitConversion;
  public readonly flowRate: UnitConversion;
  public readonly flux: UnitConversion;
  public readonly area: UnitConversion;
  public readonly volume: UnitConversion;

  public constructor(
    pressure: UnitConversion,
    distance: UnitConversion,
    velocity: UnitConversion,
    density: UnitConversion,
    gravity: UnitConversion,
    flowRate: UnitConversion,
    flux: UnitConversion,
    area: UnitConversion,
    volume: UnitConversion,
  ) {
    super();
    this.pressure = pressure;
    this.distance = distance;
    this.velocity = velocity;
    this.density = density;
    this.gravity = gravity;
    this.flowRate = flowRate;
    this.flux = flux;
    this.area = area;
    this.volume = volume;
  }

  /**
   * The localized abbreviations for this system.
   *
   * @param groups - the `units` string group from StringManager
   */
  public labels(groups: UnitLabelGroups): UnitLabelProperties {
    return this === UnitSystem.METRIC
      ? groups.metric
      : this === UnitSystem.ATMOSPHERES
        ? groups.atmospheres
        : groups.english;
  }
}
