/**
 * createWaterTowerToolIcons.ts
 *
 * Small pictorial icons for the Water Tower control-panel checkboxes, copied
 * from PhET's HTML5 ToolsControlPanel and Java WaterTowerControlPanel.
 */

import { Shape } from "scenerystack/kite";
import { HBox, HStrut, Image, type Node, Path } from "scenerystack/scenery";
import { measuringTape_png, PhetFont, RulerNode } from "scenerystack/scenery-phet";
import { nozzleImage } from "../../common/view/images.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";

/** Miniature ruler beside the ruler checkbox. */
export function createRulerIcon(): Node {
  return new RulerNode(30, 20, 15, ["0", "1", "2"], "", {
    insetsWidth: 7,
    minorTicksPerMajorTick: 4,
    majorTickFont: new PhetFont(12),
    clipArea: Shape.rect(-1, -1, 44, 22),
  });
}

/** Measuring-tape coil with the orange crosshair PhET uses. */
export function createMeasuringTapeIcon(): Node {
  const icon = new Image(measuringTape_png, { scale: 0.6 });
  const crosshairSize = 5;
  icon.addChild(
    new Path(
      new Shape().moveTo(-crosshairSize, 0).lineTo(crosshairSize, 0).moveTo(0, -crosshairSize).lineTo(0, crosshairSize),
      {
        stroke: FluidPressureAndFlowColors.measuringTapeCrosshairColorProperty,
        lineWidth: 2,
        left: icon.right + 12,
        top: icon.bottom + 12,
      },
    ),
  );
  return icon;
}

/** Curved green hose with the nozzle bitmap, as in PhET's panel icon. */
export function createHoseIcon(): Node {
  const icon = new Path(
    new Shape()
      .moveTo(0, 0)
      .arc(-16, 8, 8, -Math.PI / 2, Math.PI / 2, true)
      .lineTo(10, 16)
      .lineTo(10, 0)
      .lineTo(0, 0),
    {
      stroke: FluidPressureAndFlowColors.hoseStrokeColorProperty,
      lineWidth: 1,
      fill: FluidPressureAndFlowColors.hoseFillColorProperty,
    },
  );
  icon.addChild(
    new Image(nozzleImage, {
      rotation: Math.PI / 2,
      scale: 0.8,
      left: icon.right,
      bottom: icon.bottom + 3,
    }),
  );
  return icon;
}

/** Label on the left, icon on the right, padded to a shared width. */
export function createLabeledToolRow(label: Node, icon: Node, rowWidth: number): HBox {
  const contentWidth = label.width + icon.width;
  const strutWidth = Math.max(5, rowWidth - contentWidth);
  return new HBox({
    spacing: 5,
    align: "center",
    children: [label, new HStrut(strutWidth), icon],
  });
}
