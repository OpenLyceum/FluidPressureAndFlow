/**
 * UnderPressureScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createUnderPressureIcon() in src/common/FluidPressureAndFlowScreenIcons.ts
 * (see SceneryStackTemplate doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createUnderPressureIcon } from "../common/FluidPressureAndFlowScreenIcons.js";
import type { SharedUnitSystem } from "../common/model/FluidPressureAndFlowModel.js";
import FluidPressureAndFlowColors from "../FluidPressureAndFlowColors.js";
import { UnderPressureModel } from "./model/UnderPressureModel.js";
import { UnderPressureKeyboardHelpContent } from "./view/UnderPressureKeyboardHelpContent.js";
import { UnderPressureScreenView } from "./view/UnderPressureScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type UnderPressureScreenOptions = ScreenOptions & {
  tandem: Tandem;

  /**
   * The cross-screen unit system. Carried on the options bag rather than as a
   * separate parameter because the model factory below reads it, and joist
   * gives the factory no arguments of its own.
   */
  sharedUnits: SharedUnitSystem;
};

export class UnderPressureScreen extends Screen<UnderPressureModel, UnderPressureScreenView> {
  public constructor(options: UnderPressureScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new UnderPressureModel(options.sharedUnits),
      // View factory — receives the model instance
      (model) =>
        new UnderPressureScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<UnderPressureScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: FluidPressureAndFlowColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new UnderPressureKeyboardHelpContent(),
          homeScreenIcon: createUnderPressureIcon(),
          navigationBarIcon: createUnderPressureIcon(),
        },
        options,
      ),
    );
  }
}
