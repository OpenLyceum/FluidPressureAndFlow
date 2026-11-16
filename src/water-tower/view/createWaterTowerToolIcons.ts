import { CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS } from "../../FluidPressureAndFlowConstants.js";
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
    majorTickFont: new PhetFont(CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.CREATE_RULER_ICON_FONT_SIZE),
    clipArea: Shape.rect(
      -1,
      -1,
      CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.CREATE_RULER_ICON_WIDTH,
      CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.CREATE_RULER_ICON_HEIGHT,
    ),
  });
}

/** Measuring-tape coil with the orange crosshair PhET uses. */
export function createMeasuringTapeIcon(): Node {
  const icon = new Image(measuringTape_png, { scale: CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.ICON_SCALE });
  const crosshairSize: number = CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.CROSSHAIR_SIZE;
  icon.addChild(
    new Path(
      new Shape().moveTo(-crosshairSize, 0).lineTo(crosshairSize, 0).moveTo(0, -crosshairSize).lineTo(0, crosshairSize),
      {
        stroke: FluidPressureAndFlowColors.measuringTapeCrosshairColorProperty,
        lineWidth: CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.CREATE_MEASURING_TAPE_ICON_LINE_WIDTH,
        left: icon.right + CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.CREATE_MEASURING_TAPE_ICON_LEFT_OFFSET,
        top: icon.bottom + CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.CREATE_MEASURING_TAPE_ICON_TOP_OFFSET,
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
      .arc(
        CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.ICON_CENTER_X,
        CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.ICON_CENTER_Y,
        CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.ICON_RADIUS,
        -Math.PI / 2,
        Math.PI / 2,
        true,
      )
      .lineTo(CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.ICON_X, CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.ICON_Y)
      .lineTo(CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.ICON_X, 0)
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
      scale: CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.CREATE_HOSE_ICON_SCALE,
      left: icon.right,
      bottom: icon.bottom + CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.CREATE_HOSE_ICON_BOTTOM_OFFSET,
    }),
  );
  return icon;
}

/** Label on the left, icon on the right, padded to a shared width. */
export function createLabeledToolRow(label: Node, icon: Node, rowWidth: number): HBox {
  const contentWidth = label.width + icon.width;
  const strutWidth = Math.max(5, rowWidth - contentWidth);
  return new HBox({
    spacing: CREATE_WATER_TOWER_TOOL_ICONS_SETTINGS.CREATE_LABELED_TOOL_ROW_SPACING,
    align: "center",
    children: [label, new HStrut(strutWidth), icon],
  });
}
