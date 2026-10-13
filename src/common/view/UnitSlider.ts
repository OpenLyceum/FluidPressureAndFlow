/**
 * UnitSlider.ts
 *
 * A slider over an SI model value that displays itself in whichever unit system
 * the student has selected.
 *
 * The model Property stays in SI throughout — the slider converts only for the
 * readout and the tick labels. Doing it the other way round, with the Property
 * changing units under the physics, is the classic way to introduce a bug that
 * shows up as a wrong number on one screen and nowhere else.
 *
 * Used by both accordion boxes (fluid density, gravity) and by the Flow screen's
 * flow-rate control.
 */

import {
  DerivedProperty,
  DynamicProperty,
  type EnumerationProperty,
  type NumberProperty,
  PatternStringProperty,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { Dimension2, type Range } from "scenerystack/dot";
import { Text, VBox } from "scenerystack/scenery";
import { HSlider } from "scenerystack/sun";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { StringManager } from "../../i18n/StringManager.js";
import { formatValue, type UnitConversion, type UnitSystem } from "../model/units.js";

/** A labelled tick along the track. */
export type UnitSliderTick = {
  /** Position of the tick, in SI. */
  readonly value: number;
  /** What to write under it — a name like "water", not a number. */
  readonly labelProperty: TReadOnlyProperty<string>;
};

export type UnitSliderOptions = {
  /** Picks this quantity's conversion out of a unit system. */
  readonly conversionFor: (system: UnitSystem) => UnitConversion;
  /** Picks this quantity's abbreviation out of a unit system. */
  readonly unitsLabelFor: (system: UnitSystem) => TReadOnlyProperty<string>;
  /** Named landmarks along the track. */
  readonly majorTicks: readonly UnitSliderTick[];
  /** Accessible name for the slider. */
  readonly accessibleName: TReadOnlyProperty<string>;
  /** Track width in view pixels. */
  readonly trackWidth?: number;
};

/** Default track width, wide enough for three tick labels without crowding. */
const DEFAULT_TRACK_WIDTH = 150;

const TRACK_HEIGHT = 4;
const THUMB_SIZE = new Dimension2(12, 20);

/** Fraction of the range crossed per arrow-key press: fine enough to land on a
 * particular value, coarse enough to cross the range in a few seconds. */
const KEYBOARD_STEP_DIVISOR = 100;

/** Fraction of the range crossed per arrow-key press while Shift is held, for fine control. */
const SHIFT_KEYBOARD_STEP_DIVISOR = 500;

/** Fraction of the range crossed per Page Up/Down press. */
const PAGE_KEYBOARD_STEP_DIVISOR = 10;

const TICK_LABEL_FONT = "11px sans-serif";
const TICK_LABEL_MAX_WIDTH = 60;
const READOUT_FONT = "13px sans-serif";
const READOUT_SPACING = 2;

export class UnitSlider extends VBox {
  private readonly disposeUnitSlider: () => void;

  public constructor(
    valueProperty: NumberProperty,
    range: Range,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    options: UnitSliderOptions,
  ) {
    const common = StringManager.getInstance().getCommonStrings();

    // The readout reformats on two triggers: the value moving, and the student
    // switching unit systems underneath a value that has not moved.
    const displayValueProperty = new DerivedProperty([valueProperty, unitSystemProperty], (value, system) =>
      formatValue(options.conversionFor(system), value),
    );
    // Two things can change the abbreviation: switching unit system, and
    // switching locale. A DerivedProperty reading `.value` would catch only the
    // first, so swap the whole StringProperty and let DynamicProperty follow it.
    const unitsStringPropertyProperty = new DerivedProperty([unitSystemProperty], (system) =>
      options.unitsLabelFor(system),
    );
    const unitsProperty = new DynamicProperty(unitsStringPropertyProperty);
    const readoutProperty = new PatternStringProperty(common.valueWithUnitsPatternStringProperty, {
      value: displayValueProperty,
      units: unitsProperty,
    });

    const slider = new HSlider(valueProperty, range, {
      trackSize: new Dimension2(options.trackWidth ?? DEFAULT_TRACK_WIDTH, TRACK_HEIGHT),
      thumbSize: THUMB_SIZE,
      accessibleName: options.accessibleName,
      keyboardStep: range.getLength() / KEYBOARD_STEP_DIVISOR,
      shiftKeyboardStep: range.getLength() / SHIFT_KEYBOARD_STEP_DIVISOR,
      pageKeyboardStep: range.getLength() / PAGE_KEYBOARD_STEP_DIVISOR,
    });

    for (const tick of options.majorTicks) {
      slider.addMajorTick(
        tick.value,
        new Text(tick.labelProperty, {
          font: TICK_LABEL_FONT,
          fill: FluidPressureAndFlowColors.textColorProperty,
          maxWidth: TICK_LABEL_MAX_WIDTH,
        }),
      );
    }

    super({
      spacing: READOUT_SPACING,
      children: [
        new Text(readoutProperty, {
          font: READOUT_FONT,
          fill: FluidPressureAndFlowColors.textColorProperty,
          maxWidth: DEFAULT_TRACK_WIDTH,
        }),
        slider,
      ],
    });

    this.disposeUnitSlider = () => {
      readoutProperty.dispose();
      unitsProperty.dispose();
      unitsStringPropertyProperty.dispose();
      displayValueProperty.dispose();
      slider.dispose();
    };
  }

  /** Hide the unknown value and its thumb position, retaining room for the mystery chooser. */
  public setValueHidden(hidden: boolean): void {
    this.opacity = hidden ? 0 : 1;
    this.pdomVisible = !hidden;
    this.enabled = !hidden;
  }

  public override dispose(): void {
    this.disposeUnitSlider();
    super.dispose();
  }
}
