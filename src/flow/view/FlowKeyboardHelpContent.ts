/**
 * FlowKeyboardHelpContent.ts
 *
 * Content for the keyboard-help dialog (the "?" button in the navigation bar).
 * Left column: dragging the sensors, ruler, pipe handles and flux meter, and the
 * sliders. Right column: the time controls and the basic actions, including the
 * checkboxes.
 */

import {
  BasicActionsKeyboardHelpSection,
  MoveDraggableItemsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TimeControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class FlowKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    // Sensors, the ruler, the pipe handles and the flux meter are keyboard-draggable;
    // flow rate and fluid density are sliders; the time controls play and pause.
    super(
      [new MoveDraggableItemsKeyboardHelpSection(), new SliderControlsKeyboardHelpSection()],
      [new TimeControlsKeyboardHelpSection(), new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })],
    );
  }
}
