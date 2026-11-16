import { FLUX_METER_SETTINGS } from "../../FluidPressureAndFlowConstants.js";
/**
 * FluxMeter.ts
 *
 * A hoop the student slides along the pipe, reading off the cross-sectional
 * area, the flux through it, and the flow rate.
 *
 * It is the screen's answer to "how do I know the fluid really is speeding up?".
 * The flow rate stays put while the area and the flux move in opposite
 * directions — which is the continuity equation, displayed as three numbers that
 * a student can watch trade off against each other.
 */

import { BooleanProperty, DerivedProperty, NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { Pipe } from "./Pipe.js";

/** Where the hoop sits before the student moves it, metres. */
const INITIAL_X: number = FLUX_METER_SETTINGS.INITIAL_X;

export class FluxMeter {
  /** Whether the meter is on screen. */
  public readonly isVisibleProperty = new BooleanProperty(false);

  /** Where along the pipe the hoop sits, metres. */
  public readonly xProperty = new NumberProperty(INITIAL_X, { units: "m" });

  /** Cross-sectional area at the hoop, m². */
  public readonly areaProperty: TReadOnlyProperty<number>;

  /** Volume crossing unit area per second at the hoop, m/s. */
  public readonly fluxProperty: TReadOnlyProperty<number>;

  public constructor(pipe: Pipe, pipeShapeVersionProperty: TReadOnlyProperty<number>) {
    // The area depends on the pipe's shape, which changes without any Property
    // of the meter's changing; pipeShapeVersionProperty is the model's way of
    // saying "the wall moved" so this recomputes when a handle is dragged.
    this.areaProperty = new DerivedProperty([this.xProperty, pipeShapeVersionProperty], (x) =>
      pipe.getCrossSectionalArea(x),
    );

    this.fluxProperty = new DerivedProperty(
      [pipe.effectiveFlowRateProperty, this.areaProperty],
      (flowRate, area) => flowRate / area,
    );
  }

  public reset(): void {
    this.isVisibleProperty.reset();
    this.xProperty.reset();
  }
}
