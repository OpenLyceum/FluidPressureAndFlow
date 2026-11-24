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
    const formattedReadingProperty = new DerivedProperty(
      [readingProperty, common.unknownValueStringProperty, a11y.noReadingStringProperty],
      (value, unknown, noReading) => (value === unknown ? noReading : value),
    );
    const xProperty = new DerivedProperty([positionProperty, unitSystemProperty], (position, system) =>
      formatValue(system.distance, position.x),
    );
    const yProperty = new DerivedProperty([positionProperty, unitSystemProperty], (position, system) =>
      formatValue(system.distance, position.y),
    );
    const unitsSourceProperty = new DerivedProperty(
      [unitSystemProperty],
      (system) => system.labels(unitLabels).distanceStringProperty,
    );
    const unitsProperty = new DynamicProperty<string, string, TReadOnlyProperty<string>>(unitsSourceProperty);
    super(isMeter ? a11y.meterDescriptionPatternStringProperty : a11y.instrumentDescriptionPatternStringProperty, {
      reading: formattedReadingProperty,
      x: xProperty,
      y: yProperty,
      units: unitsProperty,
    });
    this.disposeDescription = () => {
      formattedReadingProperty.dispose();
      xProperty.dispose();
      yProperty.dispose();
      unitsProperty.dispose();
      unitsSourceProperty.dispose();
    };
  }

  public override dispose(): void {
    super.dispose();
    this.disposeDescription();
  }
}
