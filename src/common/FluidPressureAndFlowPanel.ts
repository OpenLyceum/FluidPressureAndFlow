import { FLUID_PRESSURE_AND_FLOW_PANEL_SETTINGS } from "../FluidPressureAndFlowConstants.js";
/**
 * FluidPressureAndFlowPanel.ts
 *
 * A pre-themed Panel that automatically uses FluidPressureAndFlowColors for background and
 * border. Use this for all control panels and info boxes in the sim so that
 * default / projector mode switching is handled automatically.
 *
 * ── Basic usage ───────────────────────────────────────────────────────────────
 *
 *   import { FluidPressureAndFlowPanel } from "../../common/FluidPressureAndFlowPanel.js";
 *   import { VBox, Text } from "scenerystack/scenery";
 *
 *   const content = new VBox({
 *     children: [ new Text("label"), slider ],
 *     spacing: 8,
 *   });
 *   const panel = new FluidPressureAndFlowPanel(content);
 *
 * ── Overriding defaults ───────────────────────────────────────────────────────
 *
 *   // Wider margins, sharper corners, custom stroke
 *   const panel = new FluidPressureAndFlowPanel(content, { xMargin: 20, cornerRadius: 0 });
 *
 *   // Transparent background (decorative border only)
 *   const panel = new FluidPressureAndFlowPanel(content, { fill: "transparent" });
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { Node } from "scenerystack/scenery";
import { Panel, type PanelOptions } from "scenerystack/sun";
import FluidPressureAndFlowColors from "../FluidPressureAndFlowColors.js";
import { PANEL_CORNER_RADIUS } from "../FluidPressureAndFlowConstants.js";

export type FluidPressureAndFlowPanelOptions = PanelOptions;

export class FluidPressureAndFlowPanel extends Panel {
  public constructor(content: Node, providedOptions?: FluidPressureAndFlowPanelOptions) {
    const options = optionize<FluidPressureAndFlowPanelOptions, EmptySelfOptions, PanelOptions>()(
      {
        fill: FluidPressureAndFlowColors.panelBackgroundColorProperty,
        stroke: FluidPressureAndFlowColors.panelBorderColorProperty,
        cornerRadius: PANEL_CORNER_RADIUS,
        xMargin: FLUID_PRESSURE_AND_FLOW_PANEL_SETTINGS.OPTIONS_X_MARGIN,
        yMargin: FLUID_PRESSURE_AND_FLOW_PANEL_SETTINGS.OPTIONS_Y_MARGIN,
      },
      providedOptions,
    );
    super(content, options);
  }
}
