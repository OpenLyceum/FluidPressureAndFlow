import { UNITS_CONTROL_PANEL_SETTINGS } from "../../FluidPressureAndFlowConstants.js";
/**
 * UnitsControlPanel.ts
 *
 * Radio buttons choosing the unit system every readout on the screen uses.
 *
 * All three systems change together — pressure, length, speed, density — rather
 * than letting a student mix psi with metres. Mixed units are how unit-conversion
 * mistakes get made, and this sim is not about unit conversion.
 *
 * "Atmospheres" is metric with the pressure read in atm. It exists because one
 * standard atmosphere at the surface is the most concrete anchor most students
 * have for what a barometer is telling them.
 */

import type { EnumerationProperty, TReadOnlyProperty } from "scenerystack/axon";
import { Text, VBox } from "scenerystack/scenery";
import { AquaRadioButtonGroup } from "scenerystack/sun";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { UnitSystem } from "../model/units.js";

/** Font for the group heading. */
const TITLE_FONT = "bold 13px sans-serif";

/** Font for each radio-button label. */
const LABEL_FONT = "13px sans-serif";

export type UnitsControlPanelLabels = {
  readonly unitsStringProperty: TReadOnlyProperty<string>;
  readonly metricStringProperty: TReadOnlyProperty<string>;
  readonly atmospheresStringProperty: TReadOnlyProperty<string>;
  readonly englishStringProperty: TReadOnlyProperty<string>;
};

export class UnitsControlPanel extends VBox {
  public constructor(
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    labels: UnitsControlPanelLabels,
    accessibleName: TReadOnlyProperty<string>,
  ) {
    const radioButtonGroup = new AquaRadioButtonGroup(
      unitSystemProperty,
      [
        { value: UnitSystem.METRIC, createNode: () => createLabel(labels.metricStringProperty) },
        { value: UnitSystem.ATMOSPHERES, createNode: () => createLabel(labels.atmospheresStringProperty) },
        { value: UnitSystem.ENGLISH, createNode: () => createLabel(labels.englishStringProperty) },
      ],
      {
        spacing: UNITS_CONTROL_PANEL_SETTINGS.RADIO_BUTTON_GROUP_SPACING,
        radioButtonOptions: { radius: UNITS_CONTROL_PANEL_SETTINGS.RADIO_BUTTON_GROUP_RADIUS },
        accessibleName: accessibleName,
      },
    );

    super({
      align: "left",
      spacing: UNITS_CONTROL_PANEL_SETTINGS.CONSTRUCTOR_SPACING,
      children: [
        new Text(labels.unitsStringProperty, {
          font: TITLE_FONT,
          fill: FluidPressureAndFlowColors.textColorProperty,
          maxWidth: UNITS_CONTROL_PANEL_SETTINGS.CONSTRUCTOR_MAX_WIDTH,
        }),
        radioButtonGroup,
      ],
    });
  }
}

function createLabel(stringProperty: TReadOnlyProperty<string>): Text {
  return new Text(stringProperty, {
    font: LABEL_FONT,
    fill: FluidPressureAndFlowColors.textColorProperty,
    maxWidth: UNITS_CONTROL_PANEL_SETTINGS.CREATE_LABEL_MAX_WIDTH,
  });
}
