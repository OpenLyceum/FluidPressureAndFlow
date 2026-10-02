/**
 * UnderPressureKeyboardHelpContent.ts
 *
 * Content for the keyboard-help dialog (the "?" button in the navigation bar).
 * Left column: dragging the sensors, ruler and masses, the sliders, and the
 * faucets. Right column: the combo boxes and the basic actions, including the
 * checkboxes.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  FaucetControlsKeyboardHelpSection,
  MoveDraggableItemsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class UnderPressureKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    // Sensors, the ruler and the masses are keyboard-draggable; gravity and fluid
    // density are sliders; the pools have faucets; units and fluid are combo boxes.
    super(
      [
        new MoveDraggableItemsKeyboardHelpSection(),
        new SliderControlsKeyboardHelpSection(),
        new FaucetControlsKeyboardHelpSection(),
      ],
      [new ComboBoxKeyboardHelpSection(), new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })],
    );
  }
}
