/**
 * WaterTowerNode.ts
 *
 * The tank, its legs, the water in it, and the sluice gate at the hole.
 *
 * A wheel and rope at the top of the tank show how the gate is raised and
 * lowered. The whole assembly is draggable vertically by its handle — that is
 * the screen's main control: raising the tank with the hose attached raises the
 * water while leaving the outlet where it is, which is the only way to vary the
 * head on its own.
 *
 * The gate is a separate grab target rather than a checkbox because opening it
 * is the first thing a student has to do, and a thing you pull down on a rope is
 * more obviously "the way to let the water out" than a labelled tick box.
 */

import type { NumberProperty } from "scenerystack/axon";
import { Multilink, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import {
  DragListener,
  Image,
  KeyboardDragListener,
  KeyboardListener,
  LinearGradient,
  Node,
  Path,
  Rectangle,
} from "scenerystack/scenery";
import { getFluidColor } from "../../common/model/fluidColor.js";
import { handleImage, wheelImage } from "../../common/view/images.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { SHIFT_KEY_SPEED_DIVISOR } from "../../FluidPressureAndFlowConstants.js";
import { HOLE_SIZE, MAX_TANK_BASE_Y, MIN_TANK_BASE_Y, TANK_HEIGHT, type WaterTower } from "../model/WaterTower.js";

/** How far the legs splay out from the tank wall, metres. */
const LEG_SPLAY = 3;

/** Thickness of the tank wall and the legs, view pixels. */
const STRUCTURE_LINE_WIDTH = 4;

/** Thickness of the cross-bracing between the legs. Thinner than the legs it braces. */
const BRACE_LINE_WIDTH = 2;

/** Height of the lid on top of the tank, view pixels. */
const LID_HEIGHT = 10;

/** Metres the tank moves per arrow-key press. */
const KEYBOARD_DRAG_SPEED = 4;

/** How far the lid overhangs the tank wall on each side, view pixels. */
const LID_OVERHANG = 3;

/** Scale for the tank-lift handle bitmap. */
const HANDLE_SCALE = 0.45;

/** Scale for the sluice wheel bitmap. */
const WHEEL_SCALE = 0.4;

/** Width of the sluice gate, view pixels. */
const GATE_WIDTH = 5;

/** Height of the sluice gate, relative to the hole size. */
const GATE_HEIGHT_RATIO = 2.5;

/** View pixels the gate drops past the hole when fully open (PhET HTML5 port). */
const GATE_OPEN_VIEW_NUDGE = 5;

export class WaterTowerNode extends Node {
  private readonly disposeWaterTowerNode: () => void;

  public constructor(
    waterTower: WaterTower,
    fluidDensityProperty: NumberProperty,
    modelViewTransform: ModelViewTransform2,
    tankAccessibleName: TReadOnlyProperty<string>,
    sluiceAccessibleName: TReadOnlyProperty<string>,
  ) {
    super();

    const legs = new Path(null, {
      stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
      lineWidth: STRUCTURE_LINE_WIDTH,
    });
    const braces = new Path(null, {
      stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
      lineWidth: BRACE_LINE_WIDTH,
    });
    const water = new Path(null, { fill: getFluidColor(fluidDensityProperty.value).toCSS() });
    // The body is filled, the wall is only stroked, and the wall is drawn over
    // the water — so the tank still reads as a container when it is full.
    const tankBody = new Path(null, { fill: FluidPressureAndFlowColors.poolLiningColorProperty });
    const tankWall = new Path(null, {
      stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
      lineWidth: STRUCTURE_LINE_WIDTH,
    });
    const lid = new Rectangle(0, 0, 0, 0, {
      fill: FluidPressureAndFlowColors.towerTrimColorProperty,
      stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
      lineWidth: 2,
    });
    const rope = new Path(null, {
      stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
      lineWidth: 1,
    });
    const sluiceGate = new Rectangle(0, 0, GATE_WIDTH, 0, {
      fill: new LinearGradient(0, 0, GATE_WIDTH, 0)
        .addColorStop(0, FluidPressureAndFlowColors.sluiceGateEdgeColorProperty)
        .addColorStop(0.5, FluidPressureAndFlowColors.sluiceGateHighlightColorProperty)
        .addColorStop(0.7, FluidPressureAndFlowColors.sluiceGateShadeColorProperty)
        .addColorStop(1, FluidPressureAndFlowColors.sluiceGateEdgeColorProperty),
      stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
      lineWidth: 0.5,
      cursor: "ns-resize",
      tagName: "div",
      focusable: true,
      accessibleName: sluiceAccessibleName,
    });
    const wheel = new Image(wheelImage, {
      scale: WHEEL_SCALE,
      cursor: "ns-resize",
    });
    const handle = new Image(handleImage, {
      scale: HANDLE_SCALE,
      cursor: "ns-resize",
      tagName: "div",
      focusable: true,
      accessibleName: tankAccessibleName,
    });

    this.children = [legs, braces, tankBody, water, tankWall, lid, rope, sluiceGate, wheel, handle];

    const layout = () => {
      const base = waterTower.baseCenterProperty.value;
      const radius = waterTower.getRadius();
      const leftX = modelViewTransform.modelToViewX(base.x - radius);
      const rightX = modelViewTransform.modelToViewX(base.x + radius);
      const baseY = modelViewTransform.modelToViewY(base.y);
      const topY = modelViewTransform.modelToViewY(base.y + TANK_HEIGHT);

      tankBody.shape = Shape.rect(leftX, topY, rightX - leftX, baseY - topY);
      tankWall.shape = tankBody.shape;

      const surfaceY = modelViewTransform.modelToViewY(waterTower.getFluidSurfaceY());
      water.shape = Shape.rect(leftX, surfaceY, rightX - leftX, Math.max(0, baseY - surfaceY));
      water.fill = getFluidColor(fluidDensityProperty.value).toCSS();

      lid.setRect(leftX - LID_OVERHANG, topY - LID_HEIGHT, rightX - leftX + 2 * LID_OVERHANG, LID_HEIGHT);

      // Legs from the tank's underside out to the ground, splayed for stability.
      const groundY = modelViewTransform.modelToViewY(0);
      const legShape = new Shape();
      const legTopX: number[] = [];
      const legBottomX: number[] = [];
      for (const side of [-1, 1]) {
        const topX = modelViewTransform.modelToViewX(base.x + (side * radius) / 2);
        const bottomX = modelViewTransform.modelToViewX(base.x + side * (radius / 2 + LEG_SPLAY));
        legTopX.push(topX);
        legBottomX.push(bottomX);
        legShape.moveTo(topX, baseY);
        legShape.lineTo(bottomX, groundY);
      }
      legs.shape = legShape;

      // A horizontal beam and an X between the legs, so the tower reads as a
      // braced structure standing up to the weight rather than two bent sticks.
      const beamY = (baseY + groundY) / 2;
      const braceShape = new Shape();
      const edgeAt = (side: 0 | 1, y: number) => {
        const fraction = (y - baseY) / (groundY - baseY);
        return (legTopX[side] as number) + ((legBottomX[side] as number) - (legTopX[side] as number)) * fraction;
      };
      braceShape.moveTo(edgeAt(0, beamY), beamY);
      braceShape.lineTo(edgeAt(1, beamY), beamY);
      braceShape.moveTo(legTopX[0] as number, baseY);
      braceShape.lineTo(legBottomX[1] as number, groundY);
      braceShape.moveTo(legTopX[1] as number, baseY);
      braceShape.lineTo(legBottomX[0] as number, groundY);
      braces.shape = braceShape;

      handle.centerX = (leftX + rightX) / 2;
      handle.top = baseY;

      wheel.right = rightX + 3;
      wheel.bottom = topY;

      const holeViewSize = modelViewTransform.modelToViewDeltaX(HOLE_SIZE);
      const gateHeight = holeViewSize * GATE_HEIGHT_RATIO;
      sluiceGate.setRect(0, 0, GATE_WIDTH, gateHeight);
      sluiceGate.left = rightX;

      const gateDrop = gateOffsetProperty.value.y;
      sluiceGate.bottom =
        baseY + modelViewTransform.modelToViewDeltaY(gateDrop) - (gateDrop > 0 ? GATE_OPEN_VIEW_NUDGE : 0);

      const tankViewHeight = baseY - topY;
      const ropeLength = tankViewHeight - Math.abs(modelViewTransform.modelToViewDeltaX(HOLE_SIZE * 1.5));
      rope.shape = Shape.lineSegment(0, ropeLength, 0, 0);
      rope.right = wheel.right;
      rope.top = wheel.bottom;
    };

    /** Metres the gate drops when the hole is fully open. */
    const gateOpenY = HOLE_SIZE;
    const gateOffsetProperty = new Property(new Vector2(0, 0));

    const layoutMultilink = Multilink.multilinkAny(
      [
        waterTower.baseCenterProperty,
        waterTower.fluidVolumeProperty,
        waterTower.capacityProperty,
        waterTower.isHoleOpenProperty,
        gateOffsetProperty,
        fluidDensityProperty,
      ],
      layout,
    );

    // ── Dragging the tank ─────────────────────────────────────────────────────
    const tankDragBounds = new Bounds2(0, MIN_TANK_BASE_Y, 0, MAX_TANK_BASE_Y);
    const tankDragBoundsProperty = new Property(tankDragBounds);

    const tankDragListener = new DragListener({
      positionProperty: waterTower.baseCenterProperty,
      transform: modelViewTransform,
      useParentOffset: true,
      dragBoundsProperty: tankDragBoundsProperty,
    });
    handle.addInputListener(tankDragListener);

    const tankKeyboardListener = new KeyboardDragListener({
      positionProperty: waterTower.baseCenterProperty,
      transform: modelViewTransform,
      dragBoundsProperty: tankDragBoundsProperty,
      dragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED),
      shiftDragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED) / SHIFT_KEY_SPEED_DIVISOR,
    });
    handle.addInputListener(tankKeyboardListener);

    // ── Raising and lowering the sluice gate ─────────────────────────────────
    // The gate is all-or-nothing: a partly open hole would make the outlet area
    // a hidden extra variable, which is exactly what the design set out to avoid.

    /** Where the gate rests when the hole is open, and when it is shut. */
    const restingGateOffset = (isOpen: boolean) => new Vector2(0, isOpen ? gateOpenY : 0);

    // The two properties drive each other, so each direction locks the other out for
    // the duration of its write rather than relying on the values happening to settle.
    let isSyncing = false;

    const applyGateOffset = (offset: Vector2) => {
      if (isSyncing) {
        return;
      }
      isSyncing = true;
      waterTower.isHoleOpenProperty.value = offset.y > HOLE_SIZE / 2;
      isSyncing = false;
    };
    gateOffsetProperty.link(applyGateOffset);

    // Anything that opens or shuts the hole without dragging the gate — a reset, or
    // the sluice toggle — has to bring the drag position with it, or the next drag
    // would measure its offset from a place the gate is no longer drawn.
    const syncGateOffset = (isOpen: boolean) => {
      if (isSyncing) {
        return;
      }
      isSyncing = true;
      gateOffsetProperty.value = restingGateOffset(isOpen);
      isSyncing = false;
    };
    waterTower.isHoleOpenProperty.link(syncGateOffset);

    const gateDragListener = new DragListener({
      positionProperty: gateOffsetProperty,
      transform: modelViewTransform,
      useParentOffset: true,
      dragBoundsProperty: new Property(new Bounds2(0, 0, 0, gateOpenY)),
      end: () => {
        // Snap to whichever end it is nearer, so it never rests half-way.
        gateOffsetProperty.value = restingGateOffset(waterTower.isHoleOpenProperty.value);
      },
    });
    sluiceGate.addInputListener(gateDragListener);
    wheel.addInputListener(gateDragListener);
    sluiceGate.addInputListener({
      click: () => {
        waterTower.isHoleOpenProperty.value = !waterTower.isHoleOpenProperty.value;
      },
    });
    wheel.addInputListener({
      click: () => {
        waterTower.isHoleOpenProperty.value = !waterTower.isHoleOpenProperty.value;
      },
    });
    const gateKeyboardListener = new KeyboardListener({
      keys: ["enter", "space"],
      fire: () => {
        waterTower.isHoleOpenProperty.value = !waterTower.isHoleOpenProperty.value;
      },
    });
    sluiceGate.addInputListener(gateKeyboardListener);

    this.disposeWaterTowerNode = () => {
      layoutMultilink.dispose();
      gateOffsetProperty.unlink(applyGateOffset);
      waterTower.isHoleOpenProperty.unlink(syncGateOffset);
      tankDragListener.dispose();
      tankKeyboardListener.dispose();
      gateDragListener.dispose();
      gateKeyboardListener.dispose();
    };
  }

  public override dispose(): void {
    this.disposeWaterTowerNode();
    super.dispose();
  }
}
