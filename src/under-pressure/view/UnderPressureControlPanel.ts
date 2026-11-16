import { UNDER_PRESSURE_CONTROL_PANEL_SETTINGS } from "../../FluidPressureAndFlowConstants.js";
/**
 * UnderPressureControlPanel.ts
 *
 * The controls down the right-hand side: the ruler and grid toggles, the atmosphere
 * switch, and the unit-system chooser.
 *
 * Two boxes rather than one. The first three are things a student touches while
 * working a question — show a ruler, turn the air off, see what changes. The unit
 * system is set once and left alone. Separating them means the frequently-used
 * controls sit at a constant height no matter how tall the unit list gets in
 * translation.
 *
 * The atmosphere switch sits here rather than in Preferences because it is a
 * physics control, not a setting. Turning the air off drops every above-water
 * reading to zero and takes the ~101 kPa offset off the top of the water — which
 * is the most direct way the sim can say "that offset *is* the atmosphere."
 */

import type { BooleanProperty, EnumerationProperty, TReadOnlyProperty } from "scenerystack/axon";
import { HSeparator, Text, VBox } from "scenerystack/scenery";
import { AquaRadioButtonGroup, Checkbox } from "scenerystack/sun";
import { CHECKBOX_OPTIONS } from "../../common/FluidPressureAndFlowControlOptions.js";
import { FluidPressureAndFlowPanel } from "../../common/FluidPressureAndFlowPanel.js";
import type { UnitSystem } from "../../common/model/units.js";
import { UnitsControlPanel, type UnitsControlPanelLabels } from "../../common/view/UnitsControlPanel.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { PANEL_SPACING } from "../../FluidPressureAndFlowConstants.js";

const TITLE_FONT = "bold 13px sans-serif";
const LABEL_FONT = "13px sans-serif";

/** Width the panel's contents are held to, so the layout does not jump. */
const CONTENT_WIDTH: number = UNDER_PRESSURE_CONTROL_PANEL_SETTINGS.CONTENT_WIDTH;

export type UnderPressureControlPanelLabels = UnitsControlPanelLabels & {
  readonly rulerStringProperty: TReadOnlyProperty<string>;
  readonly gridStringProperty: TReadOnlyProperty<string>;
  readonly atmosphereStringProperty: TReadOnlyProperty<string>;
  readonly onStringProperty: TReadOnlyProperty<string>;
  readonly offStringProperty: TReadOnlyProperty<string>;
};

export type UnderPressureControlPanelAccessibleNames = {
  readonly rulerCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly gridCheckboxStringProperty: TReadOnlyProperty<string>;
  readonly atmosphereControlStringProperty: TReadOnlyProperty<string>;
  readonly unitsControlStringProperty: TReadOnlyProperty<string>;
};

export class UnderPressureControlPanel extends VBox {
  public constructor(
    isRulerVisibleProperty: BooleanProperty,
    isGridVisibleProperty: BooleanProperty,
    isAtmosphereProperty: BooleanProperty,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    labels: UnderPressureControlPanelLabels,
    accessibleNames: UnderPressureControlPanelAccessibleNames,
  ) {
    const rulerCheckbox = new Checkbox(
      isRulerVisibleProperty,
      new Text(labels.rulerStringProperty, {
        font: LABEL_FONT,
        fill: FluidPressureAndFlowColors.textColorProperty,
        maxWidth: CONTENT_WIDTH - UNDER_PRESSURE_CONTROL_PANEL_SETTINGS.RULER_CHECKBOX_MAX_WIDTH_OFFSET,
      }),
      { ...CHECKBOX_OPTIONS, accessibleName: accessibleNames.rulerCheckboxStringProperty },
    );

    const gridCheckbox = new Checkbox(
      isGridVisibleProperty,
      new Text(labels.gridStringProperty, {
        font: LABEL_FONT,
        fill: FluidPressureAndFlowColors.textColorProperty,
        maxWidth: CONTENT_WIDTH - UNDER_PRESSURE_CONTROL_PANEL_SETTINGS.GRID_CHECKBOX_MAX_WIDTH_OFFSET,
      }),
      { ...CHECKBOX_OPTIONS, accessibleName: accessibleNames.gridCheckboxStringProperty },
    );

    const atmosphereButtons = new AquaRadioButtonGroup(
      isAtmosphereProperty,
      [
        {
          value: true,
          createNode: () =>
            new Text(labels.onStringProperty, {
              font: LABEL_FONT,
              fill: FluidPressureAndFlowColors.textColorProperty,
              maxWidth: UNDER_PRESSURE_CONTROL_PANEL_SETTINGS.ATMOSPHERE_BUTTONS_MAX_WIDTH,
            }),
        },
        {
          value: false,
          createNode: () =>
            new Text(labels.offStringProperty, {
              font: LABEL_FONT,
              fill: FluidPressureAndFlowColors.textColorProperty,
              maxWidth: UNDER_PRESSURE_CONTROL_PANEL_SETTINGS.ATMOSPHERE_BUTTONS_MAX_WIDTH,
            }),
        },
      ],
      {
        orientation: "horizontal",
        spacing: UNDER_PRESSURE_CONTROL_PANEL_SETTINGS.ATMOSPHERE_BUTTONS_SPACING,
        radioButtonOptions: { radius: UNDER_PRESSURE_CONTROL_PANEL_SETTINGS.ATMOSPHERE_BUTTONS_RADIUS },
        accessibleName: accessibleNames.atmosphereControlStringProperty,
      },
    );

    const atmosphereControl = new VBox({
      align: "left",
      spacing: UNDER_PRESSURE_CONTROL_PANEL_SETTINGS.ATMOSPHERE_CONTROL_SPACING,
      children: [
        new Text(labels.atmosphereStringProperty, {
          font: TITLE_FONT,
          fill: FluidPressureAndFlowColors.textColorProperty,
          maxWidth: CONTENT_WIDTH,
        }),
        atmosphereButtons,
      ],
    });

    const toolsAndAtmosphere = new FluidPressureAndFlowPanel(
      new VBox({
        align: "left",
        spacing: UNDER_PRESSURE_CONTROL_PANEL_SETTINGS.TOOLS_AND_ATMOSPHERE_SPACING,
        children: [
          rulerCheckbox,
          gridCheckbox,
          new HSeparator({ stroke: FluidPressureAndFlowColors.panelBorderColorProperty }),
          atmosphereControl,
        ],
      }),
      { minWidth: CONTENT_WIDTH },
    );

    const units = new FluidPressureAndFlowPanel(
      new UnitsControlPanel(unitSystemProperty, labels, accessibleNames.unitsControlStringProperty),
      { minWidth: CONTENT_WIDTH },
    );

    super({ align: "right", spacing: PANEL_SPACING, children: [toolsAndAtmosphere, units] });
  }
}
