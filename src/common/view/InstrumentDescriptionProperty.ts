import {
  DerivedProperty,
  DynamicProperty,
  type EnumerationProperty,
  PatternStringProperty,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import type { Vector2 } from "scenerystack/dot";
import { StringManager } from "../../i18n/StringManager.js";
import { formatValue, type UnitSystem } from "../model/units.js";

/** Live measurements and SI probe coordinates, converted to the selected display units. */
export class InstrumentDescriptionProperty extends PatternStringProperty<
  Record<"reading" | "x" | "y" | "units", TReadOnlyProperty<string>>
> {
  private readonly disposeDescription: () => void;

  public constructor(
    readingProperty: TReadOnlyProperty<string>,
    positionProperty: TReadOnlyProperty<Vector2>,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    isMeter = false,
  ) {
    const strings = StringManager.getInstance();
    const a11y = strings.getCommonA11yStrings();
    const unitLabels = strings.getUnitLabelGroups();
    const common = strings.getCommonStrings();
    const reading = new DerivedProperty(
      [readingProperty, common.unknownValueStringProperty, a11y.noReadingStringProperty],
      (value, unknown, noReading) => (value === unknown ? noReading : value),
    );
    const x = new DerivedProperty([positionProperty, unitSystemProperty], (position, system) =>
      formatValue(system.distance, position.x),
    );
    const y = new DerivedProperty([positionProperty, unitSystemProperty], (position, system) =>
      formatValue(system.distance, position.y),
    );
    const unitsSource = new DerivedProperty(
      [unitSystemProperty],
      (system) => system.labels(unitLabels).distanceStringProperty,
    );
    const units = new DynamicProperty<string, string, TReadOnlyProperty<string>>(unitsSource);
    super(isMeter ? a11y.meterDescriptionPatternStringProperty : a11y.instrumentDescriptionPatternStringProperty, {
      reading,
      x,
      y,
      units,
    });
    this.disposeDescription = () => {
      reading.dispose();
      x.dispose();
      y.dispose();
      units.dispose();
      unitsSource.dispose();
    };
  }

  public override dispose(): void {
    super.dispose();
    this.disposeDescription();
  }
}
