import { SLUICE_CONTROL_PANEL_SETTINGS } from "../../FluidPressureAndFlowConstants.js";
/**
 * SluiceControlPanel.ts
 *
 * A two-option switch for opening and closing the sluice gate at the base of
 * the tank. Each option is a miniature of the tower — closed with the gate
 * covering the hole, open with water leaving — so a student can match the
 * control to what they see in the play area.
 *
 * PhET's HTML5 port used an ABSwitch here; this panel follows that pattern.
 */

import type { BooleanProperty, TReadOnlyProperty } from "scenerystack/axon";
import { linear } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { type Node, Path, Rectangle } from "scenerystack/scenery";
import { ABSwitch } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { FluidPressureAndFlowPanel } from "../../common/FluidPressureAndFlowPanel.js";
import { getFluidColor } from "../../common/view/fluidColor.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { PANEL_CORNER_RADIUS, WATER_DENSITY } from "../../FluidPressureAndFlowConstants.js";

const OPTION_WIDTH: number = SLUICE_CONTROL_PANEL_SETTINGS.OPTION_WIDTH;
const OPTION_HEIGHT: number = SLUICE_CONTROL_PANEL_SETTINGS.OPTION_HEIGHT;
const TANK_SIZE = OPTION_WIDTH * 0.33;
const LEG_WIDTH = 1;
const CROSSBEAM_WIDTH = 1;

export type SluiceControlPanelAccessibleNames = {
  readonly sluiceControlStringProperty: TReadOnlyProperty<string>;
  readonly sluiceClosedStringProperty: TReadOnlyProperty<string>;
  readonly sluiceOpenStringProperty: TReadOnlyProperty<string>;
};

export class SluiceControlPanel extends FluidPressureAndFlowPanel {
  public constructor(isHoleOpenProperty: BooleanProperty, accessibleNames: SluiceControlPanelAccessibleNames) {
    const closedOption = createOption(false);
    const openOption = createOption(true);

    super(
      new ABSwitch(isHoleOpenProperty, false, closedOption, true, openOption, {
        tandem: Tandem.OPT_OUT,
        valueAAccessibleName: accessibleNames.sluiceClosedStringProperty,
        valueBAccessibleName: accessibleNames.sluiceOpenStringProperty,
      }),
      { accessibleName: accessibleNames.sluiceControlStringProperty },
    );
  }
}

function createOption(isOpen: boolean): Node {
  const frame = new Rectangle(0, 0, OPTION_WIDTH, OPTION_HEIGHT, PANEL_CORNER_RADIUS, PANEL_CORNER_RADIUS, {
    stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
    lineWidth: 1,
    fill: FluidPressureAndFlowColors.panelBackgroundColorProperty,
    tandem: Tandem.OPT_OUT,
  });

  const legs = createLegs(frame);
  const tank = new Rectangle(0, 0, TANK_SIZE, TANK_SIZE, {
    stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
    lineWidth: 1,
    fill: getFluidColor(WATER_DENSITY).toCSS(),
    bottom: legs.top,
    left: legs.left,
  });

  frame.addChild(legs);
  frame.addChild(tank);

  if (isOpen) {
    const flow = new Path(
      new Shape()
        .moveTo(0, 0)
        .quadraticCurveTo(
          SLUICE_CONTROL_PANEL_SETTINGS.FLOW_CONTROL_X,
          0,
          SLUICE_CONTROL_PANEL_SETTINGS.FLOW_END_X,
          SLUICE_CONTROL_PANEL_SETTINGS.FLOW_END_Y,
        ),
      {
        left: tank.right - SLUICE_CONTROL_PANEL_SETTINGS.FLOW_LEFT_OFFSET,
        top: tank.bottom - SLUICE_CONTROL_PANEL_SETTINGS.FLOW_TOP_OFFSET,
        lineWidth: SLUICE_CONTROL_PANEL_SETTINGS.FLOW_LINE_WIDTH,
        stroke: getFluidColor(WATER_DENSITY).toCSS(),
      },
    );
    frame.addChild(flow);
  }

  return frame;
}

/**
 * Miniature legs matching PhET's WaterTowerLegsNode: tank sits on top, legs
 * splay to the option's bottom edge.
 */
function createLegs(frame: Rectangle): Node {
  const width = TANK_SIZE;
  const height = frame.height - TANK_SIZE;
  const leftLegTopX = width * 0.2;
  const rightLegTopX = width * 0.8;
  const legHeight = height > 0 ? height : 1;

  const leftLegX = (y: number) => linear(0, legHeight, leftLegTopX, 0, y);
  const rightLegX = (y: number) => linear(0, legHeight, rightLegTopX, width, y);

  const legShape = new Shape()
    .moveTo(leftLegX(0), 0)
    .lineTo(leftLegX(legHeight), legHeight)
    .lineTo(leftLegX(legHeight) + LEG_WIDTH, legHeight)
    .lineTo(leftLegX(0) + LEG_WIDTH, 0)
    .close()
    .moveTo(rightLegX(0), 0)
    .lineTo(rightLegX(legHeight), legHeight)
    .lineTo(rightLegX(legHeight) - LEG_WIDTH, legHeight)
    .lineTo(rightLegX(0) - LEG_WIDTH, 0)
    .close();

  const crossbeam = (leftY: number, rightY: number) => {
    legShape.moveTo(leftLegX(leftY), leftY);
    legShape.lineTo(rightLegX(rightY), rightY);
  };
  crossbeam(legHeight * 0.9, legHeight * 0.7);
  crossbeam(legHeight * 0.7, legHeight * 0.9);
  crossbeam(legHeight * 0.5, legHeight * 0.3);
  crossbeam(legHeight * 0.3, legHeight * 0.5);

  return new Path(legShape, {
    stroke: FluidPressureAndFlowColors.towerStructureColorProperty,
    lineWidth: CROSSBEAM_WIDTH,
    fill: FluidPressureAndFlowColors.towerStructureColorProperty,
    bottom: frame.bottom,
    left: frame.centerX - TANK_SIZE / 2,
  });
}
