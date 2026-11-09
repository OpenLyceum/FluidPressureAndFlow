/**
 * PipeHandlesNode.ts
 *
 * Grab handles on the pipe wall: bitmap handles on the spline middle, and
 * larger handles at the screen edges that drag the whole end cross-section up
 * and down — matching the PhET HTML5 interaction and artwork.
 */

import { Multilink, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { DragListener, Image, KeyboardDragListener, Node } from "scenerystack/scenery";
import { handleWithBarImage } from "../../common/view/images.js";
import { SHIFT_KEY_SPEED_DIVISOR } from "../../FluidPressureAndFlowConstants.js";
import { MAX_PIPE_Y, MIN_PIPE_HEIGHT, MIN_PIPE_Y, type Pipe } from "../model/Pipe.js";
import type { PipeCrossSection } from "../model/PipeCrossSection.js";
import type { PipeNode } from "./PipeNode.js";
import { PIPE_HEAD_X_SCALE } from "./pipeEndLayout.js";

/** Scale applied to every handle bitmap, tracking the pipe artwork it sits on. */
const HANDLE_IMAGE_SCALE = 0.43;

/** Horizontal inset of the left main drag handle from the layout edge. */
const LEFT_MAIN_HANDLE_INSET = 13;

/** Horizontal inset of the right main drag handle from the layout edge. */
const RIGHT_MAIN_HANDLE_INSET = 67;

/** Extra touch width on each side of a main handle. */
const MAIN_HANDLE_TOUCH_X_EXPAND = 30;

/** Extra touch height below a main handle. */
const MAIN_HANDLE_TOUCH_Y_EXPAND = 60;

/** Extra touch width on each side of a middle or rim handle. */
const VERTICAL_HANDLE_TOUCH_X_EXPAND = 30;

/** Extra touch height below a top vertical handle, which has no room to grow upward. */
const TOP_HANDLE_TOUCH_BOTTOM_EXPAND = 40;

/** Extra touch height above a bottom vertical handle. */
const BOTTOM_HANDLE_TOUCH_TOP_EXPAND = 30;

/** Extra touch height below a bottom vertical handle. */
const BOTTOM_HANDLE_TOUCH_BOTTOM_EXPAND = 60;

/** Extra touch height below the main handle's image, beyond MAIN_HANDLE_TOUCH_Y_EXPAND. */
const MAIN_HANDLE_TOUCH_TOP_INSET = 25;

/** View-pixel gap between a pipe-head rim and its rim handle. */
const RIM_HANDLE_OFFSET = 2;

/** Distance from a pipe-head image's mouth edge to its brown rim centre, bitmap pixels. */
const RIM_HANDLE_X_INSET = 48;

/** Metres the handle moves per arrow-key press. */
const KEYBOARD_DRAG_SPEED = 1.5;

export type PipeHandlesNodeOptions = {
  readonly layoutBounds: Bounds2;
};

export class PipeHandlesNode extends Node {
  private readonly disposePipeHandlesNode: () => void;

  public constructor(
    pipe: Pipe,
    pipeNode: PipeNode,
    modelViewTransform: ModelViewTransform2,
    accessibleName: TReadOnlyProperty<string>,
    options: PipeHandlesNodeOptions,
  ) {
    super();

    const disposers: Array<() => void> = [];
    const leftSection = pipe.crossSections[0] as PipeCrossSection;
    const rightSection = pipe.crossSections[pipe.crossSections.length - 1] as PipeCrossSection;
    const lastIndex = pipe.crossSections.length - 1;

    const leftMainHandle = createMainHandleImage();
    leftMainHandle.x = options.layoutBounds.minX - LEFT_MAIN_HANDLE_INSET;
    this.addChild(leftMainHandle);
    createMainDragListener(leftMainHandle, leftSection, pipeNode.leftPipeFront, modelViewTransform, disposers);

    const rightMainHandle = createMainHandleImage();
    rightMainHandle.x = options.layoutBounds.maxX - RIGHT_MAIN_HANDLE_INSET;
    this.addChild(rightMainHandle);
    createMainDragListener(rightMainHandle, rightSection, pipeNode.rightPipe, modelViewTransform, disposers);

    for (let index = 0; index < pipe.crossSections.length; index++) {
      const section = pipe.crossSections[index] as PipeCrossSection;
      const isEnd = index === 0 || index === lastIndex;
      const pipeHead = index === 0 ? pipeNode.leftPipeFront : index === lastIndex ? pipeNode.rightPipe : null;

      this.addChild(
        isEnd && pipeHead
          ? createRimHandle(
              section,
              pipeHead,
              modelViewTransform,
              accessibleName,
              disposers,
              pipe.shapeVersionProperty,
              {
                isTop: true,
                moved: section.topYProperty,
                limit: section.bottomYProperty,
              },
            )
          : createMiddleHandle(section, modelViewTransform, accessibleName, disposers, {
              isTop: true,
              moved: section.topYProperty,
              limit: section.bottomYProperty,
            }),
      );

      this.addChild(
        isEnd && pipeHead
          ? createRimHandle(
              section,
              pipeHead,
              modelViewTransform,
              accessibleName,
              disposers,
              pipe.shapeVersionProperty,
              {
                isTop: false,
                moved: section.bottomYProperty,
                limit: section.topYProperty,
              },
            )
          : createMiddleHandle(section, modelViewTransform, accessibleName, disposers, {
              isTop: false,
              moved: section.bottomYProperty,
              limit: section.topYProperty,
            }),
      );
    }

    const syncMainHandleY = () => {
      leftMainHandle.top = pipeNode.leftPipeFront.centerY;
      rightMainHandle.top = pipeNode.rightPipe.centerY;
    };
    const mainHandleMultilink = Multilink.multilinkAny([pipe.shapeVersionProperty], syncMainHandleY);
    syncMainHandleY();

    this.disposePipeHandlesNode = () => {
      mainHandleMultilink.dispose();
      for (const dispose of disposers) {
        dispose();
      }
    };
  }

  public override dispose(): void {
    this.disposePipeHandlesNode();
    super.dispose();
  }
}

function createMainHandleImage(): Image {
  const handle = new Image(handleWithBarImage, {
    cursor: "pointer",
    scale: HANDLE_IMAGE_SCALE,
  });
  const bounds = handle.localBounds;
  handle.touchArea = new Bounds2(
    bounds.minX - MAIN_HANDLE_TOUCH_X_EXPAND,
    bounds.minY + MAIN_HANDLE_TOUCH_TOP_INSET,
    bounds.maxX + MAIN_HANDLE_TOUCH_X_EXPAND,
    bounds.maxY + MAIN_HANDLE_TOUCH_Y_EXPAND,
  );
  return handle;
}

/** Touch area for a vertical (middle or rim) handle, wider than the bitmap and biased toward its free side. */
function createVerticalHandleTouchArea(image: Image, isTop: boolean): Bounds2 {
  return isTop
    ? new Bounds2(
        image.localBounds.minX - VERTICAL_HANDLE_TOUCH_X_EXPAND,
        image.localBounds.minY,
        image.localBounds.maxX + VERTICAL_HANDLE_TOUCH_X_EXPAND,
        image.localBounds.maxY + TOP_HANDLE_TOUCH_BOTTOM_EXPAND,
      )
    : new Bounds2(
        image.localBounds.minX - VERTICAL_HANDLE_TOUCH_X_EXPAND,
        image.localBounds.minY + BOTTOM_HANDLE_TOUCH_TOP_EXPAND,
        image.localBounds.maxX + VERTICAL_HANDLE_TOUCH_X_EXPAND,
        image.localBounds.maxY + BOTTOM_HANDLE_TOUCH_BOTTOM_EXPAND,
      );
}

/**
 * The main handle moves a whole end cross-section without changing its height, so
 * the drag is expressed as the cross-section's centre in model coordinates and the
 * two walls are carried along at their existing separation.
 */
function createMainDragListener(
  handle: Image,
  section: PipeCrossSection,
  pipeHeadNode: Node,
  modelViewTransform: ModelViewTransform2,
  disposers: Array<() => void>,
): void {
  const centerY = () => (section.topYProperty.value + section.bottomYProperty.value) / 2;
  const halfHeight = () => (section.topYProperty.value - section.bottomYProperty.value) / 2;

  // The centre is clamped rather than each wall, so a section driven into the top or
  // bottom of the pipe's range stops there instead of being squashed against it.
  const constrain = (point: Vector2): Vector2 => {
    const half = halfHeight();
    return new Vector2(section.x, Math.max(MIN_PIPE_Y + half, Math.min(MAX_PIPE_Y - half, point.y)));
  };

  const dragPositionProperty = new Property(new Vector2(section.x, centerY()));
  let isSyncing = false;

  const syncToModel = (point: Vector2) => {
    if (isSyncing) {
      return;
    }
    isSyncing = true;
    const half = halfHeight();
    // Written in the direction of travel, so the half-updated state in between never
    // has the walls closer together than the middle handles will allow.
    if (point.y > centerY()) {
      section.topYProperty.value = point.y + half;
      section.bottomYProperty.value = point.y - half;
    } else {
      section.bottomYProperty.value = point.y - half;
      section.topYProperty.value = point.y + half;
    }
    handle.top = pipeHeadNode.centerY;
    isSyncing = false;
  };
  dragPositionProperty.link(syncToModel);

  // The section also moves when its own rim handles are dragged, and the drag offset
  // is measured from this property, so it has to follow those too.
  const syncFromModel = () => {
    if (isSyncing) {
      return;
    }
    isSyncing = true;
    dragPositionProperty.value = new Vector2(section.x, centerY());
    isSyncing = false;
  };
  const sectionMultilink = Multilink.multilinkAny([section.topYProperty, section.bottomYProperty], syncFromModel);

  const dragListener = new DragListener({
    positionProperty: dragPositionProperty,
    transform: modelViewTransform,
    useParentOffset: true,
    mapPosition: constrain,
  });
  handle.addInputListener(dragListener);

  disposers.push(() => {
    sectionMultilink.dispose();
    dragPositionProperty.unlink(syncToModel);
    dragListener.dispose();
  });
}

function createHandleImage(isTop: boolean): Image {
  return new Image(handleWithBarImage, {
    cursor: "ns-resize",
    scale: HANDLE_IMAGE_SCALE,
    rotation: isTop ? Math.PI : 0,
  });
}

function createMiddleHandle(
  section: PipeCrossSection,
  modelViewTransform: ModelViewTransform2,
  accessibleName: TReadOnlyProperty<string>,
  disposers: Array<() => void>,
  config: {
    readonly isTop: boolean;
    readonly moved: PipeCrossSection["topYProperty"];
    readonly limit: PipeCrossSection["topYProperty"];
  },
): Node {
  const image = createHandleImage(config.isTop);
  image.touchArea = createVerticalHandleTouchArea(image, config.isTop);

  const wrapper = new Node({
    children: [image],
    tagName: "div",
    focusable: true,
    accessibleName: accessibleName,
  });

  attachVerticalDrag(wrapper, section, modelViewTransform, config, disposers);

  const syncFromModel = (y: number) => {
    wrapper.centerX = modelViewTransform.modelToViewX(section.x);
    // The free end of the bar attaches to the wall; the grip stays outside the fluid.
    const wallY = modelViewTransform.modelToViewY(y);
    if (config.isTop) {
      wrapper.bottom = wallY;
    } else {
      wrapper.top = wallY;
    }
  };
  config.moved.link(syncFromModel);
  disposers.push(() => config.moved.unlink(syncFromModel));

  return wrapper;
}

function createRimHandle(
  section: PipeCrossSection,
  pipeHead: Node,
  modelViewTransform: ModelViewTransform2,
  accessibleName: TReadOnlyProperty<string>,
  disposers: Array<() => void>,
  shapeVersionProperty: Pipe["shapeVersionProperty"],
  config: {
    readonly isTop: boolean;
    readonly moved: PipeCrossSection["topYProperty"];
    readonly limit: PipeCrossSection["topYProperty"];
  },
): Node {
  const image = createHandleImage(config.isTop);
  image.touchArea = createVerticalHandleTouchArea(image, config.isTop);

  const wrapper = new Node({
    children: [image],
    tagName: "div",
    focusable: true,
    accessibleName: accessibleName,
  });

  attachVerticalDrag(wrapper, section, modelViewTransform, config, disposers);

  const syncRimPosition = () => {
    const rimOffset = RIM_HANDLE_X_INSET * PIPE_HEAD_X_SCALE;
    wrapper.centerX = modelViewTransform.modelToViewX(section.x) + (section.x < 0 ? -rimOffset : rimOffset);
    if (config.isTop) {
      wrapper.bottom = pipeHead.top + RIM_HANDLE_OFFSET;
    } else {
      wrapper.top = pipeHead.bottom - RIM_HANDLE_OFFSET;
    }
  };

  const rimMultilink = Multilink.multilinkAny(
    [shapeVersionProperty, section.topYProperty, section.bottomYProperty],
    syncRimPosition,
  );
  syncRimPosition();
  disposers.push(() => rimMultilink.dispose());

  return wrapper;
}

function attachVerticalDrag(
  wrapper: Node,
  section: PipeCrossSection,
  modelViewTransform: ModelViewTransform2,
  config: {
    readonly isTop: boolean;
    readonly moved: PipeCrossSection["topYProperty"];
    readonly limit: PipeCrossSection["topYProperty"];
  },
  disposers: Array<() => void>,
): void {
  const constrain = (point: Vector2): Vector2 => {
    const y = config.isTop
      ? Math.max(config.limit.value + MIN_PIPE_HEIGHT, Math.min(MAX_PIPE_Y, point.y))
      : Math.max(MIN_PIPE_Y, Math.min(config.limit.value - MIN_PIPE_HEIGHT, point.y));
    return new Vector2(section.x, y);
  };

  const dragPositionProperty = new Property(new Vector2(section.x, config.moved.value));
  let isSyncing = false;

  const syncToModel = (point: Vector2) => {
    if (isSyncing) {
      return;
    }
    isSyncing = true;
    config.moved.value = point.y;
    isSyncing = false;
  };
  dragPositionProperty.link(syncToModel);

  // The wall this handle owns also moves when the main handle slides the whole
  // cross-section, and the drag offset is measured from this property, so it has to
  // follow the model as well as drive it.
  const syncFromModel = (y: number) => {
    if (isSyncing) {
      return;
    }
    isSyncing = true;
    dragPositionProperty.value = new Vector2(section.x, y);
    isSyncing = false;
  };
  config.moved.link(syncFromModel);

  const limitListener = () => {
    const constrained = constrain(new Vector2(section.x, config.moved.value));
    if (constrained.y !== config.moved.value) {
      config.moved.value = constrained.y;
    }
  };
  config.limit.link(limitListener);

  const dragBoundsProperty = new Property(new Bounds2(section.x, MIN_PIPE_Y, section.x, MAX_PIPE_Y));

  // `useParentOffset` measures the grab offset against dragPositionProperty through
  // the transform. The wrapper is placed by its bar tip or against a pipe rim, so its
  // origin is not the point being dragged.
  const dragListener = new DragListener({
    positionProperty: dragPositionProperty,
    transform: modelViewTransform,
    useParentOffset: true,
    dragBoundsProperty: dragBoundsProperty,
    mapPosition: constrain,
  });
  wrapper.addInputListener(dragListener);

  const keyboardDragListener = new KeyboardDragListener({
    positionProperty: dragPositionProperty,
    transform: modelViewTransform,
    dragBoundsProperty: dragBoundsProperty,
    mapPosition: constrain,
    dragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED),
    shiftDragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED) / SHIFT_KEY_SPEED_DIVISOR,
  });
  wrapper.addInputListener(keyboardDragListener);

  disposers.push(() => {
    dragPositionProperty.unlink(syncToModel);
    config.moved.unlink(syncFromModel);
    config.limit.unlink(limitListener);
    dragListener.dispose();
    keyboardDragListener.dispose();
  });
}
