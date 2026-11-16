import { PIN_ACCORDION_BOX_SETTINGS } from "../../FluidPressureAndFlowConstants.js";
/**
 * pinAccordionBox.ts
 *
 * Keeps an accordion box anchored to a fixed edge as it opens and closes.
 *
 * By default sun's AccordionBox reserves its expanded footprint even while
 * collapsed, so that opening it never moves anything. That is the right default
 * for a box in the middle of a column, but not for one anchored to the bottom of
 * the screen: the reserved space is invisible, so aligning the box's bottom to the
 * bottom margin leaves the visible title bar floating a hundred pixels up, with an
 * unexplained gap beneath it.
 *
 * These boxes therefore shrink to the size they look ({@link ACCORDION_BOX_SHRINK_WHEN_COLLAPSED}),
 * and this re-applies the anchor whenever that size changes, so the box grows
 * away from its anchored edge instead of through it.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Text } from "scenerystack/scenery";
import type { AccordionBox, AccordionBoxOptions } from "scenerystack/sun";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { PANEL_CORNER_RADIUS } from "../../FluidPressureAndFlowConstants.js";

/**
 * Spread into an AccordionBox's options alongside `pinAccordionBox`. Kept next to
 * the function because the two are only correct together: shrinking without
 * re-anchoring makes an opened box overflow the screen edge.
 */
export const ACCORDION_BOX_SHRINK_WHEN_COLLAPSED = {
  useExpandedBoundsWhenCollapsed: false,
} as const;

const TITLE_FONT = "bold 13px sans-serif";
const TITLE_MAX_WIDTH: number = PIN_ACCORDION_BOX_SETTINGS.TITLE_MAX_WIDTH;
const CONTENT_X_MARGIN: number = PIN_ACCORDION_BOX_SETTINGS.CONTENT_X_MARGIN;
const CONTENT_Y_MARGIN: number = PIN_ACCORDION_BOX_SETTINGS.CONTENT_Y_MARGIN;
const BUTTON_X_MARGIN: number = PIN_ACCORDION_BOX_SETTINGS.BUTTON_X_MARGIN;
const BUTTON_Y_MARGIN: number = PIN_ACCORDION_BOX_SETTINGS.BUTTON_Y_MARGIN;
const EXPAND_COLLAPSE_BUTTON_SIDE_LENGTH: number = PIN_ACCORDION_BOX_SETTINGS.EXPAND_COLLAPSE_BUTTON_SIDE_LENGTH;

/**
 * Panel chrome shared by every slider-in-a-box on the three screens (fluid
 * density, gravity, flow rate): corner radius, panel fill/stroke, margins, and
 * the expand/collapse button's size. Spread into an AccordionBox's options
 * alongside a screen-specific `titleNode`, `expandedDefaultValue`, and
 * `ACCORDION_BOX_SHRINK_WHEN_COLLAPSED`.
 */
export const ACCORDION_BOX_CHROME_OPTIONS = {
  titleAlignX: "center",
  cornerRadius: PANEL_CORNER_RADIUS,
  fill: FluidPressureAndFlowColors.panelBackgroundColorProperty,
  stroke: FluidPressureAndFlowColors.panelBorderColorProperty,
  contentXMargin: CONTENT_X_MARGIN,
  contentYMargin: CONTENT_Y_MARGIN,
  buttonXMargin: BUTTON_X_MARGIN,
  buttonYMargin: BUTTON_Y_MARGIN,
  expandCollapseButtonOptions: { sideLength: EXPAND_COLLAPSE_BUTTON_SIDE_LENGTH },
} satisfies Partial<AccordionBoxOptions>;

/** The bold title text used atop every slider accordion box, in the shared font and width. */
export function createAccordionBoxTitle(titleStringProperty: TReadOnlyProperty<string>): Text {
  return new Text(titleStringProperty, {
    font: TITLE_FONT,
    fill: FluidPressureAndFlowColors.textColorProperty,
    maxWidth: TITLE_MAX_WIDTH,
  });
}

/**
 * @param box - the box to anchor
 * @param reposition - sets the box's position; called now and on every open/close
 */
export function pinAccordionBox(box: AccordionBox, reposition: () => void): void {
  box.expandedProperty.link(reposition);
}
