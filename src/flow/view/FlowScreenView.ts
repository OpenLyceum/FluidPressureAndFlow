/**
 * FlowScreenView.ts
 *
 * Lays out the Flow screen: a pipe running the width of the play area below
 * ground, handles on its wall, tracers in the fluid, and the instruments and
 * controls that let a student catch what a constriction does.
 *
 * The pipe sits below the ground line for the same reason the pools do — the
 * ground is the sim's y = 0, and the `ρgy` term in Bernoulli's equation is
 * measured from it. Keeping the pipe underground also leaves the sky free for
 * the instruments, which have to be readable while they sit over the flow.
 */

import { BooleanProperty, DerivedProperty, Property } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node } from "scenerystack/scenery";
import { ResetAllButton, TimeControlNode, TimeSpeed } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/FluidPressureAndFlowButtonOptions.js";
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
import { VelocitySensorNode } from "../../common/view/VelocitySensorNode.js";
import {
  FLOW_MODEL_VIEW_ANCHOR,
  FLOW_VIEW_SCALE,
  LAYOUT_BOUNDS,
  PANEL_SPACING,
  SCREEN_VIEW_MARGIN,
} from "../../FluidPressureAndFlowConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { FlowModel } from "../model/FlowModel.js";
import { FlowControlPanel } from "./FlowControlPanel.js";
import { FlowRateAccordionBox } from "./FlowRateAccordionBox.js";
import { FlowScreenSummaryContent } from "./FlowScreenSummaryContent.js";
import { FluxMeterNode } from "./FluxMeterNode.js";
import { GridInjectorNode } from "./GridInjectorNode.js";
import type { ParticleCanvasNode } from "./ParticleCanvasNode.js";
import { PipeHandlesNode } from "./PipeHandlesNode.js";
import { PipeNode } from "./PipeNode.js";

/** View pixels per model metre on the Flow screen (PhET HTML5 reference). */
const VIEW_SCALE = FLOW_VIEW_SCALE;

/** How high above the ground a tool may be dragged, metres. */
const MAX_TOOL_ALTITUDE = 3.2;

/** Length of the draggable ruler, metres. */
const RULER_LENGTH = 4;

/** Where the ruler sits when first shown, model coordinates. */
const RULER_HOME_POSITION = new Vector2(4.4, 0.8);

export type FlowScreenViewOptions = ScreenViewOptions;

export class FlowScreenView extends ScreenView {
  private readonly isRulerVisibleProperty = new BooleanProperty(false);
  private readonly rulerPositionProperty = new Property(RULER_HOME_POSITION);
  private readonly particleCanvas: ParticleCanvasNode;

  public constructor(model: FlowModel, providedOptions?: FlowScreenViewOptions) {
    const options = optionize<FlowScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { layoutBounds: LAYOUT_BOUNDS, screenSummaryContent: new FlowScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance();
    const common = strings.getCommonStrings();
    const screenStrings = strings.getFlowStrings();
    const a11y = strings.getFlowA11yStrings();
    const unitLabelGroups = strings.getUnitLabelGroups();

    const modelViewTransform = ModelViewTransform2.createSinglePointScaleInvertedYMapping(
      Vector2.ZERO,
      FLOW_MODEL_VIEW_ANCHOR,
      VIEW_SCALE,
    );
    const groundY = modelViewTransform.modelToViewY(0);

    // ── Backdrop ──────────────────────────────────────────────────────────────
    const skyGround = new SkyGroundNode(
      this.layoutBounds.minX,
      this.layoutBounds.maxX,
      this.layoutBounds.minY,
      this.layoutBounds.maxY,
      groundY,
    );
    this.addChild(skyGround);

    const toolsLayer = new Node();
    this.addChild(toolsLayer);

    // ── Pipe scene (z-order matches totality FlowScreenView) ──────────────────
    const gridInjector = new GridInjectorNode(
      model.gridInjectorCooldownProperty,
      () => model.injectGrid(),
      model.pipe,
      modelViewTransform,
      a11y.controls.gridInjectorStringProperty,
    );
    this.addChild(gridInjector);

    const pipeNode = new PipeNode(model, model.pipe, model.fluidDensityProperty, modelViewTransform);
    this.addChild(pipeNode);
    this.particleCanvas = pipeNode.particleCanvas;

    const pipeHandles = new PipeHandlesNode(
      model.pipe,
      pipeNode,
      modelViewTransform,
      a11y.controls.pipeHandleStringProperty,
      {
        layoutBounds: this.layoutBounds,
      },
    );
    this.addChild(pipeHandles);

    const fluxMeterNode = new FluxMeterNode(
      model.fluxMeter,
      model.pipe,
      modelViewTransform,
      model.unitSystemProperty,
      unitLabelGroups,
      screenStrings,
      a11y.controls.fluxMeterStringProperty,
    );
    pipeNode.preParticleLayer.addChild(fluxMeterNode.backRing);
    toolsLayer.addChild(fluxMeterNode);

    // ── Instruments ───────────────────────────────────────────────────────────
    const toolDragBounds = new Bounds2(
      modelViewTransform.viewToModelX(this.layoutBounds.minX + SCREEN_VIEW_MARGIN),
      -4,
      modelViewTransform.viewToModelX(this.layoutBounds.maxX - SCREEN_VIEW_MARGIN),
      MAX_TOOL_ALTITUDE,
    );
    const keyboardGrabPosition = new Vector2(modelViewTransform.viewToModelX(this.layoutBounds.centerX), 1.4);

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
        [barometer.valueProperty, model.unitSystemProperty, common.unknownValueStringProperty],
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
      });
      barometerNodes.set(barometer, node);
      sensorLayer.addChild(node);
    }

    for (const sensor of model.velocitySensors) {
      const readoutProperty = new DerivedProperty(
        [sensor.valueProperty, model.unitSystemProperty, common.unknownValueStringProperty],
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
      });
      speedometerNodes.set(sensor, node);
      sensorLayer.addChild(node);
    }

    // ── Ruler ─────────────────────────────────────────────────────────────────
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

    // ── Controls ──────────────────────────────────────────────────────────────
    const flowRateBox = new FlowRateAccordionBox(
      model.pipe.flowRateProperty,
      model.unitSystemProperty,
      unitLabelGroups,
      screenStrings.flowRateStringProperty,
      a11y.controls.flowRateSliderStringProperty,
    );
    this.addChild(flowRateBox);

    const controlPanel = new FlowControlPanel(
      this.isRulerVisibleProperty,
      model.pipe.isFrictionEnabledProperty,
      model.fluxMeter.isVisibleProperty,
      model.areDotsVisibleProperty,
      model.unitSystemProperty,
      { ...common, ...screenStrings },
      a11y.controls,
    );
    controlPanel.right = this.layoutBounds.maxX - SCREEN_VIEW_MARGIN;
    controlPanel.top = this.layoutBounds.minY + SCREEN_VIEW_MARGIN;
    this.addChild(controlPanel);

    // The tray goes immediately left of the controls rather than in the far
    // corner: both instruments are dragged down onto the pipe, which runs across
    // the middle of the screen.
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
        // One frame at normal speed, so a step is the same size however the
        // speed radio buttons are set — a step is for inspecting a moment, not
        // for advancing at the chosen rate.
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

    // Bottom row: the flow-rate slider at the far left, time controls centred, and
    // fluid density beside Reset All. Everything shares a baseline, and the two
    // accordion boxes grow upward from it rather than pushing the row around.
    pinAccordionBox(fluidDensityBox, () => {
      fluidDensityBox.right = resetAllButton.left - PANEL_SPACING * 2;
      fluidDensityBox.bottom = resetAllButton.bottom;
    });
    pinAccordionBox(flowRateBox, () => {
      flowRateBox.left = this.layoutBounds.minX + SCREEN_VIEW_MARGIN;
      flowRateBox.bottom = resetAllButton.bottom;
    });
    timeControl.centerX = this.layoutBounds.centerX;
    timeControl.bottom = resetAllButton.bottom;

    toolsLayer.moveToFront();

    // ── Traversal order ───────────────────────────────────────────────────────
    this.addChild(
      new Node({
        pdomOrder: [
          flowRateBox,
          pipeHandles,
          gridInjector,
          toolbox,
          sensorLayer,
          fluxMeterNode,
          ruler,
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
    this.rulerPositionProperty.reset();
  }

  /**
   * The tracers are drawn on a canvas rather than as scene-graph nodes, so
   * nothing invalidates their paint automatically — the repaint has to be asked
   * for once per frame. See ParticleCanvasNode for why they live on a canvas.
   */
  public override step(_dt: number): void {
    this.particleCanvas.invalidatePaint();
  }
}
