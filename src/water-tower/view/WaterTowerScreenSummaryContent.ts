/**
 * WaterTowerScreenSummaryContent.ts
 *
 * The accessible screen summary for the Water Tower screen.
 *
 * The live paragraph reports how full the tank is and whether the hole is open,
 * because those two facts determine everything else on the screen — and the
 * second one is the thing a student has to do first.
 */

import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { roundSymmetric } from "scenerystack/dot";
import { ScreenSummaryContent } from "scenerystack/sim";
import { StringManager } from "../../i18n/StringManager.js";
import type { WaterTowerModel } from "../model/WaterTowerModel.js";

export class WaterTowerScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: WaterTowerModel) {
    const strings = StringManager.getInstance();
    const a11y = strings.getWaterTowerA11yStrings();
    const common = strings.getCommonStrings();

    const fillPercentProperty = new DerivedProperty(
      [model.waterTower.fluidVolumeProperty, model.waterTower.capacityProperty],
      (volume, capacity) => roundSymmetric((100 * volume) / capacity),
    );

    const holeStateProperty = new DerivedProperty(
      [model.waterTower.isHoleOpenProperty, common.openStringProperty, common.closedStringProperty],
      (isOpen, open, closed) => (isOpen ? open : closed),
    );

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsStringProperty, {
        fill: fillPercentProperty,
        hole: holeStateProperty,
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
