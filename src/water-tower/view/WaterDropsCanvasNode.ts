/**
 * WaterDropsCanvasNode.ts
 *
 * Draws the drops in flight — the jet leaving the tank and the column falling
 * from the faucet.
 *
 * Canvas, for the same reason the Flow screen's tracers are on one: there can be
 * a couple of hundred drops at once, every one of them moving every frame, and a
 * scene-graph node apiece would spend the frame budget on transform updates.
 */

import type { Bounds2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { CanvasNode } from "scenerystack/scenery";
import { getFluidColor } from "../../common/view/fluidColor.js";
import type { WaterDrop } from "../model/WaterDrop.js";
import type { WaterTowerModel } from "../model/WaterTowerModel.js";

export class WaterDropsCanvasNode extends CanvasNode {
  private readonly model: WaterTowerModel;
  private readonly modelViewTransform: ModelViewTransform2;

  public constructor(model: WaterTowerModel, modelViewTransform: ModelViewTransform2, canvasBounds: Bounds2) {
    super({ canvasBounds: canvasBounds });
    this.model = model;
    this.modelViewTransform = modelViewTransform;
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    // Drops are the same fluid that is in the tank, so they take the same
    // density-derived colour — switching to honey has to be visible in the jet
    // as well as in the tank, or the two stop reading as one substance.
    context.fillStyle = getFluidColor(this.model.fluidDensityProperty.value).toCSS();
    this.paintDrops(context, this.model.faucetDrops);
    this.paintDrops(context, this.model.effluxDrops);
  }

  private paintDrops(context: CanvasRenderingContext2D, drops: readonly WaterDrop[]): void {
    for (const drop of drops) {
      const center = this.modelViewTransform.modelToViewPosition(drop.position);
      const radius = this.modelViewTransform.modelToViewDeltaX(drop.getRadius());
      context.beginPath();
      context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
      context.fill();
    }
  }
}
