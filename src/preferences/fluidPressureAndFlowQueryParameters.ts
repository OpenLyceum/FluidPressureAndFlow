/**
 * fluidPressureAndFlowQueryParameters.ts
 *
 * Sim-specific startup query parameters. This is the single place where every
 * sim-specific query parameter is declared and documented. Public-facing
 * parameters (intended for end users / sharing links) must set `public: true`.
 *
 * ── How to add a query parameter ──────────────────────────────────────────────
 * 1. Add an entry below with a `type`, `defaultValue`, and (if user-facing)
 *    `public: true`. Add `isValidValue` to bound numeric ranges.
 * 2. If it should also be user-editable at runtime, surface it as a preference
 *    in FluidPressureAndFlowPreferencesModel (initialize that Property from this query parameter).
 *
 * Usage: append e.g. `?linkUnits=false` to the sim URL.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import FluidPressureAndFlowNamespace from "../FluidPressureAndFlowNamespace.js";

const fluidPressureAndFlowQueryParameters = QueryStringMachine.getAll({
  /**
   * Whether choosing a unit system on one screen changes it on all three.
   *
   * On by default. A student who has settled on atmospheres to reason about
   * pressure in the pool should not find themselves back in kilopascals when
   * they move to the pipe — the comparison across screens is part of the point.
   * Off is there for a teacher who wants each screen set independently.
   */
  linkUnits: {
    type: "boolean",
    defaultValue: true,
    public: true,
  },
});

FluidPressureAndFlowNamespace.register("fluidPressureAndFlowQueryParameters", fluidPressureAndFlowQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default fluidPressureAndFlowQueryParameters;
