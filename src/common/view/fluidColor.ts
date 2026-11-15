/**
 * fluidColor.ts
 *
 * Maps fluid density onto the colour the fluid is drawn in.
 *
 * The density slider is continuous, so the fluid has to shade continuously too:
 * gasoline is a colourless grey, water a bright cyan, honey an amber. Interpolating
 * gives the student a second, non-numeric channel telling them the fluid changed —
 * which matters because on the Under Pressure screen the only other evidence is a
 * barometer digit.
 *
 * The three anchor colours are PhET's, carried over from the Java sim. They are
 * more saturated than a naturalistic palette would be, deliberately: the fluid is
 * read at a glance through a pool wall and behind tracer dots.
 *
 * Mystery fluids ignore density entirely and return a fixed purple, so the
 * colour cannot be used to reverse-engineer the hidden value.
 */

import { Color } from "scenerystack/scenery";
import { GASOLINE_DENSITY, HONEY_DENSITY, WATER_DENSITY } from "../../FluidPressureAndFlowConstants.js";

/** Colour of the lightest selectable fluid (gasoline, 700 kg/m³). */
const GASOLINE_COLOR = new Color(149, 142, 139);

/** Colour of water (1000 kg/m³), the default. */
const WATER_COLOR = new Color(20, 244, 255);

/** Colour of the densest selectable fluid (honey, 1420 kg/m³). */
const HONEY_COLOR = new Color(255, 191, 0);

/**
 * The colour of a mystery fluid. Deliberately uninformative: all three mystery
 * fluids are purples of similar weight, so a student must reason from the
 * barometer rather than from the picture.
 */
export const MYSTERY_FLUID_COLORS = [new Color(113, 35, 136), new Color(179, 115, 176), new Color(78, 32, 100)];

/**
 * The colour for a fluid of the given density.
 *
 * Piecewise-linear with a knot at water, because water is the reference the
 * student is asked to compare against and it should look exactly right rather
 * than fall wherever a single gasoline→honey ramp happens to put it.
 *
 * @param density - kg/m³; values outside the slider range are clamped
 */
export function getFluidColor(density: number): Color {
  if (density <= GASOLINE_DENSITY) {
    return GASOLINE_COLOR;
  }
  if (density >= HONEY_DENSITY) {
    return HONEY_COLOR;
  }
  return density < WATER_DENSITY
    ? Color.interpolateRGBA(
        GASOLINE_COLOR,
        WATER_COLOR,
        (density - GASOLINE_DENSITY) / (WATER_DENSITY - GASOLINE_DENSITY),
      )
    : Color.interpolateRGBA(WATER_COLOR, HONEY_COLOR, (density - WATER_DENSITY) / (HONEY_DENSITY - WATER_DENSITY));
}
