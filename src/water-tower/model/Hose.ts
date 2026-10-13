/**
 * Hose.ts
 *
 * An optional hose plugged into the hole in the tank, ending in a nozzle the
 * student can raise, lower and aim.
 *
 * Its purpose is to separate two things the bare hole conflates. Without the
 * hose, the outlet is fixed to the tank, so raising the tank raises both the
 * water and the outlet and the head barely changes. With it, the outlet stays
 * where the student put it while the tank moves — so the head, and only the
 * head, is what varies. Aiming the nozzle then turns the jet into a projectile
 * whose range can be measured against `v = √(2gh)`.
 */

import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import type { Shape } from "scenerystack/kite";
import { computeHoseLayout, createHoseShape, HOSE_NOZZLE_LENGTH } from "./HoseGeometry.js";
import { HOLE_SIZE } from "./WaterTower.js";

export { HOSE_NOZZLE_LENGTH } from "./HoseGeometry.js";

/** Where the nozzle sits horizontally, metres. Far enough out to see the whole arc. */
export const HOSE_OUTLET_X = 17;

/** Highest the nozzle may be raised, metres. */
export const MAX_HOSE_OUTLET_Y = 14;

/** Radius of the straight nozzle bore, metres. */
export const HOSE_RADIUS = 0.4;

/** Angle straight up, radians. Zero is horizontal, to the right. */
const INITIAL_ANGLE = Math.PI / 2;

/**
 * Where the nozzle starts, metres. Below the tank's hole, so there is head to
 * measure from the first frame, and high enough that the hose's own lower bend
 * clears the ground while the nozzle points straight up.
 */
const INITIAL_OUTLET_Y = 9;

export class Hose {
  private cachedPipeShape: Shape | null = null;
  private cachedAttachment: Vector2 | null = null;
  private cachedOutletY = Number.NaN;
  private cachedAngle = Number.NaN;
  /** Whether the hose is attached. */
  public readonly isEnabledProperty = new BooleanProperty(false);

  /** Altitude of the nozzle's mouth, metres. */
  public readonly outletYProperty = new NumberProperty(INITIAL_OUTLET_Y, { units: "m" });

  /** Direction the nozzle points, radians. 0 is horizontal-right, π/2 straight up. */
  public readonly angleProperty = new NumberProperty(INITIAL_ANGLE, { units: "radians" });

  /** Where fluid leaves the hose, model coordinates. */
  public getOutletPosition(): Vector2 {
    return new Vector2(HOSE_OUTLET_X, this.outletYProperty.value);
  }

  /** Unit vector the jet leaves along. */
  public getDirection(): Vector2 {
    return Vector2.createPolar(1, this.angleProperty.value);
  }

  /** The same cached SI outline used to paint the green pipe. */
  public getPipeShape(attachment: Vector2): Shape {
    const outletY = this.outletYProperty.value;
    const angle = this.angleProperty.value;
    if (
      !(this.cachedPipeShape && this.cachedAttachment?.equals(attachment)) ||
      this.cachedOutletY !== outletY ||
      this.cachedAngle !== angle
    ) {
      const baseY = attachment.y - HOLE_SIZE / 2;
      const layout = computeHoseLayout(HOSE_OUTLET_X - attachment.x, outletY - baseY, angle);
      this.cachedPipeShape = createHoseShape(layout, attachment.x, baseY);
      this.cachedAttachment = attachment.copy();
      this.cachedOutletY = outletY;
      this.cachedAngle = angle;
    }
    return this.cachedPipeShape;
  }

  /** Whether a point lies in the drawn pipe or the straight nozzle bore. */
  public containsPoint(attachment: Vector2, x: number, y: number): boolean {
    if (!this.isEnabledProperty.value) {
      return false;
    }
    if (this.getPipeShape(attachment).containsPoint(new Vector2(x, y))) {
      return true;
    }
    const outlet = this.getOutletPosition();
    const direction = this.getDirection();
    const bend = outlet.minus(direction.timesScalar(HOSE_NOZZLE_LENGTH));
    return distanceToSegmentSquared(x, y, bend, outlet) <= HOSE_RADIUS * HOSE_RADIUS;
  }

  public reset(): void {
    this.isEnabledProperty.reset();
    this.outletYProperty.reset();
    this.angleProperty.reset();
  }
}

function distanceToSegmentSquared(x: number, y: number, start: Vector2, end: Vector2): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((x - start.x) * dx + (y - start.y) * dy) / lengthSquared));
  const closestX = start.x + t * dx;
  const closestY = start.y + t * dy;
  return (x - closestX) ** 2 + (y - closestY) ** 2;
}
