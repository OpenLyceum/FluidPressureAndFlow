/**
 * Pipe.ts
 *
 * The deformable pipe on the Flow screen: seven cross-sections the student drags
 * up and down, joined by a cubic spline into a smooth wall, plus the velocity
 * field that follows from its shape.
 *
 * ── The physics, and where it stops ───────────────────────────────────────────
 * The fluid is incompressible, inviscid and steady, so continuity fixes the
 * speed: `v(x) · A(x) = Q`, with the flow rate Q set by a slider rather than by
 * any pressure the student can control. Narrow the pipe and the fluid speeds up.
 *
 * `A` is computed as `πr²` from *half the cross-section height*, i.e. the pipe is
 * treated as a circular duct seen in section, not as the two-dimensional slot it
 * is drawn as. That is upstream's choice and it is the right one pedagogically:
 * a real slot's area would go as the height, and the quadratic is what makes the
 * speed-up dramatic enough to notice.
 *
 * ── Why the pipe cannot be pinched shut ───────────────────────────────────────
 * Bernoulli's `−½ρv²` term grows without bound as the area shrinks, and past a
 * point it drives the reported pressure negative — which is meaningless, and
 * which PhET has an open issue about (#199). The wall is therefore held at least
 * MIN_PIPE_HEIGHT apart. That is a mitigation, not a fix; see doc/model.md.
 */

import { BooleanProperty, DerivedProperty, NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { DEFAULT_FLOW_RATE } from "../../FluidPressureAndFlowConstants.js";
import { PipeCrossSection } from "./PipeCrossSection.js";
import { CubicSpline } from "./spline.js";

/** How many cross-sections the student can drag. */
const NUMBER_OF_CROSS_SECTIONS = 7;

/** Spacing between cross-sections, metres. */
const CROSS_SECTION_SPACING = 2;

/** Altitude of the pipe floor before the student touches anything, metres. */
const INITIAL_BOTTOM_Y = -3;

/** Altitude of the pipe ceiling before the student touches anything, metres. */
const INITIAL_TOP_Y = -1;

/** Lowest the pipe floor may be dragged, metres. */
export const MIN_PIPE_Y = -4;

/** Highest the pipe ceiling may be dragged, metres. Keeps the pipe underground. */
export const MAX_PIPE_Y = 0;

/**
 * Smallest gap allowed between floor and ceiling, metres. See the class comment:
 * this is what keeps Bernoulli's pressure from going negative.
 */
export const MIN_PIPE_HEIGHT = 1;

/**
 * How far past the last handle the wall is extended, metres. The fluid is drawn
 * running a little way past each end so it reads as entering and leaving rather
 * than as starting and stopping inside the pipe.
 */
const END_EXTENSION = 0.2;

/** Samples taken along the spline when building the wall. */
const SPLINE_SAMPLES = 70;

/**
 * How far off the pipe's centreline the friction profile reaches zero, as a
 * fraction of the pipe height beyond each wall.
 *
 * Not zero *at* the wall: a particle whose speed reached exactly zero at the
 * edge would never leave, and they would pile up at the corners forever.
 */
const FRICTION_PROFILE_OVERSHOOT = 0.2;

/** Samples used to integrate the relative Hagen–Poiseuille resistance. */
const RESISTANCE_SAMPLES = 120;

/** A sampled point on the wall: an x with the floor and ceiling there. */
export type WallSample = {
  readonly x: number;
  readonly bottomY: number;
  readonly topY: number;
};

export class Pipe {
  /**
   * Volumetric flow rate through the pipe, m³/s.
   *
   * No `units` option: axon's unit vocabulary has no m³/s, and naming it "L/s"
   * would be a lie about the value this Property actually holds.
   */
  public readonly flowRateProperty = new NumberProperty(DEFAULT_FLOW_RATE);

  /**
   * Flow actually carried by the pipe, m³/s.
   *
   * With friction off this is the student-selected flow rate. With it on, the
   * slider represents the pump setting for the original, straight pipe: a
   * narrower or longer-resistance path passes less fluid at that same driving
   * pressure. This is the missing behaviour in upstream issues #314 and #318.
   */
  public readonly effectiveFlowRateProperty: TReadOnlyProperty<number>;

  /**
   * Whether the wall slows the fluid near the edges.
   *
   * When enabled it adds a laminar velocity profile and a Hagen–Poiseuille
   * pressure loss. The flow source is pressure-driven in this mode, so narrowing
   * the pipe also lowers the volume flow rate.
   */
  public readonly isFrictionEnabledProperty = new BooleanProperty(false);

  /** The draggable cross-sections, left to right. */
  public readonly crossSections: readonly PipeCrossSection[];

  /**
   * Ticks up every time the wall moves.
   *
   * The pipe's shape is a function of fourteen separate Properties, and the
   * things that depend on it — the drawn wall, the flux meter's area, the
   * sensors — want one dependency, not fourteen. Listening to this is also how a
   * DerivedProperty can depend on a shape, which is not itself a Property.
   */
  public readonly shapeVersionProperty = new NumberProperty(0);

  /** Rebuilt lazily whenever a cross-section moves. */
  private cachedWall: WallSample[] | null = null;
  private cachedShape: Shape | null = null;

  public constructor() {
    const sections: PipeCrossSection[] = [];
    const firstX = (-(NUMBER_OF_CROSS_SECTIONS - 1) / 2) * CROSS_SECTION_SPACING;
    for (let i = 0; i < NUMBER_OF_CROSS_SECTIONS; i++) {
      const section = new PipeCrossSection(firstX + i * CROSS_SECTION_SPACING, INITIAL_BOTTOM_Y, INITIAL_TOP_Y);
      section.bottomYProperty.link(() => this.invalidate());
      section.topYProperty.link(() => this.invalidate());
      sections.push(section);
    }
    this.crossSections = sections;

    this.effectiveFlowRateProperty = new DerivedProperty(
      [this.flowRateProperty, this.isFrictionEnabledProperty, this.shapeVersionProperty],
      (requestedFlowRate, hasFriction) =>
        hasFriction ? requestedFlowRate / this.getRelativeHydraulicResistance() : requestedFlowRate,
    );
  }

  /** Discards the cached wall so the next query rebuilds it, and tells listeners. */
  private invalidate(): void {
    this.cachedWall = null;
    this.cachedShape = null;
    this.shapeVersionProperty.value++;
  }

  /** x of the first cross-section, metres. */
  public getMinX(): number {
    return (this.crossSections[0] as PipeCrossSection).x;
  }

  /** x of the last cross-section, metres. */
  public getMaxX(): number {
    return (this.crossSections[this.crossSections.length - 1] as PipeCrossSection).x;
  }

  /**
   * The wall, sampled densely enough to draw and to interpolate against.
   *
   * Floor and ceiling are splined separately and then pushed apart wherever the
   * spline's overshoot would bring them closer than MIN_PIPE_HEIGHT — the spline
   * can dip below the knots it was fitted to, so clamping the handles alone is
   * not enough.
   */
  public getWall(): readonly WallSample[] {
    if (this.cachedWall) {
      return this.cachedWall;
    }

    const first = this.crossSections[0] as PipeCrossSection;
    const last = this.crossSections[this.crossSections.length - 1] as PipeCrossSection;

    const xs = [first.x - END_EXTENSION, ...this.crossSections.map((section) => section.x), last.x + END_EXTENSION];
    const bottomYs = [
      first.bottomYProperty.value,
      ...this.crossSections.map((section) => section.bottomYProperty.value),
      last.bottomYProperty.value,
    ];
    const topYs = [
      first.topYProperty.value,
      ...this.crossSections.map((section) => section.topYProperty.value),
      last.topYProperty.value,
    ];

    const bottomSpline = new CubicSpline(xs, bottomYs);
    const topSpline = new CubicSpline(xs, topYs);

    const minX = xs[0] as number;
    const maxX = xs[xs.length - 1] as number;
    const wall: WallSample[] = [];
    for (let i = 0; i <= SPLINE_SAMPLES; i++) {
      const x = minX + ((maxX - minX) * i) / SPLINE_SAMPLES;
      let bottomY = bottomSpline.evaluate(x);
      let topY = topSpline.evaluate(x);
      if (topY - bottomY < MIN_PIPE_HEIGHT) {
        const center = (topY + bottomY) / 2;
        topY = center + MIN_PIPE_HEIGHT / 2;
        bottomY = center - MIN_PIPE_HEIGHT / 2;
      }
      wall.push({ x, bottomY, topY });
    }

    this.cachedWall = wall;
    return wall;
  }

  /** The pipe's interior as a closed shape: along the ceiling, back along the floor. */
  public getShape(): Shape {
    if (this.cachedShape) {
      return this.cachedShape;
    }
    const wall = this.getWall();
    const shape = new Shape();
    const firstSample = wall[0] as WallSample;
    shape.moveTo(firstSample.x, firstSample.topY);
    for (const sample of wall.slice(1)) {
      shape.lineTo(sample.x, sample.topY);
    }
    for (let i = wall.length - 1; i >= 0; i--) {
      const sample = wall[i] as WallSample;
      shape.lineTo(sample.x, sample.bottomY);
    }
    shape.close();
    this.cachedShape = shape;
    return shape;
  }

  /** Floor and ceiling at an arbitrary x, interpolated between wall samples. */
  public getCrossSectionAt(x: number): { bottomY: number; topY: number } {
    const wall = this.getWall();
    const minX = (wall[0] as WallSample).x;
    const maxX = (wall[wall.length - 1] as WallSample).x;
    const clampedX = Math.max(minX, Math.min(maxX, x));

    const spacing = (maxX - minX) / SPLINE_SAMPLES;
    const index = Math.min(SPLINE_SAMPLES - 1, Math.max(0, Math.floor((clampedX - minX) / spacing)));
    const low = wall[index] as WallSample;
    const high = wall[index + 1] as WallSample;
    const fraction = high.x === low.x ? 0 : (clampedX - low.x) / (high.x - low.x);

    return {
      bottomY: low.bottomY + (high.bottomY - low.bottomY) * fraction,
      topY: low.topY + (high.topY - low.topY) * fraction,
    };
  }

  /** Cross-sectional area at x, m², treating the pipe as a circular duct. */
  public getCrossSectionalArea(x: number): number {
    const section = this.getCrossSectionAt(x);
    const radius = (section.topY - section.bottomY) / 2;
    return Math.PI * radius * radius;
  }

  /** Speed at x from continuity, m/s. Before slope and friction corrections. */
  public getSpeed(x: number): number {
    return this.effectiveFlowRateProperty.value / this.getCrossSectionalArea(x);
  }

  /**
   * Hydraulic resistance relative to the initial straight pipe.
   *
   * Hagen–Poiseuille gives R ∝ ∫dx/r⁴. Keeping this dimensionless makes the
   * friction switch useful without inventing a viscosity or a hidden pressure
   * source, while retaining the physically important fourth-power dependence.
   */
  public getRelativeHydraulicResistance(): number {
    const minX = this.getMinX();
    const maxX = this.getMaxX();
    const referenceRadius = (INITIAL_TOP_Y - INITIAL_BOTTOM_Y) / 2;
    let integral = 0;
    for (let i = 0; i < RESISTANCE_SAMPLES; i++) {
      const x = minX + ((i + 0.5) * (maxX - minX)) / RESISTANCE_SAMPLES;
      const section = this.getCrossSectionAt(x);
      const radius = (section.topY - section.bottomY) / 2;
      integral += (referenceRadius / radius) ** 4;
    }
    return integral / RESISTANCE_SAMPLES;
  }

  /** Fraction of the total viscous loss accumulated from the inlet to x. */
  public getResistanceFractionAt(x: number): number {
    const minX = this.getMinX();
    const maxX = this.getMaxX();
    const endX = Math.max(minX, Math.min(maxX, x));
    if (endX === minX) {
      return 0;
    }

    let total = 0;
    let partial = 0;
    const referenceRadius = (INITIAL_TOP_Y - INITIAL_BOTTOM_Y) / 2;
    for (let i = 0; i < RESISTANCE_SAMPLES; i++) {
      const start = minX + (i * (maxX - minX)) / RESISTANCE_SAMPLES;
      const end = minX + ((i + 1) * (maxX - minX)) / RESISTANCE_SAMPLES;
      const section = this.getCrossSectionAt((start + end) / 2);
      const resistance = (referenceRadius / ((section.topY - section.bottomY) / 2)) ** 4;
      total += resistance;
      if (endX >= end) {
        partial += resistance;
      } else if (endX > start) {
        partial += resistance * ((endX - start) / (end - start));
      }
    }
    return total === 0 ? 0 : partial / total;
  }

  /** Where a point sits between floor (0) and ceiling (1) at its x. */
  public getFractionToTop(x: number, y: number): number {
    const section = this.getCrossSectionAt(x);
    const height = section.topY - section.bottomY;
    return height === 0 ? 0.5 : (y - section.bottomY) / height;
  }

  /** The y at a given fraction of the way up the pipe at x. */
  public fractionToY(x: number, fraction: number): number {
    const section = this.getCrossSectionAt(x);
    return section.bottomY + (section.topY - section.bottomY) * fraction;
  }

  /**
   * Velocity at a point, before friction: continuity sets the magnitude, and the
   * local slope of the wall sets the direction.
   */
  public getVelocity(x: number, y: number): Vector2 {
    const fraction = this.getFractionToTop(x, y);
    const epsilon = 1e-7;
    const before = new Vector2(x - epsilon, this.fractionToY(x - epsilon, fraction));
    const after = new Vector2(x + epsilon, this.fractionToY(x + epsilon, fraction));
    const direction = after.minus(before);
    const magnitude = direction.magnitude;
    return magnitude === 0 ? new Vector2(this.getSpeed(x), 0) : direction.timesScalar(this.getSpeed(x) / magnitude);
  }

  /**
   * Horizontal velocity of a particle at a point, with two corrections.
   *
   * First, the speed from continuity is along the flow, and where the pipe
   * slopes that has a vertical part; a particle's *horizontal* progress is the
   * speed scaled down by the slope. Without this, particles near a steeply
   * sloping wall visibly outrun the ones in the middle.
   *
   * Second, if friction is on, a quadratic profile slows the particle in
   * proportion to its distance from the centreline.
   */
  public getTweakedVx(x: number, y: number): number {
    const velocity = this.getVelocity(x, y);
    const magnitude = velocity.magnitude;
    if (magnitude === 0) {
      return 0;
    }
    const vx = (this.getSpeed(x) * Math.abs(velocity.x)) / magnitude;

    if (!this.isFrictionEnabledProperty.value) {
      return vx;
    }

    const fractionToTop = this.getFractionToTop(x, y);
    return vx * frictionProfile(fractionToTop);
  }

  /** Velocity of a particle at a point, with the friction profile applied. */
  public getTweakedVelocity(x: number, y: number): Vector2 {
    const velocity = this.getVelocity(x, y);
    if (!this.isFrictionEnabledProperty.value) {
      return velocity;
    }
    return velocity.timesScalar(frictionProfile(this.getFractionToTop(x, y)));
  }

  /** True if the point is inside the pipe. */
  public containsPoint(x: number, y: number): boolean {
    return this.getShape().containsPoint(new Vector2(x, y));
  }

  public reset(): void {
    this.flowRateProperty.reset();
    this.isFrictionEnabledProperty.reset();
    for (const section of this.crossSections) {
      section.reset();
    }
  }
}

/**
 * The friction velocity profile: a parabola reaching 0 slightly *outside* each
 * wall, normalized so its circular cross-section mean is 1.
 *
 * Written as a Lagrange interpolation through the three points that define it,
 * rather than as an expanded quadratic, so the three conditions stay legible.
 *
 * @param fractionToTop - 0 at the floor, 1 at the ceiling
 */
function frictionProfile(fractionToTop: number): number {
  const x1 = -FRICTION_PROFILE_OVERSHOOT;
  const x2 = 0.5;
  const x3 = 1 + FRICTION_PROFILE_OVERSHOOT;
  const x = fractionToTop;
  // y1 = y3 = 0 and y2 = 1, so only the middle term survives.
  const centreValue = ((x - x1) * (x - x3)) / ((x2 - x1) * (x2 - x3));
  // Across a circular section, mean((fractionToTop - 0.5)^2) = 1/16.
  const areaMean = 1 - 1 / (16 * (x2 - x1) ** 2);
  return centreValue / areaMean;
}
