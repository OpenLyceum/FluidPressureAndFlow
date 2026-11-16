import { FLOW_CONTROL_PANEL_SETTINGS } from "../../FluidPressureAndFlowConstants.js";
/**
 * FlowControlPanel.ts
 *
 * The Flow screen's right-hand controls: the ruler, friction, flux meter and
 * marker dots, and the unit-system chooser.
 *
 * Friction sits with the display toggles so the optional viscosity model is easy
 * to compare with the ideal-flow case. Unlike the original implementation, it
 * changes both pressure and flux; see doc/model.md.
 *
 * The unit system gets its own box, as on the other two screens: it is set once
 * and left alone, and separating it keeps the toggles above it at a constant
 * height however tall the unit list grows in translation.
 */

import type { BooleanProperty, EnumerationProperty, TReadOnlyProperty } from "scenerystack/axon";
import { Text, VBox } from "scenerystack/scenery";
import { Checkbox } from "scenerystack/sun";
import { CHECKBOX_OPTIONS } from "../../common/FluidPressureAndFlowControlOptions.js";
import { FluidPressureAndFlowPanel } from "../../common/FluidPressureAndFlowPanel.js";
import type { UnitSystem } from "../../common/model/units.js";
import { UnitsControlPanel, type UnitsControlPanelLabels } from "../../common/view/UnitsControlPanel.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { PANEL_SPACING } from "../../FluidPressureAndFlowConstants.js";

const LABEL_FONT = "13px sans-serif";

/** Width the panel's contents are held to, so the layout does not jump. */
const CONTENT_WIDTH: number = FLOW_CONTROL_PANEL_SETTINGS.CONTENT_WIDTH;

export type FlowControlPanelLabels = UnitsControlPanelLabels & {
  readonly rulerStringProperty: TReadOnlyProperty<string>;
  readonly frictionStringProperty: TReadOnlyProperty<string>;
  readonly fluxMeterStringProperty: TReadOnlyProperty<string>;
  readonly dotsStringProperty: TReadOnlyProperty<string>;
};

export type FlowControlPanelAccessibleNames = {
  readonly rulerCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly frictionCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly fluxMeterCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly dotsCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly unitsControlStringProperty: TReadOnlyProperty<string>;
};

export class FlowControlPanel extends VBox {
  public constructor(
    isRulerVisibleProperty: BooleanProperty,
    isFrictionEnabledProperty: BooleanProperty,
    isFluxMeterVisibleProperty: BooleanProperty,
    areDotsVisibleProperty: BooleanProperty,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    labels: FlowControlPanelLabels,
    accessibleNames: FlowControlPanelAccessibleNames,
  ) {
    const checkbox = (
      property: BooleanProperty,
      labelProperty: TReadOnlyProperty<string>,
      accessibleName: TReadOnlyProperty<string>,
    ) =>
      new Checkbox(
        property,
        new Text(labelProperty, {
          font: LABEL_FONT,
          fill: FluidPressureAndFlowColors.textColorProperty,
          maxWidth: CONTENT_WIDTH - FLOW_CONTROL_PANEL_SETTINGS.CHECKBOX_MAX_WIDTH_OFFSET,
        }),
        { ...CHECKBOX_OPTIONS, accessibleName: accessibleName },
      );

    const toggles = new FluidPressureAndFlowPanel(
      new VBox({
        align: "left",
        spacing: FLOW_CONTROL_PANEL_SETTINGS.TOGGLES_SPACING,
        children: [
          checkbox(isRulerVisibleProperty, labels.rulerStringProperty, accessibleNames.rulerCheckboxStringProperty),
          checkbox(
            isFrictionEnabledProperty,
            labels.frictionStringProperty,
            accessibleNames.frictionCheckboxStringProperty,
          ),
          checkbox(
            isFluxMeterVisibleProperty,
            labels.fluxMeterStringProperty,
            accessibleNames.fluxMeterCheckboxStringProperty,
          ),
          checkbox(areDotsVisibleProperty, labels.dotsStringProperty, accessibleNames.dotsCheckboxStringProperty),
        ],
      }),
      { minWidth: CONTENT_WIDTH },
    );

    const units = new FluidPressureAndFlowPanel(
      new UnitsControlPanel(unitSystemProperty, labels, accessibleNames.unitsControlStringProperty),
      { minWidth: CONTENT_WIDTH },
    );

    super({ align: "right", spacing: PANEL_SPACING, children: [toggles, units] });
  }
}
