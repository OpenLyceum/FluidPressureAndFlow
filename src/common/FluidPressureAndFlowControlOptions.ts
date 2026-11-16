import { FLUID_PRESSURE_AND_FLOW_CONTROL_OPTIONS_SETTINGS } from "../FluidPressureAndFlowConstants.js";
/**
 * FluidPressureAndFlowControlOptions.ts
 *
 * Shared sizing and layout for panel controls (sliders, checkboxes, NumberControls).
 * Import these instead of repeating scale / track-size values in each screen view.
 *
 * Template-owned toolkit: each sim uses only some of these, so every export is tagged
 * `@public` to tell dead-code checkers (knip) that an unused one is not dead code.
 */

import { Dimension2 } from "scenerystack/dot";
import { NumberControl } from "scenerystack/scenery-phet";
import type { CheckboxOptions, HSliderOptions } from "scenerystack/sun";
import FluidPressureAndFlowColors from "../FluidPressureAndFlowColors.js";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS } from "./FluidPressureAndFlowButtonOptions.js";

const SLIDER_THUMB_SIZE = new Dimension2(
  FLUID_PRESSURE_AND_FLOW_CONTROL_OPTIONS_SETTINGS.SLIDER_THUMB_SIZE_WIDTH,
  FLUID_PRESSURE_AND_FLOW_CONTROL_OPTIONS_SETTINGS.SLIDER_THUMB_SIZE_HEIGHT,
);
const STANDALONE_SLIDER_TRACK_SIZE = new Dimension2(
  FLUID_PRESSURE_AND_FLOW_CONTROL_OPTIONS_SETTINGS.STANDALONE_SLIDER_TRACK_SIZE_WIDTH,
  FLUID_PRESSURE_AND_FLOW_CONTROL_OPTIONS_SETTINGS.STANDALONE_SLIDER_TRACK_SIZE_HEIGHT,
);
const NUMBER_CONTROL_SLIDER_TRACK_SIZE = new Dimension2(
  FLUID_PRESSURE_AND_FLOW_CONTROL_OPTIONS_SETTINGS.NUMBER_CONTROL_SLIDER_TRACK_SIZE_WIDTH,
  FLUID_PRESSURE_AND_FLOW_CONTROL_OPTIONS_SETTINGS.NUMBER_CONTROL_SLIDER_TRACK_SIZE_HEIGHT,
);
const CHECKBOX_BOX_WIDTH: number = FLUID_PRESSURE_AND_FLOW_CONTROL_OPTIONS_SETTINGS.CHECKBOX_BOX_WIDTH;

/** Options for standalone HSlider instances in control panels. @public */
export const SLIDER_OPTIONS = {
  trackSize: STANDALONE_SLIDER_TRACK_SIZE,
  thumbSize: SLIDER_THUMB_SIZE,
  trackFillEnabled: FluidPressureAndFlowColors.textColorProperty,
} satisfies HSliderOptions;

/** Base NumberControl options; spread into each instance and add titleNodeOptions as needed. @public */
export const NUMBER_CONTROL_OPTIONS = {
  arrowButtonOptions: {
    ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
    scale: FLUID_PRESSURE_AND_FLOW_CONTROL_OPTIONS_SETTINGS.NUMBER_CONTROL_OPTIONS_SCALE,
  },
  layoutFunction: NumberControl.createLayoutFunction4({
    sliderPadding: FLUID_PRESSURE_AND_FLOW_CONTROL_OPTIONS_SETTINGS.NUMBER_CONTROL_OPTIONS_SLIDER_PADDING,
    arrowButtonSpacing: FLUID_PRESSURE_AND_FLOW_CONTROL_OPTIONS_SETTINGS.NUMBER_CONTROL_OPTIONS_ARROW_BUTTON_SPACING,
    verticalSpacing: FLUID_PRESSURE_AND_FLOW_CONTROL_OPTIONS_SETTINGS.NUMBER_CONTROL_OPTIONS_VERTICAL_SPACING,
  }),
  sliderOptions: {
    trackSize: NUMBER_CONTROL_SLIDER_TRACK_SIZE,
    thumbSize: SLIDER_THUMB_SIZE,
    trackFillEnabled: FluidPressureAndFlowColors.textColorProperty,
  },
};

/**
 * Themed checkbox chrome on dark panel backgrounds.
 *
 * The box fill matches the panel so the control reads as part of the panel, and
 * the tick/border use {@link FluidPressureAndFlowColors.textColorProperty} (near-white in default
 * mode). Do not use {@link FluidPressureAndFlowColors.controlSurfaceColorProperty} here — that
 * colour is for white chrome (push buttons, combo lists, Preferences).
 *
 * @public
 */
export const CHECKBOX_OPTIONS = {
  boxWidth: CHECKBOX_BOX_WIDTH,
  spacing: FLUID_PRESSURE_AND_FLOW_CONTROL_OPTIONS_SETTINGS.CHECKBOX_OPTIONS_SPACING,
  checkboxColor: FluidPressureAndFlowColors.textColorProperty,
  checkboxColorBackground: FluidPressureAndFlowColors.panelBackgroundColorProperty,
} satisfies CheckboxOptions;
