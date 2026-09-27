/**
 * WaterTowerScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createWaterTowerIcon() in src/common/FluidPressureAndFlowScreenIcons.ts
 * (see SceneryStackTemplate doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createWaterTowerIcon } from "../common/FluidPressureAndFlowScreenIcons.js";
import type { SharedUnitSystem } from "../common/model/FluidPressureAndFlowModel.js";
import FluidPressureAndFlowColors from "../FluidPressureAndFlowColors.js";
import { WaterTowerModel } from "./model/WaterTowerModel.js";
import { WaterTowerKeyboardHelpContent } from "./view/WaterTowerKeyboardHelpContent.js";
import { WaterTowerScreenView } from "./view/WaterTowerScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type WaterTowerScreenOptions = ScreenOptions & {
  tandem: Tandem;

  /**
   * The cross-screen unit system. Carried on the options bag rather than as a
   * separate parameter because the model factory below reads it, and joist
   * gives the factory no arguments of its own.
   */
  sharedUnits: SharedUnitSystem;
};

export class WaterTowerScreen extends Screen<WaterTowerModel, WaterTowerScreenView> {
  public constructor(options: WaterTowerScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new WaterTowerModel(options.sharedUnits),
      // View factory — receives the model instance
      (model) =>
        new WaterTowerScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<WaterTowerScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: FluidPressureAndFlowColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new WaterTowerKeyboardHelpContent(),
          homeScreenIcon: createWaterTowerIcon(),
          navigationBarIcon: createWaterTowerIcon(),
        },
        options,
      ),
    );
  }
}
