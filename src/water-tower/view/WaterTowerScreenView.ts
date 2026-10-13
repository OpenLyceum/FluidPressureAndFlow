/**
 * WaterTowerScreenView.ts
 *
 * Lays out the Water Tower screen: a tank on legs with a faucet above it, the
 * jet leaving its side, and the tools for measuring both.
 *
 * The scale here is much smaller than on the other two screens — the tank is
 * eighteen metres up and the jet carries twenty metres sideways, against a pool
 * three metres deep — so the transform is its own thing rather than a shared
 * constant. What is shared is the convention: metres, +y up, ground at y = 0.
 */

import { BooleanProperty, DerivedProperty, Property } from "scenerystack/axon";
import { Bounds2, Range, Vector2 } from "scenerystack/dot";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node, Text, VBox } from "scenerystack/scenery";
import { FaucetNode, MeasuringTapeNode, ResetAllButton, TimeControlNode, TimeSpeed } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/FluidPressureAndFlowButtonOptions.js";
import { FluidPressureAndFlowPanel } from "../../common/FluidPressureAndFlowPanel.js";
import type { Barometer } from "../../common/model/Barometer.js";
import { formatValue } from "../../common/model/units.js";
import type { VelocitySensor } from "../../common/model/VelocitySensor.js";
import { BarometerNode } from "../../common/view/BarometerNode.js";
import { createBarometerIcon, createSpeedometerIcon } from "../../common/view/createSensorIcons.js";
import { FluidDensityAccordionBox } from "../../common/view/FluidDensityAccordionBox.js";
import { FPAFRulerNode } from "../../common/view/FPAFRulerNode.js";
import { pinAccordionBox } from "../../common/view/pinAccordionBox.js";
import { SensorToolboxNode } from "../../common/view/SensorToolboxNode.js";
import { SkyGroundNode } from "../../common/view/SkyGroundNode.js";
import { UnitSlider } from "../../common/view/UnitSlider.js";
import { VelocitySensorNode } from "../../common/view/VelocitySensorNode.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { LAYOUT_BOUNDS, PANEL_SPACING, SCREEN_VIEW_MARGIN } from "../../FluidPressureAndFlowConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { MAX_TANK_VOLUME, MIN_TANK_VOLUME } from "../model/WaterTower.js";
import { FAUCET_POSITION, type WaterTowerModel } from "../model/WaterTowerModel.js";
import { FaucetControlPanel } from "./FaucetControlPanel.js";
import { HoseNode } from "./HoseNode.js";
import { SluiceControlPanel } from "./SluiceControlPanel.js";
import { WaterDropsCanvasNode } from "./WaterDropsCanvasNode.js";
import { WaterTowerControlPanel } from "./WaterTowerControlPanel.js";
import { WaterTowerNode } from "./WaterTowerNode.js";
import { WaterTowerScreenSummaryContent } from "./WaterTowerScreenSummaryContent.js";

/**
 * View pixels per model metre.
 *
 * Set by the tallest thing that has to fit: the tank raised to its limit, with
 * the faucet still above it and still on screen. The jet's horizontal range fits
 * comfortably at the same scale.
 */
const VIEW_SCALE = 12;

/** View y of the ground line (model y = 0). */
const GROUND_VIEW_Y = 429;

/** Model x that lands at the left of the play area. */
const MODEL_LEFT_X = -6;

/** View x of {@link MODEL_LEFT_X}, measured in from the left edge. */
const MODEL_LEFT_VIEW_INSET = 49;

/** Length of the draggable ruler, metres. */
const RULER_LENGTH = 20;

/** Where the ruler sits when first shown, model coordinates. */
const RULER_HOME_POSITION = new Vector2(-4, 20);

export type WaterTowerScreenViewOptions = ScreenViewOptions;

export class WaterTowerScreenView extends ScreenView {
  private readonly isRulerVisibleProperty = new BooleanProperty(false);
  private readonly isMeasuringTapeVisibleProperty = new BooleanProperty(false);
  private readonly rulerPositionProperty = new Property(RULER_HOME_POSITION);
  private readonly dropsCanvas: WaterDropsCanvasNode;

  public constructor(model: WaterTowerModel, providedOptions?: WaterTowerScreenViewOptions) {
    const options = optionize<WaterTowerScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { layoutBounds: LAYOUT_BOUNDS, screenSummaryContent: new WaterTowerScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance();
    const common = strings.getCommonStrings();
    const screenStrings = strings.getWaterTowerStrings();
    const a11y = strings.getWaterTowerA11yStrings();
    const unitLabelGroups = strings.getUnitLabelGroups();

    const modelViewTransform = ModelViewTransform2.createSinglePointScaleInvertedYMapping(
      new Vector2(MODEL_LEFT_X, 0),
      new Vector2(this.layoutBounds.minX + MODEL_LEFT_VIEW_INSET, GROUND_VIEW_Y),
      VIEW_SCALE,
    );

    // ── Backdrop ──────────────────────────────────────────────────────────────
    this.addChild(
      new SkyGroundNode(
        this.layoutBounds.minX,
        this.layoutBounds.maxX,
        this.layoutBounds.minY,
        this.layoutBounds.maxY,
        GROUND_VIEW_Y,
        // Nothing is buried on this screen, so the tower stands on a lawn.
        { groundStyle: "turf" },
      ),
    );

    // ── Tank, hose, and the water in flight ───────────────────────────────────
    const waterTowerNode = new WaterTowerNode(
      model.waterTower,
      model.fluidDensityProperty,
      modelViewTransform,
      a11y.controls.tankHandleStringProperty,
      a11y.controls.sluiceControlStringProperty,
    );

    const hoseNode = new HoseNode(
      model.hose,
      model.waterTower,
      modelViewTransform,
      a11y.controls.tankHandleStringProperty,
      a11y.controls.hoseAngleHandleStringProperty,
    );
    this.addChild(hoseNode);
    // The tower is drawn over the hose so the sluice gate can cover the hose
    // opening when it is closed, as in PhET's HTML5 port.
    this.addChild(waterTowerNode);

    this.dropsCanvas = new WaterDropsCanvasNode(model, modelViewTransform, this.layoutBounds);
    this.addChild(this.dropsCanvas);

    // ── Faucet above the tank ─────────────────────────────────────────────────
    // The faucet goes dead once the tank is full, so the handle cannot be left
    // open against a tap that visibly does nothing.
    const isFaucetEnabledProperty = new DerivedProperty([model.waterTower.isFullProperty], (isFull) => !isFull);
    const faucet = new FaucetNode(1, model.faucetFlowRateProperty, isFaucetEnabledProperty, {
      horizontalPipeLength: 400,
      verticalPipeLength: 20,
      // Small enough that the whole assembly fits between the top of the screen
      // and the spout: the spout is pinned to FAUCET_POSITION, which is only just
      // above the tank's highest reach, so the body has to hang in what is left.
      scale: 0.43,
      closeOnRelease: false,
      accessibleName: a11y.controls.faucetModeControlStringProperty,
    });
    faucet.right = modelViewTransform.modelToViewX(FAUCET_POSITION.x) + 37;
    faucet.bottom = modelViewTransform.modelToViewY(FAUCET_POSITION.y);
    this.addChild(faucet);

    const toolsLayer = new Node();
    this.addChild(toolsLayer);

    // ── Instruments ───────────────────────────────────────────────────────────
    const toolDragBounds = new Bounds2(
      modelViewTransform.viewToModelX(this.layoutBounds.minX + SCREEN_VIEW_MARGIN),
      0,
      modelViewTransform.viewToModelX(this.layoutBounds.maxX - SCREEN_VIEW_MARGIN),
      modelViewTransform.viewToModelY(this.layoutBounds.minY + SCREEN_VIEW_MARGIN),
    );
    const keyboardGrabPosition = new Vector2(modelViewTransform.viewToModelX(this.layoutBounds.minX + 172), 24);

    const sensorLayer = new Node();
    toolsLayer.addChild(sensorLayer);

    const barometerNodes = new Map<Barometer, BarometerNode>();
    const speedometerNodes = new Map<VelocitySensor, VelocitySensorNode>();

    const toolbox = new SensorToolboxNode([
      {
        sensors: model.barometers,
        icon: createBarometerIcon(common.pressureStringProperty),
        accessibleName: a11y.controls.barometerStringProperty,
        keyboardGrabPosition: keyboardGrabPosition,
        onGrab: (sensor, event) => barometerNodes.get(sensor as Barometer)?.grabFromToolbox(event),
      },
      {
        sensors: model.velocitySensors,
        icon: createSpeedometerIcon(common.speedStringProperty),
        accessibleName: a11y.controls.speedometerStringProperty,
        keyboardGrabPosition: keyboardGrabPosition,
        onGrab: (sensor, event) => speedometerNodes.get(sensor as VelocitySensor)?.grabFromToolbox(event),
      },
    ]);
    this.addChild(toolbox);

    for (const barometer of model.barometers) {
      const readoutProperty = new DerivedProperty(
        [
          barometer.valueProperty,
          model.unitSystemProperty,
          common.unknownValueStringProperty,
          unitLabelGroups.metric.pressureStringProperty,
          unitLabelGroups.atmospheres.pressureStringProperty,
          unitLabelGroups.english.pressureStringProperty,
        ],
        (value, system, unknown) =>
          value === null
            ? unknown
            : `${formatValue(system.pressure, value)} ${system.labels(unitLabelGroups).pressureStringProperty.value}`,
      );
      const node = new BarometerNode(barometer, modelViewTransform, readoutProperty, common.pressureStringProperty, {
        homePosition: keyboardGrabPosition,
        toolboxBounds: () => toolbox.bounds,
        dragBounds: toolDragBounds,
        accessibleName: a11y.controls.barometerStringProperty,
        unitSystemProperty: model.unitSystemProperty,
      });
      barometerNodes.set(barometer, node);
      sensorLayer.addChild(node);
    }

    for (const sensor of model.velocitySensors) {
      const readoutProperty = new DerivedProperty(
        [
          sensor.valueProperty,
          model.unitSystemProperty,
          common.unknownValueStringProperty,
          unitLabelGroups.metric.velocityStringProperty,
          unitLabelGroups.atmospheres.velocityStringProperty,
          unitLabelGroups.english.velocityStringProperty,
        ],
        (value, system, unknown) =>
          value === null
            ? unknown
            : `${formatValue(system.velocity, value.magnitude)} ${system.labels(unitLabelGroups).velocityStringProperty.value}`,
      );
      const node = new VelocitySensorNode(sensor, modelViewTransform, readoutProperty, common.speedStringProperty, {
        homePosition: keyboardGrabPosition,
        toolboxBounds: () => toolbox.bounds,
        dragBounds: toolDragBounds,
        accessibleName: a11y.controls.speedometerStringProperty,
        unitSystemProperty: model.unitSystemProperty,
      });
      speedometerNodes.set(sensor, node);
      sensorLayer.addChild(node);
    }

    // ── Measuring tools ───────────────────────────────────────────────────────
    const ruler = new FPAFRulerNode(
      this.rulerPositionProperty,
      RULER_LENGTH,
      model.unitSystemProperty,
      unitLabelGroups,
      modelViewTransform,
      toolDragBounds,
      a11y.controls.rulerStringProperty,
    );
    this.isRulerVisibleProperty.link((isVisible) => {
      ruler.visible = isVisible;
    });
    toolsLayer.addChild(ruler);

    // The tape measures horizontal distances — the range of the jet, which is
    // what a student needs alongside the ruler's heights to check `v = √(2gh)`
    // against a projectile calculation.
    const measuringTapeUnitsProperty = new DerivedProperty([model.unitSystemProperty], (system) => ({
      name: system.labels(unitLabelGroups).distanceStringProperty.value,
      multiplier: system.distance.factor,
    }));
    const measuringTape = new MeasuringTapeNode(measuringTapeUnitsProperty, {
      visibleProperty: this.isMeasuringTapeVisibleProperty,
      modelViewTransform: modelViewTransform,
      basePositionProperty: new Property(new Vector2(2, 3)),
      tipPositionProperty: new Property(new Vector2(8, 3)),
      textColor: FluidPressureAndFlowColors.textColorProperty,
      dragBounds: toolDragBounds,
    });
    toolsLayer.addChild(measuringTape);

    // ── Controls ──────────────────────────────────────────────────────────────
    const faucetControls = new FaucetControlPanel(
      model.faucetModeProperty,
      { ...screenStrings },
      model.waterTower.isFullProperty,
      () => model.waterTower.fill(),
      a11y.controls.faucetModeControlStringProperty,
      a11y.controls.fillButtonStringProperty,
    );
    // Beside the faucet it controls, in the top-left corner.
    faucetControls.left = this.layoutBounds.minX + 184;
    faucetControls.top = this.layoutBounds.minY + SCREEN_VIEW_MARGIN;
    this.addChild(faucetControls);

    const sluiceControl = new SluiceControlPanel(model.waterTower.isHoleOpenProperty, a11y.controls);
    sluiceControl.right = waterTowerNode.right + 36;
    sluiceControl.bottom = this.layoutBounds.maxY - 70;
    this.addChild(sluiceControl);

    const tankVolumeControl = new FluidPressureAndFlowPanel(
      new VBox({
        align: "left",
        spacing: 4,
        children: [
          new Text(screenStrings.tankVolumeStringProperty, { font: "13px sans-serif" }),
          new UnitSlider(
            model.waterTower.capacityProperty,
            new Range(MIN_TANK_VOLUME, MAX_TANK_VOLUME),
            model.unitSystemProperty,
            {
              conversionFor: (system) => system.volume,
              unitsLabelFor: (system) => system.labels(unitLabelGroups).volumeStringProperty,
              majorTicks: [],
              accessibleName: a11y.controls.tankVolumeSliderStringProperty,
              trackWidth: 140,
            },
          ),
        ],
      }),
    );
    // Below the sluice toggle so the two left-hand controls do not overlap. The
    // slider stays under the tower where resizing the tank is easiest to read.
    tankVolumeControl.left = this.layoutBounds.minX + SCREEN_VIEW_MARGIN;
    tankVolumeControl.top = sluiceControl.bottom + PANEL_SPACING;
    this.addChild(tankVolumeControl);

    const controlPanel = new WaterTowerControlPanel(
      this.isRulerVisibleProperty,
      this.isMeasuringTapeVisibleProperty,
      model.hose.isEnabledProperty,
      model.unitSystemProperty,
      { ...common, ...screenStrings },
      a11y.controls,
    );
    controlPanel.right = this.layoutBounds.maxX - SCREEN_VIEW_MARGIN;
    controlPanel.top = this.layoutBounds.minY + SCREEN_VIEW_MARGIN;
    this.addChild(controlPanel);

    // The tray goes immediately left of the controls: the sky over the middle of
    // the screen is the only region both instruments can reach without crossing
    // the tower, and it is the one part of the screen nothing else occupies.
    toolbox.right = controlPanel.left - PANEL_SPACING;
    toolbox.top = this.layoutBounds.minY + SCREEN_VIEW_MARGIN;

    const fluidDensityBox = new FluidDensityAccordionBox(
      model.fluidDensityProperty,
      model.unitSystemProperty,
      unitLabelGroups,
      common,
      a11y.controls.fluidDensitySliderStringProperty,
    );
    this.addChild(fluidDensityBox);

    const timeControl = new TimeControlNode(model.isPlayingProperty, {
      timeSpeedProperty: model.timeSpeedProperty,
      timeSpeeds: [TimeSpeed.SLOW, TimeSpeed.NORMAL],
      speedRadioButtonGroupPlacement: "left",
      flowBoxSpacing: 12,
      playPauseStepButtonOptions: {
        stepForwardButtonOptions: { listener: () => model.stepOnce(1 / 60) },
      },
    });
    this.addChild(timeControl);

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    this.addChild(resetAllButton);

    // Bottom row sharing a baseline with Reset All. Same arrangement as the Flow
    // screen: the two dynamic screens should not put their play/pause button in
    // different places.
    pinAccordionBox(fluidDensityBox, () => {
      fluidDensityBox.right = resetAllButton.left - PANEL_SPACING * 2;
      fluidDensityBox.bottom = resetAllButton.bottom;
    });
    timeControl.centerX = this.layoutBounds.centerX;
    timeControl.bottom = resetAllButton.bottom;

    toolsLayer.moveToFront();

    // ── Traversal order ───────────────────────────────────────────────────────
    // The sluice gate first: nothing on this screen happens until it is open.
    this.addChild(
      new Node({
        pdomOrder: [
          waterTowerNode,
          sluiceControl,
          faucet,
          faucetControls,
          tankVolumeControl,
          hoseNode,
          toolbox,
          sensorLayer,
          ruler,
          measuringTape,
          controlPanel,
          fluidDensityBox,
          timeControl,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    this.isRulerVisibleProperty.reset();
    this.isMeasuringTapeVisibleProperty.reset();
    this.rulerPositionProperty.reset();
  }

  /** The drops live on a canvas, which has to be told to repaint each frame. */
  public override step(_dt: number): void {
    this.dropsCanvas.invalidatePaint();
  }
}
