import { POOL_GRID_NODE_SETTINGS } from "../../FluidPressureAndFlowConstants.js";
/**
 * PoolGridNode.ts
 *
 * An optional grid of depth lines over a pool, labelled in the current units.
 *
 * Without it a student reading "pressure rises with depth" off a barometer has
 * to eyeball how far they moved the probe. The grid turns that into a count, and
 * the count is what makes the *linearity* visible rather than merely the trend.
 *
 * Lines are drawn every half metre with the whole metres labelled, and the
 * labels re-render in feet when the units change — which is also why the spacing
 * stays metric-derived: a grid that resampled itself into whole feet would move
 * under the student mid-measurement.
 */

import { type EnumerationProperty, Multilink } from "scenerystack/axon";
import type { Bounds2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node, Path, Text } from "scenerystack/scenery";
import { formatValue, type UnitLabelGroups, type UnitSystem } from "../../common/model/units.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { MAX_POOL_HEIGHT } from "../../FluidPressureAndFlowConstants.js";

/** Vertical spacing between grid lines, metres. */
const MINOR_SPACING: number = POOL_GRID_NODE_SETTINGS.MINOR_SPACING;

/** Every this many lines gets a label. */
const LINES_PER_LABEL: number = POOL_GRID_NODE_SETTINGS.LINES_PER_LABEL;

/** Slack added to the loop bound so float error doesn't drop the last grid line. */
const LOOP_EPSILON: number = POOL_GRID_NODE_SETTINGS.LOOP_EPSILON;

export class PoolGridNode extends Node {
  private readonly disposePoolGridNode: () => void;

  /**
   * @param poolBounds - the vessel's extent in model coordinates
   * @param unitSystemProperty - which units the depth labels use
   * @param unitLabelGroups - localized unit abbreviations
   * @param modelViewTransform - model → view
   */
  public constructor(
    poolBounds: Bounds2,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    unitLabelGroups: UnitLabelGroups,
    modelViewTransform: ModelViewTransform2,
  ) {
    super();

    const lines = new Shape();
    const labelNodes: Text[] = [];
    const labelDepths: number[] = [];

    let index = 0;
    for (let depth = MINOR_SPACING; depth <= MAX_POOL_HEIGHT + LOOP_EPSILON; depth += MINOR_SPACING) {
      index++;
      const y = modelViewTransform.modelToViewY(-depth);
      lines.moveTo(modelViewTransform.modelToViewX(poolBounds.minX), y);
      lines.lineTo(modelViewTransform.modelToViewX(poolBounds.maxX), y);

      if (index % LINES_PER_LABEL === 0) {
        const label = new Text("", {
          font: "11px sans-serif",
          fill: FluidPressureAndFlowColors.gridLineColorProperty,
          left: modelViewTransform.modelToViewX(poolBounds.minX) + POOL_GRID_NODE_SETTINGS.LABEL_LEFT_OFFSET,
          bottom: y - 2,
        });
        labelNodes.push(label);
        labelDepths.push(depth);
      }
    }

    // Depends on the unit system *and* on all three abbreviations, so the labels
    // also re-render when the student switches language without touching units.
    const labelMultilink = Multilink.multilinkAny(
      [
        unitSystemProperty,
        unitLabelGroups.metric.distanceStringProperty,
        unitLabelGroups.atmospheres.distanceStringProperty,
        unitLabelGroups.english.distanceStringProperty,
      ],
      () => {
        const system = unitSystemProperty.value;
        const units = system.labels(unitLabelGroups).distanceStringProperty.value;
        labelNodes.forEach((label, i) => {
          const depth = labelDepths[i] ?? 0;
          label.string = `${formatValue(system.distance, depth)} ${units}`;
        });
      },
    );

    this.children = [
      new Path(lines, {
        stroke: FluidPressureAndFlowColors.gridLineColorProperty,
        lineWidth: 1,
        lineDash: [POOL_GRID_NODE_SETTINGS.CONSTRUCTOR_LINE_DASH_DASH, 3],
      }),
      ...labelNodes,
    ];

    this.disposePoolGridNode = () => {
      labelMultilink.dispose();
    };
  }

  public override dispose(): void {
    this.disposePoolGridNode();
    super.dispose();
  }
}
