/**
 * SceneRadioButtonGroup.ts
 *
 * Picks which pool is on screen, using a small drawing of each one rather than
 * its name.
 *
 * The scenes differ only in shape, so a shape is the honest label — and it also
 * sidesteps the problem that "chamber pool" means nothing to a student who has
 * not yet seen one. The names are still carried as accessible labels, where they
 * are the only thing that can be read aloud.
 *
 * Each icon is a miniature of the scene rather than a bare outline: sky, ground,
 * and a half-filled pool. A student picking between four buttons is matching them
 * against the picture they are looking at, and an outline on a white field is not
 * that picture. PhET uses screenshots here; these are drawn, so they follow the
 * colour profile and stay sharp at any resolution.
 */

import type { EnumerationProperty, TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Node, Path, Rectangle, Text } from "scenerystack/scenery";
import { RectangularRadioButtonGroup } from "scenerystack/sun";
import { getFluidColor, MYSTERY_FLUID_COLORS } from "../../common/model/fluidColor.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { PANEL_CORNER_RADIUS, WATER_DENSITY } from "../../FluidPressureAndFlowConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { PoolScene, type PoolSceneLabelProperties } from "../model/PoolScene.js";

/**
 * Size of one scene icon, view pixels. Four of these plus their button chrome
 * have to stack between the ground line and the bottom of the play area.
 */
const ICON_WIDTH = 50;
const ICON_HEIGHT = 40;

/** View y within an icon of its ground line. */
const ICON_GROUND_Y = 10;

/** How full each icon's pool is drawn, as a fraction of its depth. */
const ICON_FILL_FRACTION = 0.55;

/** Horizontal gap between the square icon's basin and the icon's own edges. */
const SQUARE_ICON_SIDE_MARGIN = 12;

/** Font for the mystery icon's "?" glyph. */
const MYSTERY_GLYPH_FONT = "bold 16px sans-serif";

export class SceneRadioButtonGroup extends RectangularRadioButtonGroup<PoolScene> {
  public constructor(
    sceneProperty: EnumerationProperty<PoolScene>,
    sceneLabels: PoolSceneLabelProperties,
    accessibleName: TReadOnlyProperty<string>,
  ) {
    super(
      sceneProperty,
      [
        {
          value: PoolScene.SQUARE,
          createNode: () => createIcon(squareIconShape()),
          options: { accessibleName: sceneLabels.squareStringProperty },
        },
        {
          value: PoolScene.TRAPEZOID,
          createNode: () => createIcon(trapezoidIconShape()),
          options: { accessibleName: sceneLabels.trapezoidStringProperty },
        },
        {
          value: PoolScene.CHAMBER,
          createNode: () => createIcon(chamberIconShape()),
          options: { accessibleName: sceneLabels.chamberStringProperty },
        },
        {
          value: PoolScene.MYSTERY,
          createNode: () => createIcon(squareIconShape(), true),
          options: { accessibleName: sceneLabels.mysteryStringProperty },
        },
      ],
      {
        orientation: "vertical",
        spacing: 6,
        accessibleName: accessibleName,
        radioButtonOptions: {
          baseColor: FluidPressureAndFlowColors.controlSurfaceColorProperty,
          cornerRadius: PANEL_CORNER_RADIUS,
          xMargin: 3,
          yMargin: 3,
          buttonAppearanceStrategyOptions: {
            selectedStroke: FluidPressureAndFlowColors.accentColorProperty,
            selectedLineWidth: 3,
            deselectedLineWidth: 1,
          },
        },
      },
    );
  }
}

/** Bottom of every icon's pool, leaving a little ground beneath it. */
const ICON_POOL_BOTTOM = ICON_HEIGHT - 6;

/** A plain rectangular basin. */
function squareIconShape(): Shape {
  return Shape.rect(
    SQUARE_ICON_SIDE_MARGIN,
    ICON_GROUND_Y,
    ICON_WIDTH - 2 * SQUARE_ICON_SIDE_MARGIN,
    ICON_POOL_BOTTOM - ICON_GROUND_Y,
  );
}

/** Two chambers with opposite taper, joined along the floor. */
function trapezoidIconShape(): Shape {
  const bottom = ICON_POOL_BOTTOM;
  const top = ICON_GROUND_Y;
  const left = Shape.polygon([
    new Vector2(10, top),
    new Vector2(5, bottom),
    new Vector2(20, bottom),
    new Vector2(17, top),
  ]);
  const right = Shape.polygon([
    new Vector2(27, top),
    new Vector2(31, bottom),
    new Vector2(45, bottom),
    new Vector2(40, top),
  ]);
  return left.shapeUnion(right).shapeUnion(Shape.rect(10, bottom - 5, 30, 5));
}

/** A narrow shaft and a wide one over a linked pair of chambers. */
function chamberIconShape(): Shape {
  const bottom = ICON_POOL_BOTTOM;
  const top = ICON_GROUND_Y;
  return Shape.rect(11, top, 5, bottom - top)
    .shapeUnion(Shape.rect(27, top, 14, bottom - top))
    .shapeUnion(Shape.rect(7, bottom - 7, 37, 7));
}

/**
 * Wraps a pool outline in a fixed-size tile of sky and ground, so all four
 * buttons come out the same size regardless of how much of it their shape fills,
 * and each one reads as the scene it selects.
 */
function createIcon(shape: Shape, isMystery = false): Node {
  const sky = new Rectangle(0, 0, ICON_WIDTH, ICON_GROUND_Y, {
    fill: FluidPressureAndFlowColors.backgroundColorProperty,
  });
  const ground = new Rectangle(0, ICON_GROUND_Y, ICON_WIDTH, ICON_HEIGHT - ICON_GROUND_Y, {
    fill: FluidPressureAndFlowColors.earthTopColorProperty,
  });

  const lining = new Path(shape, {
    fill: FluidPressureAndFlowColors.poolLiningColorProperty,
    stroke: FluidPressureAndFlowColors.poolEdgeColorProperty,
    lineWidth: 1,
  });

  // The water is the pool shape clipped to its lower part, so a partly full pool
  // is drawn the same way here as it is in the scene itself.
  const poolBounds = shape.getBounds();
  const waterTop = poolBounds.maxY - poolBounds.height * ICON_FILL_FRACTION;
  const water = new Path(
    shape.shapeIntersection(Shape.rect(poolBounds.minX, waterTop, poolBounds.width, poolBounds.maxY - waterTop)),
    {
      fill: isMystery
        ? (MYSTERY_FLUID_COLORS[0]?.toCSS() ?? FluidPressureAndFlowColors.mysteryFluidColorProperty)
        : getFluidColor(WATER_DENSITY).toCSS(),
    },
  );

  const children: Node[] = [sky, ground, lining, water];

  if (isMystery) {
    children.push(
      new Text(StringManager.getInstance().getUnderPressureStrings().mysteryGlyphStringProperty, {
        font: MYSTERY_GLYPH_FONT,
        fill: FluidPressureAndFlowColors.textColorProperty,
        centerX: ICON_WIDTH / 2,
        centerY: (ICON_GROUND_Y + ICON_HEIGHT) / 2,
      }),
    );
  }

  return new Node({ children: children });
}
