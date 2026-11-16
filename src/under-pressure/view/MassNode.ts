import { MASS_NODE_SETTINGS } from "../../FluidPressureAndFlowConstants.js";
/**
 * MassNode.ts
 *
 * One of the stackable weights in the chamber pool, draggable by pointer or by
 * keyboard.
 *
 * The mass is written on the face because the whole point of the scene is the
 * relationship between how much weight is on the narrow column and how far the
 * wide one rises. A block whose weight the student has to remember from a
 * legend is a block they will stop reasoning about.
 */

import { PatternStringProperty, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { type Bounds2, Vector2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { DragListener, KeyboardDragListener, Node, Rectangle, Text } from "scenerystack/scenery";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { SHIFT_KEY_SPEED_DIVISOR } from "../../FluidPressureAndFlowConstants.js";
import type { MassModel } from "../model/MassModel.js";

/** Metres the block moves per arrow-key press. */
const KEYBOARD_DRAG_SPEED: number = MASS_NODE_SETTINGS.KEYBOARD_DRAG_SPEED;

export class MassNode extends Node {
  private readonly disposeMassNode: () => void;

  public constructor(
    mass: MassModel,
    modelViewTransform: ModelViewTransform2,
    massLabelPatternProperty: TReadOnlyProperty<string>,
    accessibleName: TReadOnlyProperty<string>,
    dragBounds: Bounds2,
    onRelease: () => void,
  ) {
    super({
      cursor: "pointer",
      tagName: "div",
      focusable: true,
      accessibleName: accessibleName,
    });

    const viewWidth = modelViewTransform.modelToViewDeltaX(mass.width);
    const viewHeight = -modelViewTransform.modelToViewDeltaY(mass.height);

    const block = new Rectangle(
      0,
      0,
      viewWidth,
      viewHeight,
      MASS_NODE_SETTINGS.BLOCK_CORNER_X,
      MASS_NODE_SETTINGS.BLOCK_CORNER_Y,
      {
        fill: FluidPressureAndFlowColors.massColorProperty,
        stroke: FluidPressureAndFlowColors.poolEdgeColorProperty,
        lineWidth: 1,
      },
    );

    const labelProperty = new PatternStringProperty(massLabelPatternProperty, { mass: mass.mass });
    const label = new Text(labelProperty, {
      font: "10px sans-serif",
      fill: FluidPressureAndFlowColors.controlSurfaceColorProperty,
      maxWidth: viewWidth - MASS_NODE_SETTINGS.LABEL_MAX_WIDTH_OFFSET,
    });
    const centerLabel = () => {
      label.center = block.center;
    };
    labelProperty.link(centerLabel);

    this.children = [block, label];

    // The model tracks the centre of the block's bottom edge; the node's own
    // origin is its top-left, so translate between the two here rather than
    // making every caller remember the offset.
    const updatePosition = (position: Vector2) => {
      const bottomCenter = modelViewTransform.modelToViewPosition(position);
      this.leftTop = new Vector2(bottomCenter.x - viewWidth / 2, bottomCenter.y - viewHeight);
    };
    mass.positionProperty.link(updatePosition);

    const dragBoundsProperty = new Property(dragBounds);

    const startDrag = () => {
      mass.isDraggingProperty.value = true;
      mass.velocityProperty.value = 0;
      this.moveToFront();
    };
    const endDrag = () => {
      mass.isDraggingProperty.value = false;
      onRelease();
    };

    // `useParentOffset` measures the grab offset against positionProperty through the
    // transform, so the block keeps the grip the student took it by. Measured against
    // this node's origin instead, it would jump by half its width and all its height.
    const dragListener = new DragListener({
      positionProperty: mass.positionProperty,
      transform: modelViewTransform,
      useParentOffset: true,
      dragBoundsProperty: dragBoundsProperty,
      start: startDrag,
      end: endDrag,
    });
    this.addInputListener(dragListener);

    const keyboardDragListener = new KeyboardDragListener({
      positionProperty: mass.positionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: dragBoundsProperty,
      dragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED),
      shiftDragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED) / SHIFT_KEY_SPEED_DIVISOR,
      start: startDrag,
      end: endDrag,
    });
    this.addInputListener(keyboardDragListener);

    this.disposeMassNode = () => {
      mass.positionProperty.unlink(updatePosition);
      labelProperty.unlink(centerLabel);
      labelProperty.dispose();
      dragListener.dispose();
      keyboardDragListener.dispose();
    };
  }

  public override dispose(): void {
    this.disposeMassNode();
    super.dispose();
  }
}
