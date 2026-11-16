import { FAUCET_CONTROL_PANEL_SETTINGS } from "../../FluidPressureAndFlowConstants.js";
/**
 * FaucetControlPanel.ts
 *
 * How the faucet above the tank behaves, and a button to fill the tank outright.
 *
 * Match Leakage is the setting that makes the screen's central claim measurable:
 * with the inflow tracking the outflow, the head holds steady, so the jet stops
 * changing and can be measured at leisure. Manual is there so a student can see
 * what happens when it does not.
 *
 * The Fill button is disabled once the tank is full rather than hidden, so it
 * stays where the student learned to find it.
 */

import type { EnumerationProperty, TReadOnlyProperty } from "scenerystack/axon";
import { Text, VBox } from "scenerystack/scenery";
import { AquaRadioButtonGroup, RectangularPushButton } from "scenerystack/sun";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS } from "../../common/FluidPressureAndFlowButtonOptions.js";
import { FluidPressureAndFlowPanel } from "../../common/FluidPressureAndFlowPanel.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { FaucetMode, type FaucetModeLabelProperties } from "../model/FaucetMode.js";

const LABEL_FONT = "13px sans-serif";

export class FaucetControlPanel extends FluidPressureAndFlowPanel {
  public constructor(
    faucetModeProperty: EnumerationProperty<FaucetMode>,
    labels: FaucetModeLabelProperties & { readonly fillStringProperty: TReadOnlyProperty<string> },
    isFullProperty: TReadOnlyProperty<boolean>,
    fill: () => void,
    modeAccessibleName: TReadOnlyProperty<string>,
    fillAccessibleName: TReadOnlyProperty<string>,
  ) {
    const label = (stringProperty: TReadOnlyProperty<string>) =>
      new Text(stringProperty, {
        font: LABEL_FONT,
        fill: FluidPressureAndFlowColors.textColorProperty,
        maxWidth: FAUCET_CONTROL_PANEL_SETTINGS.LABEL_MAX_WIDTH,
      });

    const modeButtons = new AquaRadioButtonGroup(
      faucetModeProperty,
      [
        { value: FaucetMode.MANUAL, createNode: () => label(labels.manualStringProperty) },
        { value: FaucetMode.MATCH_LEAKAGE, createNode: () => label(labels.matchLeakageStringProperty) },
      ],
      {
        spacing: FAUCET_CONTROL_PANEL_SETTINGS.MODE_BUTTONS_SPACING,
        radioButtonOptions: { radius: FAUCET_CONTROL_PANEL_SETTINGS.MODE_BUTTONS_RADIUS },
        accessibleName: modeAccessibleName,
      },
    );

    const fillButton = new RectangularPushButton({
      ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
      content: new Text(labels.fillStringProperty, {
        font: LABEL_FONT,
        maxWidth: FAUCET_CONTROL_PANEL_SETTINGS.FILL_BUTTON_MAX_WIDTH,
      }),
      listener: fill,
      accessibleName: fillAccessibleName,
    });
    const updateEnabled = (isFull: boolean) => {
      fillButton.enabled = !isFull;
    };
    isFullProperty.link(updateEnabled);

    super(
      new VBox({
        align: "left",
        spacing: FAUCET_CONTROL_PANEL_SETTINGS.CONSTRUCTOR_SPACING,
        children: [modeButtons, fillButton],
      }),
    );
  }
}
