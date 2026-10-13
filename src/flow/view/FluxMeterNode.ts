/**
 * FluxMeterNode.ts
 *
 * The flux meter: a hoop the student slides along the pipe, with a panel showing
 * the area it encloses, the flux through it, and the flow rate.
 *
 * The ring is split into a back arc (parented inside {@link PipeNode}'s
 * pre-particle layer) and a front arc plus panel (on the tools layer), so
 * tracers pass through the hoop rather than painting over it.
 */

import type { EnumerationProperty, TReadOnlyProperty } from "scenerystack/axon";
import { DerivedProperty, Multilink, PatternStringProperty, Property } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import {
  DragListener,
  KeyboardDragListener,
  Node,
  Path,
  PEER_DESCRIPTION_SIBLING,
  PEER_PRIMARY_SIBLING,
  Text,
  VBox,
} from "scenerystack/scenery";
import { FluidPressureAndFlowPanel } from "../../common/FluidPressureAndFlowPanel.js";
import { formatValue, type UnitLabelGroups, type UnitSystem } from "../../common/model/units.js";
import { InstrumentDescriptionProperty } from "../../common/view/InstrumentDescriptionProperty.js";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";
import { SHIFT_KEY_SPEED_DIVISOR } from "../../FluidPressureAndFlowConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { FluxMeter } from "../model/FluxMeter.js";
import type { Pipe } from "../model/Pipe.js";

/** Metres the hoop moves per arrow-key press. */
const KEYBOARD_DRAG_SPEED = 1.5;

/** Thickness of the hoop, view pixels. */
const HOOP_LINE_WIDTH = 7;

/** How much wider than the pipe the hoop is drawn, view pixels. */
const HOOP_OVERHANG = 8;

/** Opacity of the back half of the hoop, so it reads as behind the fluid without disappearing. */
const BACK_RING_OPACITY = 0.5;

const READOUT_FONT = "12px sans-serif";
const READOUT_MAX_WIDTH = 180;
const READOUT_SPACING = 3;

function createReadoutText(textProperty: TReadOnlyProperty<string>): Text {
  return new Text(textProperty, {
    font: READOUT_FONT,
    fill: FluidPressureAndFlowColors.textColorProperty,
    maxWidth: READOUT_MAX_WIDTH,
  });
}

export type FluxMeterLabels = {
  readonly flowRateStringProperty: TReadOnlyProperty<string>;
  readonly areaStringProperty: TReadOnlyProperty<string>;
  readonly fluxStringProperty: TReadOnlyProperty<string>;
};

export class FluxMeterNode extends Node {
  private readonly disposeFluxMeterNode: () => void;

  /** Back half of the hoop; parent in {@link PipeNode.preParticleLayer}. */
  public readonly backRing: Path;

  public constructor(
    fluxMeter: FluxMeter,
    pipe: Pipe,
    modelViewTransform: ModelViewTransform2,
    unitSystemProperty: EnumerationProperty<UnitSystem>,
    unitLabelGroups: UnitLabelGroups,
    labels: FluxMeterLabels,
    accessibleName: TReadOnlyProperty<string>,
  ) {
    super({
      cursor: "ew-resize",
      tagName: "div",
      focusable: true,
      accessibleName: accessibleName,
    });

    const frontRing = new Path(null, {
      stroke: FluidPressureAndFlowColors.accentColorProperty,
      lineWidth: HOOP_LINE_WIDTH,
    });

    this.backRing = new Path(null, {
      stroke: FluidPressureAndFlowColors.accentColorProperty,
      lineWidth: HOOP_LINE_WIDTH,
      opacity: BACK_RING_OPACITY,
    });

    const flowRateTextProperty = new DerivedProperty(
      [
        pipe.effectiveFlowRateProperty,
        unitSystemProperty,
        labels.flowRateStringProperty,
        unitLabelGroups.metric.flowRateStringProperty,
        unitLabelGroups.atmospheres.flowRateStringProperty,
        unitLabelGroups.english.flowRateStringProperty,
      ],
      (flowRate, system, label) =>
        `${label}: ${formatValue(system.flowRate, flowRate)} ${system.labels(unitLabelGroups).flowRateStringProperty.value}`,
    );
    const areaTextProperty = new DerivedProperty(
      [
        fluxMeter.areaProperty,
        unitSystemProperty,
        labels.areaStringProperty,
        unitLabelGroups.metric.areaStringProperty,
        unitLabelGroups.atmospheres.areaStringProperty,
        unitLabelGroups.english.areaStringProperty,
      ],
      (area, system, label) =>
        `${label}: ${formatValue(system.area, area)} ${system.labels(unitLabelGroups).areaStringProperty.value}`,
    );
    const fluxTextProperty = new DerivedProperty(
      [
        fluxMeter.fluxProperty,
        unitSystemProperty,
        labels.fluxStringProperty,
        unitLabelGroups.metric.fluxStringProperty,
        unitLabelGroups.atmospheres.fluxStringProperty,
        unitLabelGroups.english.fluxStringProperty,
      ],
      (flux, system, label) =>
        `${label}: ${formatValue(system.flux, flux)} ${system.labels(unitLabelGroups).fluxStringProperty.value}`,
    );

    const panel = new FluidPressureAndFlowPanel(
      new VBox({
        align: "left",
        spacing: READOUT_SPACING,
        children: [
          createReadoutText(flowRateTextProperty),
          createReadoutText(areaTextProperty),
          createReadoutText(fluxTextProperty),
        ],
      }),
    );

    this.children = [frontRing, panel];

    const layout = () => {
      const x = fluxMeter.xProperty.value;
      const section = pipe.getCrossSectionAt(x);
      const viewX = modelViewTransform.modelToViewX(x);
      const viewTop = modelViewTransform.modelToViewY(section.topY);
      const viewBottom = modelViewTransform.modelToViewY(section.bottomY);
      const centerY = (viewTop + viewBottom) / 2;
      const radiusY = (viewBottom - viewTop) / 2 + HOOP_OVERHANG;

      // Split the ellipse so particles can pass between the two arcs.
      frontRing.shape = new Shape().ellipticalArc(
        viewX,
        centerY,
        radiusY,
        HOOP_OVERHANG,
        Math.PI / 2,
        0,
        Math.PI,
        false,
      );
      this.backRing.shape = new Shape().ellipticalArc(
        viewX,
        centerY,
        radiusY,
        HOOP_OVERHANG,
        Math.PI / 2,
        Math.PI,
        0,
        false,
      );

      panel.centerX = viewX;
      panel.bottom = viewTop - HOOP_OVERHANG - 8;
    };

    const layoutMultilink = Multilink.multilinkAny([fluxMeter.xProperty, pipe.shapeVersionProperty], layout);

    const positionProperty = new Property(new Vector2(fluxMeter.xProperty.value, 0));
    const readingsProperty = new PatternStringProperty(
      StringManager.getInstance().getCommonA11yStrings().fluxReadingsPatternStringProperty,
      {
        flowRate: flowRateTextProperty,
        area: areaTextProperty,
        flux: fluxTextProperty,
      },
    );
    const descriptionProperty = new InstrumentDescriptionProperty(
      readingsProperty,
      positionProperty,
      unitSystemProperty,
      true,
    );
    this.accessibleHelpText = descriptionProperty;
    this.addAriaDescribedbyAssociation({
      otherNode: this,
      thisElementName: PEER_PRIMARY_SIBLING,
      otherElementName: PEER_DESCRIPTION_SIBLING,
    });

    const syncToModel = (position: Vector2) => {
      fluxMeter.xProperty.value = position.x;
    };
    positionProperty.link(syncToModel);
    const syncFromModel = (x: number) => {
      if (positionProperty.value.x !== x) {
        positionProperty.value = new Vector2(x, 0);
      }
    };
    fluxMeter.xProperty.link(syncFromModel);

    const dragBoundsProperty = new Property(new Bounds2(pipe.getMinX(), 0, pipe.getMaxX(), 0));

    // The hoop and the panel are drawn at absolute view coordinates, so this node's
    // origin never moves. `useParentOffset` measures the grab offset against
    // positionProperty instead, which is the only thing here that tracks the meter.
    const dragListener = new DragListener({
      positionProperty: positionProperty,
      transform: modelViewTransform,
      useParentOffset: true,
      dragBoundsProperty: dragBoundsProperty,
    });
    this.addInputListener(dragListener);

    const keyboardDragListener = new KeyboardDragListener({
      positionProperty: positionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: dragBoundsProperty,
      dragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED),
      shiftDragSpeed: modelViewTransform.modelToViewDeltaX(KEYBOARD_DRAG_SPEED) / SHIFT_KEY_SPEED_DIVISOR,
    });
    this.addInputListener(keyboardDragListener);

    const updateVisibility = (isVisible: boolean) => {
      this.visible = isVisible;
      this.backRing.visible = isVisible;
    };
    fluxMeter.isVisibleProperty.link(updateVisibility);
    updateVisibility(fluxMeter.isVisibleProperty.value);

    layout();

    this.disposeFluxMeterNode = () => {
      this.accessibleHelpText = null;
      descriptionProperty.dispose();
      readingsProperty.dispose();
      layoutMultilink.dispose();
      positionProperty.unlink(syncToModel);
      fluxMeter.xProperty.unlink(syncFromModel);
      fluxMeter.isVisibleProperty.unlink(updateVisibility);
      flowRateTextProperty.dispose();
      areaTextProperty.dispose();
      fluxTextProperty.dispose();
      dragListener.dispose();
      keyboardDragListener.dispose();
    };
  }

  public override dispose(): void {
    this.disposeFluxMeterNode();
    super.dispose();
  }
}
