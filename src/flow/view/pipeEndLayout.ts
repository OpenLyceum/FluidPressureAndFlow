/**
 * pipeEndLayout.ts
 *
 * Shared layout math for the bitmap pipe heads at each end of the Flow pipe.
 * PhET scales the head images vertically with the end cross-section height and
 * pins their y to the top control point; the scaling constants here are taken
 * from the HTML5 reference in totality. Mouths align horizontally with the end
 * control points through the same transform used to draw the spline.
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import type { PipeCrossSection } from "../model/PipeCrossSection.js";

/**
 * Horizontal scale applied to every pipe-head bitmap. Tracks FLOW_VIEW_SCALE:
 * the head has to be as tall as the pipe mouth it caps, and the mouth's height
 * in view pixels is its height in metres times that scale.
 */
export const PIPE_HEAD_X_SCALE = 0.48;

/** Reference cross-section height used to compute the vertical head scale (PhET: 2.1 m). */
export const PIPE_REFERENCE_HEIGHT = 2.1;

/** Smallest allowed vertical scale for a pipe head. */
export const MIN_PIPE_HEAD_SCALE = 0.24;

/**
 * Offset from the top control point to the pipe-head node origin, in unscaled
 * bitmap pixels — it is multiplied by the head's own scale below, so it does not
 * move with the layout bounds.
 */
export const LEFT_PIPE_Y_OFFSET = 30;

export type PipeEndLayout = {
  readonly scaleY: number;
  readonly viewX: number;
  readonly viewY: number;
};

export function getPipeEndLayout(section: PipeCrossSection, modelViewTransform: ModelViewTransform2): PipeEndLayout {
  const scaleY = Math.max((section.getHeight() / PIPE_REFERENCE_HEIGHT) * PIPE_HEAD_X_SCALE, MIN_PIPE_HEAD_SCALE);
  const viewY = modelViewTransform.modelToViewY(section.topYProperty.value) - LEFT_PIPE_Y_OFFSET * scaleY;
  return { scaleY, viewX: modelViewTransform.modelToViewX(section.x), viewY };
}
