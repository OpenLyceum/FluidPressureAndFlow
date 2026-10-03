/**
 * VelocitySensorNode.ts
 *
 * A speedometer the student drags into the flow.
 *
 * It shows a number and an arrow. The number answers "how fast", which is what a
 * student needs to check continuity against the flux meter. The arrow answers
 * "which way", which matters because the pipe slopes and the water tower's jet
 * arcs — a scalar readout would hide the most interesting part of the Water
 * Tower screen entirely.
 */

import { Property, type TReadOnlyProperty } from "scenerystack/axon";
import type { Bounds2, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import {
  DragListener,
  KeyboardDragListener,
  Node,
  Path,
  type PressListenerEvent,
  Rectangle,
  Text,
} from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { Utterance } from "scenerystack/utterance-queue";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { SHIFT_KEY_SPEED_DIVISOR } from "../../FluidPressureAndFlowConstants.js";
import type { VelocitySensor } from "../model/VelocitySensor.js";

/**
 * Size of the readout body, view pixels. Exported because the stowed tray icon in
 * createSensorIcons.ts is drawn at the instrument's true size, not a thumbnail.
 */
export const BODY_WIDTH = 76;
export const BODY_HEIGHT = 44;

/** Height of the pointed tip below the body, view pixels. Shared with the tray icon. */
export const TIP_HEIGHT = 12;
export const TIP_HALF_WIDTH = 8;

/** View pixels of arrow per m/s of flow. */
const ARROW_SCALE = 22;

/** Longest the direction arrow is allowed to grow, view pixels. */
const MAX_ARROW_LENGTH = 90;

/** Metres the sampling point moves per arrow-key press. */
const KEYBOARD_DRAG_SPEED = 3;

export type VelocitySensorNodeOptions = {
  /** Region that catches a drop; dropping here stows the tool. */
  readonly toolboxBounds: () => Bounds2;
  /** Where the sampling point may go, model coordinates. */
  readonly dragBounds: Bounds2;
  /** Where it lands when taken with the keyboard. */
  readonly homePosition: Vector2;
  /** Accessible name for this instrument. */
  readonly accessibleName: TReadOnlyProperty<string>;
};

export class VelocitySensorNode extends Node {
  private readonly disposeVelocitySensorNode: () => void;

  /** All set in the constructor; used by {@link grabFromToolbox}. */
  private readonly dragListener: DragListener;
  private readonly positionProperty: Property<Vector2>;
  private readonly modelViewTransform: ModelViewTransform2;
  private readonly dragBounds: Bounds2;

  public constructor(
    sensor: VelocitySensor,
    modelViewTransform: ModelViewTransform2,
    speedTextProperty: TReadOnlyProperty<string>,
    labelProperty: TReadOnlyProperty<string>,
    options: VelocitySensorNodeOptions,
  ) {
    super({
      cursor: "pointer",
      tagName: "div",
      focusable: true,
      accessibleName: options.accessibleName,
      accessibleHelpText: speedTextProperty,
    });

    const body = new Rectangle(0, 0, BODY_WIDTH, BODY_HEIGHT, 5, 5, {
      fill: FluidPressureAndFlowColors.speedometerBodyColorProperty,
      stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
      lineWidth: 2,
    });

    const label = new Text(labelProperty, {
      font: "11px sans-serif",
      fill: FluidPressureAndFlowColors.controlSurfaceColorProperty,
      maxWidth: BODY_WIDTH - 8,
      centerX: body.centerX,
      top: body.top + 3,
    });

    const readoutBackground = new Rectangle(0, 0, BODY_WIDTH - 10, 18, 3, 3, {
      fill: FluidPressureAndFlowColors.gaugeFaceColorProperty,
      centerX: body.centerX,
      bottom: body.bottom - 4,
    });
    const readoutText = new Text(speedTextProperty, {
      font: "bold 12px sans-serif",
      fill: FluidPressureAndFlowColors.controlSurfaceTextColorProperty,
      maxWidth: BODY_WIDTH - 14,
    });
    const centerReadout = () => {
      readoutText.center = readoutBackground.center;
    };
    speedTextProperty.link(centerReadout);

    const tip = new Path(
      new Shape().moveTo(-TIP_HALF_WIDTH, 0).lineTo(TIP_HALF_WIDTH, 0).lineTo(0, TIP_HEIGHT).close(),
      {
        fill: FluidPressureAndFlowColors.speedometerBodyColorProperty,
        top: body.bottom - 1,
        centerX: body.centerX,
      },
    );

    this.children = [tip, body, label, readoutBackground, readoutText];

    // Same tip-at-origin layout as BarometerNode, so setting `translation` below puts
    // the sampling point itself on the model position.
    const tipAnchor = tip.centerBottom;
    for (const child of this.children) {
      child.translate(-tipAnchor.x, -tipAnchor.y);
    }

    // Added after the shift and left untranslated, so its tail sits on the origin —
    // the sampling point — and it reads as the flow at the probe rather than as a
    // property of the instrument body. Behind the body so it never covers the digits.
    const arrow = new ArrowNode(0, 0, 0, 0, {
      fill: FluidPressureAndFlowColors.accentColorProperty,
      stroke: FluidPressureAndFlowColors.gaugeRimColorProperty,
      headHeight: 12,
      headWidth: 12,
      tailWidth: 5,
    });
    this.insertChild(0, arrow);

    this.positionProperty = sensor.positionProperty;
    this.modelViewTransform = modelViewTransform;
    this.dragBounds = options.dragBounds;

    const updatePosition = (position: Vector2) => {
      this.translation = modelViewTransform.modelToViewPosition(position);
    };
    sensor.positionProperty.link(updatePosition);

    const updateArrow = () => {
      const velocity = sensor.valueProperty.value;
      arrow.visible = velocity !== null && velocity.magnitude > 0;
      if (velocity && velocity.magnitude > 0) {
        const length = Math.min(MAX_ARROW_LENGTH, velocity.magnitude * ARROW_SCALE);
        const direction = velocity.normalized();
        arrow.setTail(0, 0);
        // The view's y runs the other way from the model's, so the arrow's
        // vertical component is negated to point where the fluid actually goes.
        arrow.setTip(direction.x * length, -direction.y * length);
      }
    };
    sensor.valueProperty.link(updateArrow);
    updateArrow();

    const dragBoundsProperty = new Property(options.dragBounds);

    const endDrag = () => {
      const viewPosition = modelViewTransform.modelToViewPosition(sensor.positionProperty.value);
      if (options.toolboxBounds().containsPoint(viewPosition)) {
        sensor.isActiveProperty.value = false;
        sensor.positionProperty.value = options.homePosition;
      }
    };

    // See BarometerNode: the grab offset is measured against positionProperty, not
    // against this node's origin.
    this.dragListener = new DragListener({
      positionProperty: sensor.positionProperty,
      transform: modelViewTransform,
      useParentOffset: true,
      dragBoundsProperty: dragBoundsProperty,
      start: () => this.moveToFront(),
      end: endDrag,
    });
    this.addInputListener(this.dragListener);

    const readingUtterance = new Utterance({ alert: speedTextProperty });
    let lastAnnouncedReading = speedTextProperty.value;
    const announceReading = () => {
      const reading = speedTextProperty.value;
      if (reading !== lastAnnouncedReading) {
        lastAnnouncedReading = reading;
        this.addAccessibleResponse(readingUtterance);
      }
    };
    const keyboardDragListener = new KeyboardDragListener({
      positionProperty: sensor.positionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: dragBoundsProperty,
      dragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED),
      shiftDragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED) / SHIFT_KEY_SPEED_DIVISOR,
      start: () => {
        this.moveToFront();
        lastAnnouncedReading = speedTextProperty.value;
      },
      drag: announceReading,
      end: () => {
        announceReading();
        endDrag();
      },
    });
    this.addInputListener(keyboardDragListener);

    const updateVisibility = (isActive: boolean) => {
      this.visible = isActive;
    };
    sensor.isActiveProperty.link(updateVisibility);

    this.disposeVelocitySensorNode = () => {
      sensor.positionProperty.unlink(updatePosition);
      sensor.valueProperty.unlink(updateArrow);
      sensor.isActiveProperty.unlink(updateVisibility);
      speedTextProperty.unlink(centerReadout);
      this.dragListener.dispose();
      keyboardDragListener.dispose();
      readingUtterance.dispose();
    };
  }

  /** Takes over a press that began on the toolbox. See BarometerNode.grabFromToolbox. */
  public grabFromToolbox(event: PressListenerEvent): void {
    this.moveToFront();
    this.positionProperty.value = this.dragBounds.closestPointTo(
      this.modelViewTransform.viewToModelPosition(this.globalToParentPoint(event.pointer.point)),
    );
    this.dragListener.press(event, this);
  }

  public override dispose(): void {
    this.disposeVelocitySensorNode();
    super.dispose();
  }
}
