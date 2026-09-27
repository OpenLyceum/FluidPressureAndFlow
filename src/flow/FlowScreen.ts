/**
 * FlowScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createFlowIcon() in src/common/FluidPressureAndFlowScreenIcons.ts
 * (see SceneryStackTemplate doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createFlowIcon } from "../common/FluidPressureAndFlowScreenIcons.js";
import type { SharedUnitSystem } from "../common/model/FluidPressureAndFlowModel.js";
import FluidPressureAndFlowColors from "../FluidPressureAndFlowColors.js";
import { FlowModel } from "./model/FlowModel.js";
import { FlowKeyboardHelpContent } from "./view/FlowKeyboardHelpContent.js";
import { FlowScreenView } from "./view/FlowScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type FlowScreenOptions = ScreenOptions & {
  tandem: Tandem;

  /**
   * The cross-screen unit system. Carried on the options bag rather than as a
   * separate parameter because the model factory below reads it, and joist
   * gives the factory no arguments of its own.
   */
  sharedUnits: SharedUnitSystem;
};

export class FlowScreen extends Screen<FlowModel, FlowScreenView> {
  public constructor(options: FlowScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new FlowModel(options.sharedUnits),
      // View factory — receives the model instance
      (model) =>
        new FlowScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<FlowScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: FluidPressureAndFlowColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new FlowKeyboardHelpContent(),
          homeScreenIcon: createFlowIcon(),
          navigationBarIcon: createFlowIcon(),
        },
        options,
      ),
    );
  }
}
