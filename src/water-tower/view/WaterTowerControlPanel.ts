import { WATER_TOWER_CONTROL_PANEL_SETTINGS } from "../../FluidPressureAndFlowConstants.js";
/**
 * WaterTowerControlPanel.ts
 *
 * The Water Tower screen's right-hand controls: the hose toggle, the two measuring
 * tools, and the unit-system chooser.
 *
 * Each tool checkbox carries a pictorial icon on the right, matching PhET's
 * Water Tower control panel layout.
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
import {
  createHoseIcon,
  createLabeledToolRow,
  createMeasuringTapeIcon,
  createRulerIcon,
} from "./createWaterTowerToolIcons.js";

const LABEL_FONT = "13px sans-serif";

/** Width the panel's contents are held to, so the layout does not jump. */
const CONTENT_WIDTH: number = WATER_TOWER_CONTROL_PANEL_SETTINGS.CONTENT_WIDTH;

export type WaterTowerControlPanelLabels = UnitsControlPanelLabels & {
  readonly rulerStringProperty: TReadOnlyProperty<string>;
  readonly measuringTapeStringProperty: TReadOnlyProperty<string>;
  readonly hoseStringProperty: TReadOnlyProperty<string>;
};

export type WaterTowerControlPanelAccessibleNames = {
  readonly rulerCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly measuringTapeCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly hoseCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly unitsControlStringProperty: TReadOnlyProperty<string>;
};

export class WaterTowerControlPanel extends VBox {
  public constructor(
    isRulerVisibleProperty: BooleanProperty,
    isMeasuringTapeVisibleProperty: BooleanProperty,
    isHoseEnabledProperty: BooleanProperty,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    labels: WaterTowerControlPanelLabels,
    accessibleNames: WaterTowerControlPanelAccessibleNames,
  ) {
    const label = (stringProperty: TReadOnlyProperty<string>) =>
      new Text(stringProperty, {
        font: LABEL_FONT,
        fill: FluidPressureAndFlowColors.textColorProperty,
        maxWidth: CONTENT_WIDTH - WATER_TOWER_CONTROL_PANEL_SETTINGS.LABEL_MAX_WIDTH_OFFSET,
      });

    const rulerIcon = createRulerIcon();
    const measuringTapeIcon = createMeasuringTapeIcon();
    const hoseIcon = createHoseIcon();
    const rowWidth =
      Math.max(
        label(labels.rulerStringProperty).width + rulerIcon.width,
        label(labels.measuringTapeStringProperty).width + measuringTapeIcon.width,
        label(labels.hoseStringProperty).width + hoseIcon.width,
      ) + 5;

    const checkbox = (
      property: BooleanProperty,
      labelProperty: TReadOnlyProperty<string>,
      icon: ReturnType<typeof createRulerIcon>,
      accessibleName: TReadOnlyProperty<string>,
    ) =>
      new Checkbox(property, createLabeledToolRow(label(labelProperty), icon, rowWidth), {
        ...CHECKBOX_OPTIONS,
        accessibleName: accessibleName,
      });

    const toggles = new FluidPressureAndFlowPanel(
      new VBox({
        align: "left",
        spacing: WATER_TOWER_CONTROL_PANEL_SETTINGS.TOGGLES_SPACING,
        children: [
          checkbox(
            isRulerVisibleProperty,
            labels.rulerStringProperty,
            rulerIcon,
            accessibleNames.rulerCheckboxStringProperty,
          ),
          checkbox(
            isMeasuringTapeVisibleProperty,
            labels.measuringTapeStringProperty,
            measuringTapeIcon,
            accessibleNames.measuringTapeCheckboxStringProperty,
          ),
          checkbox(
            isHoseEnabledProperty,
            labels.hoseStringProperty,
            hoseIcon,
            accessibleNames.hoseCheckboxStringProperty,
          ),
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
