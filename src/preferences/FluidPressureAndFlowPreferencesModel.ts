/**
 * FluidPressureAndFlowPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in fluidPressureAndFlowQueryParameters.
 */

import { BooleanProperty, EnumerationProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import { UnitSystem } from "../common/model/units.js";
import FluidPressureAndFlowNamespace from "../FluidPressureAndFlowNamespace.js";
import fluidPressureAndFlowQueryParameters from "./fluidPressureAndFlowQueryParameters.js";

export class FluidPressureAndFlowPreferencesModel {
  /** Whether the three screens share one unit system. */
  public readonly linkUnitsProperty: BooleanProperty;

  /**
   * The shared unit system, when linking is on.
   *
   * It lives here rather than in a screen model because no one screen owns it —
   * it is the thing all three agree about. Each screen model mirrors it while
   * linking is enabled and keeps its own value when it is not.
   */
  public readonly sharedUnitSystemProperty: EnumerationProperty<UnitSystem>;

  public constructor(tandem?: Tandem) {
    this.linkUnitsProperty = new BooleanProperty(
      fluidPressureAndFlowQueryParameters.linkUnits,
      tandem ? { tandem: tandem.createTandem("linkUnitsProperty") } : undefined,
    );
    this.sharedUnitSystemProperty = new EnumerationProperty(UnitSystem.METRIC, {
      ...(tandem && { tandem: tandem.createTandem("sharedUnitSystemProperty") }),
    });
  }

  public reset(): void {
    this.linkUnitsProperty.reset();
    this.sharedUnitSystemProperty.reset();
  }
}

FluidPressureAndFlowNamespace.register("FluidPressureAndFlowPreferencesModel", FluidPressureAndFlowPreferencesModel);
