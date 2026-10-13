/**
 * UnderPressureScreenView.ts
 *
 * Lays out the Under Pressure screen: an outdoor scene with one of four pools
 * cut into the ground, a tray of barometers, and the controls down the right.
 *
 * ── Coordinate frame ─────────────────────────────────────────────────────────
 * The model works in metres with +y up and y = 0 at ground level; the view works
 * in pixels with +y down. One ModelViewTransform2, built once here, is the only
 * place that conversion happens — every child node takes the transform rather
 * than doing its own arithmetic.
 *
 * The ground line sits high enough on the screen to leave room for a three-metre
 * pool below it, and low enough that a barometer lifted into the air still has
 * somewhere to go — the air-pressure-falls-with-altitude goal needs that room.
 */

import { BooleanProperty, DerivedProperty, Property } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/FluidPressureAndFlowButtonOptions.js";
import type { Barometer } from "../../common/model/Barometer.js";
import { MYSTERY_FLUID_COLORS } from "../../common/model/fluidColor.js";
import { formatValue } from "../../common/model/units.js";
import { BarometerNode } from "../../common/view/BarometerNode.js";
import { createBarometerIcon } from "../../common/view/createSensorIcons.js";
import { FluidDensityAccordionBox } from "../../common/view/FluidDensityAccordionBox.js";
import { FPAFRulerNode } from "../../common/view/FPAFRulerNode.js";
import { GravityAccordionBox } from "../../common/view/GravityAccordionBox.js";
import { pinAccordionBox } from "../../common/view/pinAccordionBox.js";
import { SensorToolboxNode } from "../../common/view/SensorToolboxNode.js";
import { SkyGroundNode } from "../../common/view/SkyGroundNode.js";
import {
  LAYOUT_BOUNDS,
  MAX_POOL_HEIGHT,
  PANEL_SPACING,
  SCREEN_VIEW_MARGIN,
} from "../../FluidPressureAndFlowConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { MysteryQuantity } from "../model/MysteryPoolModel.js";
import { PoolScene } from "../model/PoolScene.js";
import type { UnderPressureModel } from "../model/UnderPressureModel.js";
import { ChamberMassDropZoneNode } from "./ChamberMassDropZoneNode.js";
import { MassNode } from "./MassNode.js";
import { MysteryPoolControlsNode } from "./MysteryPoolControlsNode.js";
import { PoolFaucetsNode } from "./PoolFaucetsNode.js";
import { PoolGridNode } from "./PoolGridNode.js";
import { PoolNode } from "./PoolNode.js";
import { SceneRadioButtonGroup } from "./SceneRadioButtonGroup.js";
import { UnderPressureControlPanel } from "./UnderPressureControlPanel.js";
import { UnderPressureScreenSummaryContent } from "./UnderPressureScreenSummaryContent.js";

/**
 * View pixels per model metre. PhET used 70 px/m against a 504-px-tall frame;
 * this is that scale grown with the frame height, so the pool still occupies the
 * same fraction of the screen and the sky above it still holds a barometer
 * lifted to MAX_TOOL_ALTITUDE.
 */
const VIEW_SCALE = 86;

/** View y of the ground line (model y = 0). */
const GROUND_VIEW_Y = 300;

/** Model x that lands at the horizontal centre of the play area. */
const MODEL_CENTER_X = -0.7;

/** How high above the ground a tool may be dragged, metres. */
const MAX_TOOL_ALTITUDE = 3.6;

/** Vertical offset from an accordion box top to its slider readout, view pixels. */
const MYSTERY_COMBO_TOP_INSET = 28;

/** Panel width shared by the control column and mystery choice panel. */
const CONTROL_PANEL_WIDTH = 150;

/** Length of the draggable ruler, metres. */
const RULER_LENGTH = 4;

/** Where the ruler sits when first shown, model coordinates. */
const RULER_HOME_POSITION = new Vector2(1.6, 0.6);

export type UnderPressureScreenViewOptions = ScreenViewOptions;

export class UnderPressureScreenView extends ScreenView {
  private readonly isRulerVisibleProperty = new BooleanProperty(false);
  private readonly isGridVisibleProperty = new BooleanProperty(false);
  private readonly rulerPositionProperty = new Property(RULER_HOME_POSITION);

  public constructor(model: UnderPressureModel, providedOptions?: UnderPressureScreenViewOptions) {
    const options = optionize<UnderPressureScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { layoutBounds: LAYOUT_BOUNDS, screenSummaryContent: new UnderPressureScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance();
    const common = strings.getCommonStrings();
    const screenStrings = strings.getUnderPressureStrings();
    const a11y = strings.getUnderPressureA11yStrings();
    const unitLabelGroups = strings.getUnitLabelGroups();

    const modelViewTransform = ModelViewTransform2.createSinglePointScaleInvertedYMapping(
      new Vector2(MODEL_CENTER_X, 0),
      new Vector2(this.layoutBounds.centerX - 60, GROUND_VIEW_Y),
      VIEW_SCALE,
    );

    // ── Backdrop ──────────────────────────────────────────────────────────────
    const skyGround = new SkyGroundNode(
      this.layoutBounds.minX,
      this.layoutBounds.maxX,
      this.layoutBounds.minY,
      this.layoutBounds.maxY,
      GROUND_VIEW_Y,
      { isAtmosphereProperty: model.isAtmosphereProperty },
    );
    this.addChild(skyGround);

    // ── Pools ─────────────────────────────────────────────────────────────────
    // All four are built up front and shown one at a time. Building them lazily
    // would save nothing worth having and would make the first switch stutter.
    const poolLayer = new Node();
    this.addChild(poolLayer);

    const noOverrideProperty = new Property<string | null>(null);
    const mysteryFluidColorProperty = new DerivedProperty(
      [model.mysteryPool.fluidChoiceProperty, model.mysteryPool.mysteryQuantityProperty],
      (choice, quantity) =>
        quantity === MysteryQuantity.FLUID_DENSITY
          ? ((MYSTERY_FLUID_COLORS[choice] ?? MYSTERY_FLUID_COLORS[0])?.toCSS() ?? null)
          : null,
    );

    // The chamber pool has no taps — its water level is set by the weights, and
    // a tap would let a student defeat the press by simply topping it up.
    const pools = [
      {
        scene: PoolScene.SQUARE,
        model: model.squarePool,
        override: noOverrideProperty,
        faucets: model.squarePool,
      },
      {
        scene: PoolScene.TRAPEZOID,
        model: model.trapezoidPool,
        override: noOverrideProperty,
        faucets: model.trapezoidPool,
      },
      { scene: PoolScene.CHAMBER, model: model.chamberPool, override: noOverrideProperty, faucets: null },
      {
        scene: PoolScene.MYSTERY,
        model: model.mysteryPool,
        override: mysteryFluidColorProperty,
        faucets: model.mysteryPool,
      },
    ];

    const sceneNodes = new Map<PoolScene, Node>();
    for (const pool of pools) {
      const container = new Node();
      container.addChild(
        new PoolNode(
          pool.model.getContainerShape(),
          pool.model.waterShapeProperty,
          model.fluidDensityProperty,
          pool.override,
          modelViewTransform,
        ),
      );

      const grid = new PoolGridNode(
        pool.model.getContainerShape().getBounds(),
        model.unitSystemProperty,
        unitLabelGroups,
        modelViewTransform,
      );
      this.isGridVisibleProperty.link((isVisible) => {
        grid.visible = isVisible;
      });
      container.addChild(grid);

      if (pool.faucets) {
        container.addChild(
          new PoolFaucetsNode(pool.faucets, model.fluidDensityProperty, modelViewTransform, {
            inputFaucetX: pool.faucets.getInputFaucetX(),
            drainFaucetX: pool.faucets.getDrainFaucetX(),
            inputAccessibleName: a11y.controls.inputFaucetStringProperty,
            drainAccessibleName: a11y.controls.drainFaucetStringProperty,
          }),
        );
      }

      sceneNodes.set(pool.scene, container);
      poolLayer.addChild(container);
    }

    // ── Chamber-pool weights ──────────────────────────────────────────────────
    const massLayer = new Node();
    const massDragBounds = new Bounds2(-5.4, -MAX_POOL_HEIGHT, 2.6, MAX_TOOL_ALTITUDE);
    massLayer.addChild(new ChamberMassDropZoneNode(model.chamberPool, modelViewTransform));
    for (const mass of model.chamberPool.masses) {
      massLayer.addChild(
        new MassNode(
          mass,
          modelViewTransform,
          screenStrings.massLabelPatternStringProperty,
          a11y.controls.massStringProperty,
          massDragBounds,
          () => {
            model.chamberPool.releaseMass(mass);
            model.updateSensorValues();
          },
        ),
      );
    }
    this.addChild(massLayer);

    // Show the pool for the selected scene, and open the ground only where that
    // pool actually breaks the surface.
    model.sceneProperty.link((scene) => {
      for (const [candidate, node] of sceneNodes) {
        node.visible = candidate === scene;
      }
      massLayer.visible = scene === PoolScene.CHAMBER;

      skyGround.setOpenings(
        model
          .getPool()
          .getGroundOpenings()
          .map((opening) => ({
            minX: modelViewTransform.modelToViewX(opening.minX),
            maxX: modelViewTransform.modelToViewX(opening.maxX),
          })),
      );
    });

    // ── Instruments ───────────────────────────────────────────────────────────
    const toolDragBounds = new Bounds2(
      modelViewTransform.viewToModelX(this.layoutBounds.minX + SCREEN_VIEW_MARGIN),
      -MAX_POOL_HEIGHT,
      modelViewTransform.viewToModelX(this.layoutBounds.maxX - SCREEN_VIEW_MARGIN),
      MAX_TOOL_ALTITUDE,
    );

    // Where a keyboard-taken barometer lands: in the open sky over the pool, clear
    // of the tray and the panels and well inside the drag bounds.
    const keyboardGrabPosition = new Vector2(modelViewTransform.viewToModelX(this.layoutBounds.centerX), 1.5);

    const sensorLayer = new Node();
    this.addChild(sensorLayer);

    const barometerNodes = new Map<Barometer, BarometerNode>();

    const toolbox = new SensorToolboxNode([
      {
        sensors: model.barometers,
        icon: createBarometerIcon(common.pressureStringProperty),
        accessibleName: a11y.controls.barometerStringProperty,
        keyboardGrabPosition: keyboardGrabPosition,
        onGrab: (sensor, event) => {
          barometerNodes.get(sensor as Barometer)?.grabFromToolbox(event);
        },
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
      const barometerNode = new BarometerNode(
        barometer,
        modelViewTransform,
        readoutProperty,
        common.pressureStringProperty,
        {
          homePosition: keyboardGrabPosition,
          toolboxBounds: () => toolbox.bounds,
          dragBounds: toolDragBounds,
          accessibleName: a11y.controls.barometerStringProperty,
          unitSystemProperty: model.unitSystemProperty,
        },
      );
      barometerNodes.set(barometer, barometerNode);
      sensorLayer.addChild(barometerNode);
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
      { onClose: () => this.isRulerVisibleProperty.set(false) },
    );
    this.isRulerVisibleProperty.link((isVisible) => {
      ruler.visible = isVisible;
    });
    this.addChild(ruler);

    // ── Controls ──────────────────────────────────────────────────────────────
    const sceneRadioButtons = new SceneRadioButtonGroup(
      model.sceneProperty,
      screenStrings.scenes,
      a11y.controls.sceneChooserStringProperty,
    );
    // Down the left edge, starting just below the ground line: the four scenes are
    // read against the pool they switch between, and the sky above has to stay
    // clear for the barometers a student drags out of the tray.
    sceneRadioButtons.left = this.layoutBounds.minX + SCREEN_VIEW_MARGIN;
    sceneRadioButtons.top = GROUND_VIEW_Y + SCREEN_VIEW_MARGIN;
    this.addChild(sceneRadioButtons);

    const controlPanel = new UnderPressureControlPanel(
      this.isRulerVisibleProperty,
      this.isGridVisibleProperty,
      model.isAtmosphereProperty,
      model.unitSystemProperty,
      common,
      a11y.controls,
    );
    controlPanel.right = this.layoutBounds.maxX - SCREEN_VIEW_MARGIN;
    controlPanel.top = this.layoutBounds.minY + SCREEN_VIEW_MARGIN;
    this.addChild(controlPanel);

    // The tray goes immediately left of the controls, not in the far corner: a
    // barometer is dragged down onto the pool, and starting it above the middle of
    // the screen keeps that drag short and away from the faucet.
    toolbox.right = controlPanel.left - PANEL_SPACING;
    toolbox.top = this.layoutBounds.minY + SCREEN_VIEW_MARGIN;

    const gravityBox = new GravityAccordionBox(
      model.gravityProperty,
      model.unitSystemProperty,
      unitLabelGroups,
      common,
      a11y.controls.gravitySliderStringProperty,
    );
    const fluidDensityBox = new FluidDensityAccordionBox(
      model.fluidDensityProperty,
      model.unitSystemProperty,
      unitLabelGroups,
      common,
      a11y.controls.fluidDensitySliderStringProperty,
      { expandedDefaultValue: true },
    );

    this.addChild(gravityBox);
    this.addChild(fluidDensityBox);

    const mysteryControls = new MysteryPoolControlsNode(
      model.mysteryPool,
      model.sceneProperty,
      this,
      screenStrings,
      a11y.controls.mysteryChooserStringProperty,
      CONTROL_PANEL_WIDTH,
    );
    this.addChild(mysteryControls.choicePanel);
    this.addChild(mysteryControls.fluidComboBox);
    this.addChild(mysteryControls.planetComboBox);

    const updateMysterySliders = () => {
      const isMystery = model.sceneProperty.value === PoolScene.MYSTERY;
      if (!isMystery) {
        gravityBox.unitSlider.setValueHidden(false);
        fluidDensityBox.unitSlider.setValueHidden(false);
        return;
      }
      gravityBox.unitSlider.setValueHidden(model.isGravityHidden());
      fluidDensityBox.unitSlider.setValueHidden(model.isFluidDensityHidden());
    };
    model.sceneProperty.link(updateMysterySliders);
    model.mysteryPool.mysteryQuantityProperty.link(updateMysterySliders);
    updateMysterySliders();

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

    // The right-hand column is stacked upward from Reset All, because the two
    // sliders change height when a student folds them and only the bottom of the
    // column is a fixed landmark. Gravity sits nearer the button since it is the
    // one the Mystery scene disables most often.
    const stackRightColumn = () => {
      gravityBox.right = resetAllButton.right;
      gravityBox.bottom = resetAllButton.top - PANEL_SPACING;
      fluidDensityBox.right = gravityBox.right;
      fluidDensityBox.bottom = gravityBox.top - PANEL_SPACING;

      mysteryControls.choicePanel.left = controlPanel.left;
      mysteryControls.choicePanel.top = controlPanel.bottom + PANEL_SPACING;

      mysteryControls.fluidComboBox.right = fluidDensityBox.right - 10;
      mysteryControls.fluidComboBox.top = fluidDensityBox.top + MYSTERY_COMBO_TOP_INSET;
      mysteryControls.planetComboBox.right = gravityBox.right - 10;
      mysteryControls.planetComboBox.top = gravityBox.top + MYSTERY_COMBO_TOP_INSET;
    };
    pinAccordionBox(gravityBox, stackRightColumn);
    pinAccordionBox(fluidDensityBox, stackRightColumn);
    stackRightColumn();

    // ── Traversal order ───────────────────────────────────────────────────────
    // Scene first, since it changes what everything else refers to; then the
    // tools a student places, then the panel, then the sliders, Reset All last.
    this.addChild(
      new Node({
        pdomOrder: [
          sceneRadioButtons,
          toolbox,
          sensorLayer,
          massLayer,
          ruler,
          controlPanel,
          mysteryControls.choicePanel,
          gravityBox,
          fluidDensityBox,
          mysteryControls.fluidComboBox,
          mysteryControls.planetComboBox,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    this.isRulerVisibleProperty.reset();
    this.isGridVisibleProperty.reset();
    this.rulerPositionProperty.reset();
  }
}
