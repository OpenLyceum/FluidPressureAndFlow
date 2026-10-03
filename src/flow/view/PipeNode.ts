/**
 * PipeNode.ts
 *
 * The Flow pipe: bitmap heads at each end, a spline middle section with fluid
 * fill and a brown wall stroke, and a layer for tracers between the fill and
 * the wall — matching the layering in PhET's HTML5 build so particles read as
 * inside the pipe rather than painted over it.
 */

import { Multilink, type NumberProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Image, Node, Path } from "scenerystack/scenery";
import { getFluidColor } from "../../common/model/fluidColor.js";
import { pipeLeftBackImage, pipeLeftFrontImage, pipeRightImage, pipeSegmentImage } from "../../common/view/images.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { FLOW_PARTICLE_CANVAS_BOUNDS } from "../../FluidPressureAndFlowConstants.js";
import type { FlowModel } from "../model/FlowModel.js";
import type { Pipe, WallSample } from "../model/Pipe.js";
import { ParticleCanvasNode } from "./ParticleCanvasNode.js";
import { getPipeEndLayout, PIPE_HEAD_X_SCALE } from "./pipeEndLayout.js";

const MIDDLE_WALL_LINE_WIDTH = 8;

/** Horizontal stretch of the repeating pipe-segment bitmap off-screen. */
const PIPE_SEGMENT_X_SCALE = 100;

/**
 * Gap between the left head and the repeating segment, in unscaled bitmap
 * pixels: both live inside the head assembly, which is scaled as a whole.
 */
const LEFT_SEGMENT_GAP = 30;

/** Overlap between the right head and the repeating segment, same frame as above. */
const RIGHT_SEGMENT_OVERLAP = 50;

export class PipeNode extends Node {
  private readonly disposePipeNode: () => void;

  /** Front left head; exposed so end handles can snap to its bounds. */
  public readonly leftPipeFront: Node;

  /** Right head; exposed so end handles can snap to its bounds. */
  public readonly rightPipe: Node;

  /**
   * Layer between the fluid fill and the wall stroke. The flux-meter back ring
   * is parented here so tracers pass in front of it.
   */
  public readonly preParticleLayer = new Node();

  public readonly particleCanvas: ParticleCanvasNode;

  public constructor(
    model: FlowModel,
    pipe: Pipe,
    fluidDensityProperty: NumberProperty,
    modelViewTransform: ModelViewTransform2,
  ) {
    super();

    const leftSection = pipe.crossSections[0] as (typeof pipe.crossSections)[number];
    const rightSection = pipe.crossSections[pipe.crossSections.length - 1] as (typeof pipe.crossSections)[number];

    const leftPipeHead = new Image(pipeLeftFrontImage);
    const leftPipeSegment = new Image(pipeSegmentImage, {
      right: leftPipeHead.left + LEFT_SEGMENT_GAP,
      scale: new Vector2(PIPE_SEGMENT_X_SCALE, 1),
    });
    this.leftPipeFront = new Node({
      children: [leftPipeHead, leftPipeSegment],
    });

    const leftPipeBack = new Image(pipeLeftBackImage);

    const rightPipeHead = new Image(pipeRightImage);
    const rightPipeSegment = new Image(pipeSegmentImage, {
      left: rightPipeHead.right - RIGHT_SEGMENT_OVERLAP,
      scale: new Vector2(PIPE_SEGMENT_X_SCALE, 1),
    });
    this.rightPipe = new Node({
      children: [rightPipeHead, rightPipeSegment],
    });

    const fluid = new Path(null, {
      stroke: FluidPressureAndFlowColors.pipeWallColorProperty,
      lineWidth: 0,
      fill: getFluidColor(fluidDensityProperty.value).toCSS(),
    });

    const wall = new Path(null, {
      stroke: FluidPressureAndFlowColors.pipeWallColorProperty,
      lineWidth: MIDDLE_WALL_LINE_WIDTH,
    });

    this.particleCanvas = new ParticleCanvasNode(model, modelViewTransform, FLOW_PARTICLE_CANVAS_BOUNDS);

    const updateMiddleShape = () => {
      const shapes = buildMiddlePipeShapes(pipe.getWall(), modelViewTransform);
      fluid.shape = shapes.fluid;
      wall.shape = shapes.wall;
      fluid.fill = getFluidColor(fluidDensityProperty.value).toCSS();
    };

    const updateLeftPipe = () => {
      const layout = getPipeEndLayout(leftSection, modelViewTransform);
      this.leftPipeFront.setScaleMagnitude(PIPE_HEAD_X_SCALE, layout.scaleY);
      // Align the mouth with the end control point, allowing the sampled wall
      // extension to overlap the bitmap rim instead of leaving a ground gap.
      this.leftPipeFront.x = layout.viewX - leftPipeHead.width * PIPE_HEAD_X_SCALE;
      this.leftPipeFront.y = layout.viewY;
      leftPipeBack.setScaleMagnitude(PIPE_HEAD_X_SCALE, layout.scaleY);
      leftPipeBack.x = this.leftPipeFront.x;
      leftPipeBack.y = layout.viewY;
    };

    const updateRightPipe = () => {
      const layout = getPipeEndLayout(rightSection, modelViewTransform);
      this.rightPipe.setScaleMagnitude(PIPE_HEAD_X_SCALE, layout.scaleY);
      this.rightPipe.y = layout.viewY;
      this.rightPipe.x = layout.viewX;
    };

    const shapeMultilink = Multilink.multilinkAny([pipe.shapeVersionProperty, fluidDensityProperty], () => {
      updateMiddleShape();
      updateLeftPipe();
      updateRightPipe();
    });

    updateMiddleShape();
    updateLeftPipe();
    updateRightPipe();

    this.children = [
      leftPipeBack,
      fluid,
      this.preParticleLayer,
      this.particleCanvas,
      wall,
      this.rightPipe,
      this.leftPipeFront,
    ];

    this.disposePipeNode = () => {
      shapeMultilink.dispose();
    };
  }

  public override dispose(): void {
    this.disposePipeNode();
    super.dispose();
  }
}

function buildMiddlePipeShapes(
  wall: readonly WallSample[],
  modelViewTransform: ModelViewTransform2,
): { fluid: Shape; wall: Shape } {
  const fluidShape = new Shape();
  const wallShape = new Shape();
  const first = wall[0] as WallSample;
  const firstX = modelViewTransform.modelToViewX(first.x);
  const firstY = modelViewTransform.modelToViewY(first.bottomY);
  fluidShape.moveTo(firstX, firstY);
  wallShape.moveTo(firstX, firstY);

  for (let i = 1; i < wall.length; i++) {
    const sample = wall[i] as WallSample;
    const x = modelViewTransform.modelToViewX(sample.x);
    const y = modelViewTransform.modelToViewY(sample.bottomY);
    fluidShape.lineTo(x, y);
    wallShape.lineTo(x, y);
  }

  for (let i = wall.length - 1; i >= 0; i--) {
    const sample = wall[i] as WallSample;
    const x = modelViewTransform.modelToViewX(sample.x);
    const y = modelViewTransform.modelToViewY(sample.topY);
    fluidShape.lineTo(x, y);
    // The pipe is open at its ends; a vertical stroke would cap the water
    // before it reaches the fitting. Only the ceiling and floor have walls.
    if (i === wall.length - 1) {
      wallShape.moveTo(x, y);
    } else {
      wallShape.lineTo(x, y);
    }
  }
  fluidShape.close();
  return { fluid: fluidShape, wall: wallShape };
}
