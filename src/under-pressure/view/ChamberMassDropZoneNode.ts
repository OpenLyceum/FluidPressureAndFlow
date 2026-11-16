import { CHAMBER_MASS_DROP_ZONE_NODE_SETTINGS } from "../../FluidPressureAndFlowConstants.js";
/**
 * ChamberMassDropZoneNode.ts
 *
 * Dashed drop target shown while a weight is being dragged over the chamber
 * pool's narrow column — the pink outline from the published sim.
 */

import { Multilink } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node, Path } from "scenerystack/scenery";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import {
  CHAMBER_LEFT_OPENING_CENTER_X,
  CHAMBER_LEFT_OPENING_WIDTH,
  type ChamberPoolModel,
} from "../model/ChamberPoolModel.js";

/** Height of the drop zone above the water surface, metres — fits one large block. */
const DROP_ZONE_HEIGHT: number = CHAMBER_MASS_DROP_ZONE_NODE_SETTINGS.DROP_ZONE_HEIGHT;

export class ChamberMassDropZoneNode extends Node {
  private readonly disposeChamberMassDropZoneNode: () => void;

  public constructor(chamberPool: ChamberPoolModel, modelViewTransform: ModelViewTransform2) {
    super({ visible: false });

    const outline = new Path(null, {
      stroke: FluidPressureAndFlowColors.textColorProperty,
      lineWidth: CHAMBER_MASS_DROP_ZONE_NODE_SETTINGS.OUTLINE_LINE_WIDTH,
      lineDash: [
        CHAMBER_MASS_DROP_ZONE_NODE_SETTINGS.OUTLINE_LINE_DASH_DASH,
        CHAMBER_MASS_DROP_ZONE_NODE_SETTINGS.CONSTRUCTOR_OUTLINE_LINE_DASH_DASH,
      ],
      fill: FluidPressureAndFlowColors.dropZoneFillColorProperty,
    });

    this.children = [outline];

    const updateOutline = () => {
      const isDragging = chamberPool.masses.some((mass) => mass.isDraggingProperty.value);
      this.visible = isDragging;

      if (!isDragging) {
        return;
      }

      const surfaceY = chamberPool.getLeftSurfaceY();
      const minX = CHAMBER_LEFT_OPENING_CENTER_X - CHAMBER_LEFT_OPENING_WIDTH / 2;
      const maxX = CHAMBER_LEFT_OPENING_CENTER_X + CHAMBER_LEFT_OPENING_WIDTH / 2;
      const topY = surfaceY + DROP_ZONE_HEIGHT;

      const viewMinX = modelViewTransform.modelToViewX(minX);
      const viewMaxX = modelViewTransform.modelToViewX(maxX);
      const viewTop = modelViewTransform.modelToViewY(topY);
      const viewBottom = modelViewTransform.modelToViewY(surfaceY);

      outline.shape = Shape.rect(viewMinX, viewTop, viewMaxX - viewMinX, viewBottom - viewTop);
    };

    const multilink = Multilink.multilinkAny(
      [chamberPool.leftColumnHeightProperty, ...chamberPool.masses.map((mass) => mass.isDraggingProperty)],
      updateOutline,
    );

    this.disposeChamberMassDropZoneNode = () => {
      multilink.dispose();
    };
  }

  public override dispose(): void {
    this.disposeChamberMassDropZoneNode();
    super.dispose();
  }
}
