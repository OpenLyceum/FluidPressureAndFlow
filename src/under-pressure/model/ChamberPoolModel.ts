/**
 * ChamberPoolModel.ts
 *
 * A hydraulic press. Two vertical openings of very different width — 0.5 m on
 * the left, 2.5 m on the right — drop into chambers joined by a passage along
 * the floor. Stack weights on the narrow column and the wide one rises.
 *
 * This is the one scene on the screen with real dynamics, and it is also the one
 * that departs furthest from textbook physics. Two departures, both inherited
 * from the PhET Java sim and both deliberate; see doc/model.md.
 *
 *  1. The columns are coupled by the ratio of their *widths*, not their areas.
 *     Pascal's principle says area, and area would be right — but the quadratic
 *     makes the wide column barely twitch, which hides the very effect the scene
 *     exists to show. Using the length ratio keeps the motion visible.
 *
 *  2. When the last weight is lifted off, the columns relax back to level by
 *     shedding a tenth of the remaining displacement per step, rather than
 *     oscillating the way a real coupled fluid would. A physical relaxation
 *     would ring, and a ringing water column reads as a bug rather than as
 *     inertia.
 *
 * Geometry and both heuristics follow the Java source.
 */

import { DerivedProperty, NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { MAX_POOL_HEIGHT } from "../../FluidPressureAndFlowConstants.js";
import { MassModel } from "./MassModel.js";
import { Pool, type PressureContext } from "./Pool.js";

/** Height of the two chambers along the floor, metres. */
const CHAMBER_HEIGHT = 1.25;

/** Height and width of the passage joining the chambers, metres. */
const PASSAGE_SIZE = 0.5;

/** Width of the narrow (left) opening, metres. */
export const CHAMBER_LEFT_OPENING_WIDTH = 0.5;

/** Width of the wide (right) opening, metres. */
const RIGHT_OPENING_WIDTH = 2.5;

/**
 * How much further the narrow column moves than the wide one.
 *
 * The ratio of *widths*, not of areas — see the class comment and doc/model.md.
 */
const LENGTH_RATIO = RIGHT_OPENING_WIDTH / CHAMBER_LEFT_OPENING_WIDTH;

/** Left chamber footprint along the floor, metres. */
const LEFT_CHAMBER_MIN_X = -4.5;
const LEFT_CHAMBER_WIDTH = 3;
const LEFT_CHAMBER_CENTER_X = LEFT_CHAMBER_MIN_X + LEFT_CHAMBER_WIDTH / 2;

/** Right chamber footprint along the floor, metres. */
const RIGHT_CHAMBER_MIN_X = 0;
const RIGHT_CHAMBER_WIDTH = CHAMBER_HEIGHT;
const RIGHT_CHAMBER_CENTER_X = RIGHT_CHAMBER_MIN_X + RIGHT_CHAMBER_WIDTH / 2;

/** Altitude of the floor of both openings — the top of the chambers, metres. */
const CHAMBER_OPENING_FLOOR_Y = -MAX_POOL_HEIGHT + CHAMBER_HEIGHT;

/** Water standing in each opening when nothing is pressing on it, metres. */
const RESTING_COLUMN_HEIGHT = 1;

/**
 * Where a mass comes to rest on the ground, just above the grass line.
 * @internal Exported for unit tests; not part of the application API.
 */
export const TOP_OF_GRASS = 0.025;

/** Fraction of the remaining displacement shed per step once the weights are off. */
const RELAXATION_FRACTION = 0.1;

/** Displacement (metres) below which the column is considered settled. */
const EQUILIBRIUM_TOLERANCE = 1e-3;

/**
 * Sub-steps per frame while integrating the masses. The stack is stiff — a block
 * resting on water is a near-rigid contact — so a single frame-sized step lets
 * blocks visibly sink into each other before the contact resolves.
 */
const MASS_SUB_STEPS = 10;

/** Velocity retained per sub-step, damping the stack toward equilibrium. */
const STACK_FRICTION = 0.98;

/** x-centre of the left opening — where masses are stacked. */
export const CHAMBER_LEFT_OPENING_CENTER_X = LEFT_CHAMBER_CENTER_X;

export class ChamberPoolModel extends Pool {
  /**
   * Height of water in the narrow left column, measured up from the top of the
   * chambers. Falls below {@link RESTING_COLUMN_HEIGHT} as weight is added.
   */
  public readonly leftColumnHeightProperty = new NumberProperty(RESTING_COLUMN_HEIGHT, { units: "m" });

  /** Height of water in the wide right column. Rises as the left column falls. */
  public readonly rightColumnHeightProperty: TReadOnlyProperty<number>;

  public readonly waterShapeProperty: TReadOnlyProperty<Shape>;

  /** The three stackable weights: one heavy block and two half-height ones. */
  public readonly masses: MassModel[];

  /** Displacement at the end of the previous step, used to detect equilibrium. */
  private previousDisplacement = 0;

  public constructor() {
    super();

    this.rightColumnHeightProperty = new DerivedProperty(
      [this.leftColumnHeightProperty],
      (leftHeight) => RESTING_COLUMN_HEIGHT + Math.abs(RESTING_COLUMN_HEIGHT - leftHeight) / LENGTH_RATIO,
    );

    this.waterShapeProperty = new DerivedProperty(
      [this.leftColumnHeightProperty, this.rightColumnHeightProperty],
      (leftHeight, rightHeight) => ChamberPoolModel.createWaterShape(leftHeight, rightHeight),
    );

    // Laid out left to right on the grass beside the narrow opening, so all
    // three are reachable without overlapping the pool itself.
    const massY = TOP_OF_GRASS;
    const separation = 0.05;
    const firstX = -4.9 + PASSAGE_SIZE / 2;
    this.masses = [
      new MassModel(500, PASSAGE_SIZE, PASSAGE_SIZE, new Vector2(firstX, massY)),
      new MassModel(250, PASSAGE_SIZE, PASSAGE_SIZE / 2, new Vector2(firstX + PASSAGE_SIZE + separation, massY)),
      new MassModel(250, PASSAGE_SIZE, PASSAGE_SIZE / 2, new Vector2(firstX + 2 * (PASSAGE_SIZE + separation), massY)),
    ];
  }

  // ── Geometry ────────────────────────────────────────────────────────────────

  private static getLeftChamberShape(): Shape {
    return Shape.rect(LEFT_CHAMBER_MIN_X, -MAX_POOL_HEIGHT, LEFT_CHAMBER_WIDTH, CHAMBER_HEIGHT);
  }

  private static getRightChamberShape(): Shape {
    return Shape.rect(RIGHT_CHAMBER_MIN_X, -MAX_POOL_HEIGHT, RIGHT_CHAMBER_WIDTH, CHAMBER_HEIGHT);
  }

  private static getPassageShape(): Shape {
    const passageY = -MAX_POOL_HEIGHT + CHAMBER_HEIGHT / 2 - PASSAGE_SIZE / 2;
    const left = LEFT_CHAMBER_MIN_X + LEFT_CHAMBER_WIDTH;
    return Shape.rect(left, passageY, RIGHT_CHAMBER_MIN_X - left, PASSAGE_SIZE);
  }

  /** The narrow shaft rising from the left chamber to ground level. */
  private static getLeftOpeningShape(): Shape {
    return Shape.rect(
      LEFT_CHAMBER_CENTER_X - CHAMBER_LEFT_OPENING_WIDTH / 2,
      CHAMBER_OPENING_FLOOR_Y,
      CHAMBER_LEFT_OPENING_WIDTH,
      MAX_POOL_HEIGHT - CHAMBER_HEIGHT,
    );
  }

  /** The wide shaft rising from the right chamber to ground level. */
  private static getRightOpeningShape(): Shape {
    return Shape.rect(
      RIGHT_CHAMBER_CENTER_X - RIGHT_OPENING_WIDTH / 2,
      CHAMBER_OPENING_FLOOR_Y,
      RIGHT_OPENING_WIDTH,
      MAX_POOL_HEIGHT - CHAMBER_HEIGHT,
    );
  }

  protected override createContainerShape(): Shape {
    return ChamberPoolModel.getLeftOpeningShape()
      .shapeUnion(ChamberPoolModel.getLeftChamberShape())
      .shapeUnion(ChamberPoolModel.getPassageShape())
      .shapeUnion(ChamberPoolModel.getRightChamberShape())
      .shapeUnion(ChamberPoolModel.getRightOpeningShape());
  }

  /**
   * Water in the left column. Only as wide as the passage, not as the opening —
   * the extra width of the shaft is where the weights sit.
   */
  public static createLeftColumnWaterShape(leftColumnHeight: number): Shape {
    return Shape.rect(
      LEFT_CHAMBER_CENTER_X - PASSAGE_SIZE / 2,
      CHAMBER_OPENING_FLOOR_Y,
      PASSAGE_SIZE,
      leftColumnHeight,
    );
  }

  /** Water in the wide right column. */
  public static createRightColumnWaterShape(rightColumnHeight: number): Shape {
    return Shape.rect(
      RIGHT_CHAMBER_CENTER_X - RIGHT_OPENING_WIDTH / 2,
      CHAMBER_OPENING_FLOOR_Y,
      RIGHT_OPENING_WIDTH,
      rightColumnHeight,
    );
  }

  private static createWaterShape(leftColumnHeight: number, rightColumnHeight: number): Shape {
    return ChamberPoolModel.createLeftColumnWaterShape(leftColumnHeight)
      .shapeUnion(ChamberPoolModel.getLeftChamberShape())
      .shapeUnion(ChamberPoolModel.getPassageShape())
      .shapeUnion(ChamberPoolModel.getRightChamberShape())
      .shapeUnion(ChamberPoolModel.createRightColumnWaterShape(rightColumnHeight));
  }

  /** The narrow shaft and the wide one; solid ground between them. */
  public override getGroundOpenings(): ReadonlyArray<{ readonly minX: number; readonly maxX: number }> {
    return [
      {
        minX: LEFT_CHAMBER_CENTER_X - CHAMBER_LEFT_OPENING_WIDTH / 2,
        maxX: LEFT_CHAMBER_CENTER_X + CHAMBER_LEFT_OPENING_WIDTH / 2,
      },
      {
        minX: RIGHT_CHAMBER_CENTER_X - RIGHT_OPENING_WIDTH / 2,
        maxX: RIGHT_CHAMBER_CENTER_X + RIGHT_OPENING_WIDTH / 2,
      },
    ];
  }

  /** Altitude of the surface of the narrow left column, metres. */
  public getLeftSurfaceY(): number {
    return CHAMBER_OPENING_FLOOR_Y + this.leftColumnHeightProperty.value;
  }

  /** Altitude of the surface of the wide right column, metres. */
  public getRightSurfaceY(): number {
    return CHAMBER_OPENING_FLOOR_Y + this.rightColumnHeightProperty.value;
  }

  /**
   * The higher of the two free surfaces, which is the one that fixes the
   * pressure everywhere in the connected fluid.
   *
   * This is not a shortcut. The right column is open to the air with nothing
   * resting on it, so measuring down from it gives the true pressure at any
   * point below — including inside the left column, where the extra head is
   * exactly the contribution of the weights sitting on top.
   */
  public override getPressureSurfaceY(_x: number): number {
    return Math.max(this.getLeftSurfaceY(), this.getRightSurfaceY());
  }

  // ── Dynamics ────────────────────────────────────────────────────────────────

  /** The masses that have been dropped into the narrow left opening and released. */
  public getStackedMasses(): MassModel[] {
    return this.masses.filter(
      (mass) => mass.getBottomY() < 0 && this.isOverLeftOpening(mass) && !mass.isDraggingProperty.value,
    );
  }

  /**
   * True when the water has settled. The view uses this to show the dashed
   * drop-target line only while the student can actually act on it.
   */
  public isAtEquilibrium(): boolean {
    return Math.abs(this.getDisplacement() - this.previousDisplacement) < EQUILIBRIUM_TOLERANCE;
  }

  /** How far the left column has been pushed below its resting height, metres. */
  private getDisplacement(): number {
    return Math.abs(RESTING_COLUMN_HEIGHT - this.leftColumnHeightProperty.value);
  }

  /** True if the block's footprint overlaps the narrow opening that accepts weights. */
  public isOverLeftOpening(mass: MassModel): boolean {
    const bounds = mass.getBounds();
    return (
      bounds.maxX > LEFT_CHAMBER_CENTER_X - CHAMBER_LEFT_OPENING_WIDTH / 2 &&
      bounds.minX < LEFT_CHAMBER_CENTER_X + CHAMBER_LEFT_OPENING_WIDTH / 2
    );
  }

  /**
   * Resolves a released mass.
   *
   * Only the narrow left shaft accepts a weight. A block released underground
   * elsewhere is returned to the grass instead of becoming an invisible load on
   * the press.
   */
  public releaseMass(mass: MassModel): void {
    if (mass.getBottomY() < TOP_OF_GRASS && !this.isOverLeftOpening(mass)) {
      mass.setBottomY(TOP_OF_GRASS);
      mass.velocityProperty.value = 0;
    }
  }

  public override step(dt: number, context: PressureContext): void {
    this.previousDisplacement = this.getDisplacement();

    for (let i = 0; i < MASS_SUB_STEPS; i++) {
      this.stepMasses(dt / MASS_SUB_STEPS, context);
    }

    // The lowest resting mass sets how far the left column has been pushed down.
    const stacked = this.getStackedMasses();
    if (stacked.length > 0) {
      const lowestBottomY = Math.min(...stacked.map((mass) => mass.getBottomY()));
      const restingSurfaceY = CHAMBER_OPENING_FLOOR_Y + RESTING_COLUMN_HEIGHT;
      this.leftColumnHeightProperty.value = RESTING_COLUMN_HEIGHT - Math.abs(restingSurfaceY - lowestBottomY);
    } else {
      // Nothing pressing: ease back to level. See the class comment on why this
      // is a relaxation rather than an oscillation.
      const displacement = this.getDisplacement();
      this.leftColumnHeightProperty.value += displacement * RELAXATION_FRACTION;
    }
  }

  /**
   * Integrates the masses for one sub-step: free blocks fall under gravity, and
   * the stack resting on the water balances its weight against the head of the
   * wide column.
   */
  private stepMasses(dt: number, context: PressureContext): void {
    const gravity = context.gravity;
    const stacked = this.getStackedMasses();

    for (const mass of this.masses) {
      if (stacked.includes(mass) || mass.isDraggingProperty.value) {
        continue;
      }
      if (mass.getBottomY() > TOP_OF_GRASS) {
        const velocity = mass.velocityProperty.value - gravity * dt;
        mass.velocityProperty.value = velocity;
        mass.setBottomY(Math.max(mass.getBottomY() + velocity * dt, TOP_OF_GRASS));
      } else {
        mass.velocityProperty.value = 0;
      }
    }

    if (stacked.length === 0) {
      return;
    }

    // Treat the stack as one body: its combined weight pushes down, and the
    // water pushes back with the head standing in the wide column.
    const sorted = [...stacked].sort((a, b) => a.getBottomY() - b.getBottomY());
    const bottomMass = sorted[0];
    if (!bottomMass) {
      return;
    }
    const totalMass = stacked.reduce((sum, mass) => sum + mass.mass, 0);

    // ρgh is a pressure, not a force — the contact area is missing. Upstream has
    // the same gap, and correcting it here would change the tuning of the whole
    // scene, so it is inherited and recorded in doc/model.md rather than fixed
    // in isolation.
    const head = this.getRightSurfaceY() - bottomMass.getBottomY();
    const pressureForce = Math.abs(context.fluidDensity * gravity * head);
    const acceleration = (-totalMass * gravity + pressureForce) / totalMass;
    const velocity = (bottomMass.velocityProperty.value + acceleration * dt) * STACK_FRICTION;
    bottomMass.velocityProperty.value = velocity;
    bottomMass.setBottomY(bottomMass.getBottomY() + velocity * dt);

    // Everything above rides on the block below it.
    for (let i = 1; i < sorted.length; i++) {
      const above = sorted[i];
      const below = sorted[i - 1];
      if (above && below) {
        above.setBottomY(below.getTopY());
      }
    }
  }

  public override reset(): void {
    this.leftColumnHeightProperty.reset();
    for (const mass of this.masses) {
      mass.reset();
    }
    this.previousDisplacement = 0;
  }
}
