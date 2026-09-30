/**
 * WaterTowerKeyboardHelpContent.ts
 *
 * Content for the keyboard-help dialog (the "?" button in the navigation bar).
 * The tank, sluice gate, and hose are KeyboardDragListeners, so dragging is
 * documented with MoveDraggableItemsKeyboardHelpSection rather than a second
 * HotkeyData. Sliders, the faucet, and the time controls use the matching
 * scenery-phet sections.
 */

import {
  BasicActionsKeyboardHelpSection,
  FaucetControlsKeyboardHelpSection,
  MoveDraggableItemsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TimeControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class WaterTowerKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super(
      [
        new MoveDraggableItemsKeyboardHelpSection(),
        new SliderControlsKeyboardHelpSection(),
        new FaucetControlsKeyboardHelpSection(),
      ],
      [new TimeControlsKeyboardHelpSection(), new BasicActionsKeyboardHelpSection()],
    );
  }
}
