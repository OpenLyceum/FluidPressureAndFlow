import { FPAF_RULER_NODE_SETTINGS } from "../../FluidPressureAndFlowConstants.js";
/**
 * FPAFRulerNode.ts
 *
 * A vertical ruler the student drags around to measure depths and heights.
 *
 * It is vertical because every distance that matters in this sim is vertical:
 * depth below a surface, height of a tank, the head driving a jet. It is dragged
 * rather than fixed to the pool because the same ruler has to serve a pool three
 * metres deep and a water tower twenty metres tall.
 *
 * The ruler re-graduates itself when the unit system changes — a metric ruler
 * showing a depth in feet would be worse than useless.
 */

import { type EnumerationProperty, Multilink, Property, type TReadOnlyProperty } from "scenerystack/axon";
import type { Bounds2, Vector2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { DragListener, Font, KeyboardDragListener, Node } from "scenerystack/scenery";
import { CloseButton, RulerNode } from "scenerystack/scenery-phet";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { SHIFT_KEY_SPEED_DIVISOR } from "../../FluidPressureAndFlowConstants.js";
import { toDisplayValue, type UnitLabelGroups, type UnitSystem } from "../model/units.js";

/** Width of the ruler body, view pixels. */
const RULER_WIDTH: number = FPAF_RULER_NODE_SETTINGS.RULER_WIDTH;

/** Font for the ruler's numbers and its unit label. */
const TICK_FONT = new Font({ size: FPAF_RULER_NODE_SETTINGS.TICK_FONT_SIZE, family: "sans-serif" });

/**
 * Graduations to try, in display units, coarsest-fitting wins. A ruler marked
 * every foot is ideal; one marked every five is still useful; one whose labels
 * overlap is not.
 */
const TICK_INTERVALS = [1, 2, 5, 10];

/** Least spacing between major ticks that keeps their labels legible, view pixels. */
const MIN_MAJOR_TICK_SPACING: number = FPAF_RULER_NODE_SETTINGS.MIN_MAJOR_TICK_SPACING;

/** Metres the ruler moves per arrow-key press. */
const KEYBOARD_DRAG_SPEED: number = FPAF_RULER_NODE_SETTINGS.KEYBOARD_DRAG_SPEED;

export type FPAFRulerNodeOptions = {
  /** Hides the ruler when pressed, as in the published Under Pressure sim. */
  readonly onClose?: () => void;
};

export class FPAFRulerNode extends Node {
  private readonly disposeFPAFRulerNode: () => void;

  /**
   * @param positionProperty - the ruler's zero mark, in model coordinates
   * @param lengthInMeters - how much of the world the ruler spans
   * @param unitSystemProperty - which units to graduate in
   * @param unitLabelGroups - localized unit abbreviations
   * @param modelViewTransform - model → view
   * @param dragBounds - where the zero mark may go, model coordinates
   * @param accessibleName - name announced for the ruler
   */
  public constructor(
    positionProperty: Property<Vector2>,
    lengthInMeters: number,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    unitLabelGroups: UnitLabelGroups,
    modelViewTransform: ModelViewTransform2,
    dragBounds: Bounds2,
    accessibleName: TReadOnlyProperty<string>,
    providedOptions?: FPAFRulerNodeOptions,
  ) {
    super({
      cursor: "pointer",
      tagName: "div",
      focusable: true,
      accessibleName: accessibleName,
    });

    const viewLength = -modelViewTransform.modelToViewDeltaY(lengthInMeters);

    // Rebuilt rather than relabelled on a unit change: the graduation changes
    // too, since four metres and thirteen feet are not the same ruler.
    const rulerLayer = new Node();
    this.addChild(rulerLayer);

    const rebuild = () => {
      const system = unitSystemProperty.value;
      const unitsProperty = system.labels(unitLabelGroups).distanceStringProperty;
      const totalInUnits = toDisplayValue(system.distance, lengthInMeters);

      const interval =
        TICK_INTERVALS.find((candidate) => (viewLength * candidate) / totalInUnits >= MIN_MAJOR_TICK_SPACING) ??
        (TICK_INTERVALS[TICK_INTERVALS.length - 1] as number);

      const majorTickCount = Math.max(2, Math.floor(totalInUnits / interval) + 1);
      const majorTickSpacing = (viewLength * interval) / totalInUnits;
      const labels = Array.from({ length: majorTickCount }, (_, i) => (i === 0 ? "" : String(i * interval)));

      const ruler = new RulerNode(viewLength, RULER_WIDTH, majorTickSpacing, labels, unitsProperty, {
        backgroundFill: FluidPressureAndFlowColors.panelBackgroundColorProperty,
        backgroundStroke: FluidPressureAndFlowColors.panelBorderColorProperty,
        majorTickStroke: FluidPressureAndFlowColors.textColorProperty,
        minorTickStroke: FluidPressureAndFlowColors.textColorProperty,
        majorTickFont: TICK_FONT,
        unitsFont: TICK_FONT,
        insetsWidth: 0,
        minorTicksPerMajorTick: 4,
        tickMarksOnBottom: false,
        unitsMajorTickIndex: 1,
      });

      ruler.rotate(Math.PI / 2);

      const previous = rulerLayer.children[0];
      rulerLayer.children = [ruler];
      previous?.dispose();
    };

    const rebuildMultilink = Multilink.multilinkAny(
      [
        unitSystemProperty,
        unitLabelGroups.metric.distanceStringProperty,
        unitLabelGroups.english.distanceStringProperty,
      ],
      rebuild,
    );
    rebuild();

    const updatePosition = (position: Vector2) => {
      this.leftTop = modelViewTransform.modelToViewPosition(position);
    };
    positionProperty.link(updatePosition);

    let closeButton: CloseButton | null = null;
    let positionCloseButton: ((position: Vector2) => void) | null = null;
    if (providedOptions?.onClose) {
      const button = new CloseButton({
        iconLength: 12,
        listener: providedOptions.onClose,
      });
      closeButton = button;
      positionCloseButton = (position: Vector2) => {
        const viewPosition = modelViewTransform.modelToViewPosition(position);
        button.left = viewPosition.x - RULER_WIDTH;
        button.bottom = viewPosition.y;
      };
      positionProperty.link(positionCloseButton);
      this.addChild(button);
    }

    const dragBoundsProperty = new Property(dragBounds);

    // `useParentOffset` measures the grab offset against positionProperty through the
    // transform. Without it the listener would measure against this node's origin,
    // which the rotation above leaves at the far corner of the ruler.
    const dragListener = new DragListener({
      positionProperty: positionProperty,
      transform: modelViewTransform,
      useParentOffset: true,
      dragBoundsProperty: dragBoundsProperty,
      start: () => this.moveToFront(),
    });
    this.addInputListener(dragListener);

    const keyboardDragListener = new KeyboardDragListener({
      positionProperty: positionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: dragBoundsProperty,
      dragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED),
      shiftDragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED) / SHIFT_KEY_SPEED_DIVISOR,
      start: () => this.moveToFront(),
    });
    this.addInputListener(keyboardDragListener);

    this.disposeFPAFRulerNode = () => {
      rebuildMultilink.dispose();
      positionProperty.unlink(updatePosition);
      if (positionCloseButton) {
        positionProperty.unlink(positionCloseButton);
      }
      dragListener.dispose();
      keyboardDragListener.dispose();
      closeButton?.dispose();
      rulerLayer.dispose();
    };
  }

  public override dispose(): void {
    this.disposeFPAFRulerNode();
    super.dispose();
  }
}
