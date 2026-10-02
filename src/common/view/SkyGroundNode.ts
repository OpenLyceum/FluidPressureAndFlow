/**
 * SkyGroundNode.ts
 *
 * The outdoor backdrop every screen sits in: sky above the ground line, ground
 * below it, and — where something is buried — a strip of grass along the boundary.
 *
 * The ground line is not decoration. It is the y = 0 of the model, the altitude
 * at which air pressure is one standard atmosphere, and the reference every
 * depth on the screen is measured from. Making it a hard, visible edge is what
 * lets a student see at a glance whether a barometer is in the air or in the
 * ground — and the sim reports nothing at all for the latter.
 *
 * ── Two kinds of ground ──────────────────────────────────────────────────────
 * Under Pressure and Flow cut into the ground, so theirs is earth: brown, and
 * dark enough with depth to read as a cross-section, with turf only at the
 * surface. The Water Tower screen buries nothing, so its ground is turf all the
 * way down and the tower's legs stand on a lawn. Drawing brown earth there would
 * promise a cutaway the screen never delivers.
 *
 * Scenery-phet ships SkyNode and GroundNode, whose colours and gradient depths
 * these follow, but they know nothing about the grass line or the openings a pool
 * makes in it, so the gradients are built here against the sim's colour profile.
 */

import type { BooleanProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { LinearGradient, Node, Path, Rectangle } from "scenerystack/scenery";
import FluidPressureAndFlowColors from "../../FluidPressureAndFlowColors.js";

/** Thickness of the grass strip, in view pixels. */
const GRASS_HEIGHT = 12;

/** Thickness of the darker band along the bottom of the grass. */
const GRASS_SHADOW_HEIGHT = 4;

/**
 * Height of the sky's gradient, in view pixels, measured up from the ground line.
 *
 * The sky is a flat saturated blue above this and pales only near the horizon.
 * Running the gradient the full height of the screen instead would make the blue
 * at the top depend on how tall the window is, so the same sim would be a
 * different colour on two machines.
 */
const SKY_GRADIENT_HEIGHT = 245;

/** Depth, in view pixels, over which earth darkens to its full colour. */
const EARTH_GRADIENT_DEPTH = 490;

/** Depth over which turf darkens. Shallow: a lawn is not a cross-section. */
const TURF_GRADIENT_DEPTH = 61;

/** Which ground a screen stands on. See the file comment. */
export type GroundStyle = "earth" | "turf";

export type SkyGroundNodeOptions = {
  /** Defaults to "earth", the buried-scene ground. */
  readonly groundStyle?: GroundStyle;
  /**
   * When provided and false, the sky turns black — the published PhET cue that
   * air pressure has been switched off.
   */
  readonly isAtmosphereProperty?: BooleanProperty;
};

export class SkyGroundNode extends Node {
  private readonly groundY: number;
  private readonly extent: { minX: number; maxX: number };
  private readonly hasGrass: boolean;
  private readonly openingsLayer = new Node();
  private readonly skyRectangle: Rectangle;
  private readonly skyGradient: LinearGradient;
  private readonly disposeSkyGroundNode: (() => void) | null;

  /**
   * @param minX - left edge in view coordinates
   * @param maxX - right edge
   * @param minY - top edge (top of the sky)
   * @param maxY - bottom edge (bottom of the ground)
   * @param groundY - view y of the ground line, i.e. of model y = 0
   */
  public constructor(
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    groundY: number,
    providedOptions?: SkyGroundNodeOptions,
  ) {
    super();

    const groundStyle = providedOptions?.groundStyle ?? "earth";
    this.groundY = groundY;
    this.extent = { minX, maxX };
    this.hasGrass = groundStyle === "earth";

    const width = maxX - minX;

    this.skyGradient = new LinearGradient(0, Math.max(minY, groundY - SKY_GRADIENT_HEIGHT), 0, groundY)
      .addColorStop(0, FluidPressureAndFlowColors.skyTopColorProperty)
      .addColorStop(1, FluidPressureAndFlowColors.backgroundColorProperty);

    this.skyRectangle = new Rectangle(minX, minY, width, groundY - minY, {
      fill: this.skyGradient,
    });

    const ground = new Rectangle(minX, groundY, width, maxY - groundY, {
      fill:
        groundStyle === "earth"
          ? new LinearGradient(0, groundY, 0, groundY + EARTH_GRADIENT_DEPTH)
              .addColorStop(0, FluidPressureAndFlowColors.earthTopColorProperty)
              .addColorStop(1, FluidPressureAndFlowColors.earthBottomColorProperty)
          : new LinearGradient(0, groundY, 0, groundY + TURF_GRADIENT_DEPTH)
              .addColorStop(0, FluidPressureAndFlowColors.turfTopColorProperty)
              .addColorStop(1, FluidPressureAndFlowColors.turfBottomColorProperty),
    });

    this.addChild(this.skyRectangle);
    this.addChild(ground);
    this.addChild(this.openingsLayer);
    this.setOpenings([]);

    const isAtmosphereProperty = providedOptions?.isAtmosphereProperty;
    if (isAtmosphereProperty) {
      const updateSky = (isAtmosphere: boolean) => {
        this.skyRectangle.fill = isAtmosphere ? this.skyGradient : FluidPressureAndFlowColors.vacuumSkyColorProperty;
      };
      isAtmosphereProperty.link(updateSky);
      updateSky(isAtmosphereProperty.value);
      this.disposeSkyGroundNode = () => {
        isAtmosphereProperty.unlink(updateSky);
      };
    } else {
      this.disposeSkyGroundNode = null;
    }
  }

  public override dispose(): void {
    this.disposeSkyGroundNode?.();
    super.dispose();
  }

  /**
   * Redraws the grass so it skips the given openings.
   *
   * Called whenever the scene changes shape — switching pools on the Under
   * Pressure screen moves the openings — rather than rebuilding the whole
   * backdrop, since the sky and the ground behind it never change.
   */
  public setOpenings(openings: ReadonlyArray<{ readonly minX: number; readonly maxX: number }>): void {
    if (!this.hasGrass) {
      return;
    }

    const sorted = [...openings].sort((a, b) => a.minX - b.minX);
    const grass = new Shape();
    const shadow = new Shape();

    // The grass sits above the ground line rather than below it, so the line
    // itself stays exactly at model y = 0, where the barometers measure from.
    const top = this.groundY - GRASS_HEIGHT;

    const addSpan = (spanMinX: number, spanMaxX: number) => {
      grass.rect(spanMinX, top, spanMaxX - spanMinX, GRASS_HEIGHT - GRASS_SHADOW_HEIGHT);
      shadow.rect(spanMinX, this.groundY - GRASS_SHADOW_HEIGHT, spanMaxX - spanMinX, GRASS_SHADOW_HEIGHT);
    };

    let x = this.extent.minX;
    for (const opening of sorted) {
      if (opening.minX > x) {
        addSpan(x, opening.minX);
      }
      x = Math.max(x, opening.maxX);
    }
    if (x < this.extent.maxX) {
      addSpan(x, this.extent.maxX);
    }

    this.openingsLayer.children = [
      new Path(grass, { fill: FluidPressureAndFlowColors.grassColorProperty }),
      new Path(shadow, { fill: FluidPressureAndFlowColors.grassShadowColorProperty }),
    ];
  }
}
