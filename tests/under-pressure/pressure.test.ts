/**
 * pressure.test.ts
 *
 * The hydrostatic law, checked against the screen's own learning goals.
 *
 * Each test here corresponds to a claim the Under Pressure screen makes to a
 * student. If one of them breaks, the sim is teaching something false — which is
 * a worse failure than a crash, and a much quieter one.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { EARTH_GRAVITY, MAX_POOL_HEIGHT, WATER_DENSITY } from "../../src/FluidPressureAndFlowConstants.js";
import { PoolScene } from "../../src/under-pressure/model/PoolScene.js";
import {
  TRAPEZOID_LEFT_CHAMBER_CENTER_X,
  TRAPEZOID_RIGHT_CHAMBER_CENTER_X,
} from "../../src/under-pressure/model/TrapezoidPoolModel.js";
import { UnderPressureModel } from "../../src/under-pressure/model/UnderPressureModel.js";

/** A point one metre under the surface of the half-full square pool. */
const SQUARE_POOL_X = -1.2;

/** Altitude of the surface when the pool is half full. */
const HALF_FULL_SURFACE_Y = -MAX_POOL_HEIGHT / 2;

describe("hydrostatic pressure", () => {
  let model: UnderPressureModel;

  beforeEach(() => {
    model = new UnderPressureModel();
  });

  it("reads air pressure exactly at the water surface", () => {
    const atSurface = model.getPressureAt(SQUARE_POOL_X, HALF_FULL_SURFACE_Y);
    expect(atSurface).toBeCloseTo(model.getAirPressure(HALF_FULL_SURFACE_Y), 6);
  });

  it("adds ρgh below the surface", () => {
    const depth = 1;
    const y = HALF_FULL_SURFACE_Y - depth;
    const expected = model.getAirPressure(HALF_FULL_SURFACE_Y) + WATER_DENSITY * EARTH_GRAVITY * depth;
    expect(model.getPressureAt(SQUARE_POOL_X, y)).toBeCloseTo(expected, 6);
  });

  it("increases linearly with depth", () => {
    const at = (depth: number) => model.getPressureAt(SQUARE_POOL_X, HALF_FULL_SURFACE_Y - depth) as number;
    const firstHalfMetre = at(0.5) - at(0);
    const secondHalfMetre = at(1.0) - at(0.5);
    expect(secondHalfMetre).toBeCloseTo(firstHalfMetre, 6);
  });

  it("does not change as you move horizontally at constant depth", () => {
    const y = HALF_FULL_SURFACE_Y - 1;
    expect(model.getPressureAt(-2.5, y)).toBeCloseTo(model.getPressureAt(0.5, y) as number, 6);
  });

  it("increases linearly with fluid density", () => {
    const y = HALF_FULL_SURFACE_Y - 1;
    const surfacePressure = model.getAirPressure(HALF_FULL_SURFACE_Y);

    model.fluidDensityProperty.value = 700;
    const light = (model.getPressureAt(SQUARE_POOL_X, y) as number) - surfacePressure;

    model.fluidDensityProperty.value = 1400;
    const heavy = (model.getPressureAt(SQUARE_POOL_X, y) as number) - surfacePressure;

    expect(heavy).toBeCloseTo(2 * light, 6);
  });

  it("increases with gravity", () => {
    const y = HALF_FULL_SURFACE_Y - 1;
    const weak = model.getPressureAt(SQUARE_POOL_X, y) as number;
    model.gravityProperty.value = 2 * EARTH_GRAVITY;
    expect(model.getPressureAt(SQUARE_POOL_X, y) as number).toBeGreaterThan(weak);
  });

  it("reports nothing underground outside the pool", () => {
    expect(model.getPressureAt(-20, -1)).toBeNull();
  });

  it("reads air pressure inside the pool but above the water line", () => {
    const aboveWater = HALF_FULL_SURFACE_Y + 0.5;
    expect(model.getPressureAt(SQUARE_POOL_X, aboveWater)).toBeCloseTo(model.getAirPressure(aboveWater), 6);
  });

  it("falls with altitude in the air", () => {
    expect(model.getPressureAt(0, 5) as number).toBeLessThan(model.getPressureAt(0, 0) as number);
  });

  it("reads zero everywhere in the air once the atmosphere is switched off", () => {
    model.isAtmosphereProperty.value = false;
    expect(model.getPressureAt(0, 5)).toBe(0);
  });

  it("still shows ρgh underwater with the atmosphere off, now with no offset", () => {
    model.isAtmosphereProperty.value = false;
    const depth = 1;
    const y = HALF_FULL_SURFACE_Y - depth;
    expect(model.getPressureAt(SQUARE_POOL_X, y)).toBeCloseTo(WATER_DENSITY * EARTH_GRAVITY * depth, 6);
  });
});

describe("scene selections", () => {
  it("keeps gravity and density when switching among ordinary pools", () => {
    const model = new UnderPressureModel();
    model.gravityProperty.value = 3.71;
    model.fluidDensityProperty.value = 1420;
    model.sceneProperty.value = PoolScene.TRAPEZOID;
    model.sceneProperty.value = PoolScene.CHAMBER;
    expect(model.gravityProperty.value).toBe(3.71);
    expect(model.fluidDensityProperty.value).toBe(1420);
  });

  it("restores selections after the Mystery pool and resets to defaults", () => {
    const model = new UnderPressureModel();
    model.gravityProperty.value = 3.71;
    model.fluidDensityProperty.value = 1420;
    model.sceneProperty.value = PoolScene.MYSTERY;
    expect(model.fluidDensityProperty.value).not.toBe(1420);
    model.sceneProperty.value = PoolScene.SQUARE;
    expect(model.gravityProperty.value).toBe(3.71);
    expect(model.fluidDensityProperty.value).toBe(1420);
    model.sceneProperty.value = PoolScene.MYSTERY;
    model.reset();
    expect(model.gravityProperty.value).toBe(EARTH_GRAVITY);
    expect(model.fluidDensityProperty.value).toBe(WATER_DENSITY);
  });
});

describe("trapezoid pool", () => {
  let model: UnderPressureModel;

  beforeEach(() => {
    model = new UnderPressureModel();
    model.sceneProperty.value = PoolScene.TRAPEZOID;
  });

  it("reads the same pressure at equal depths in the two chambers, despite their shapes", () => {
    // One metre down, in the chamber that is narrow at the top and in the one
    // that is wide at the top. Very different volumes of water overhead.
    const y = HALF_FULL_SURFACE_Y - 1;
    const left = model.getPressureAt(TRAPEZOID_LEFT_CHAMBER_CENTER_X, y);
    const right = model.getPressureAt(TRAPEZOID_RIGHT_CHAMBER_CENTER_X, y);
    expect(left).not.toBeNull();
    expect(right).not.toBeNull();
    expect(left as number).toBeCloseTo(right as number, 6);
  });

  it("keeps the two chambers at one level as the pool fills", () => {
    model.trapezoidPool.waterLevelProperty.value = 2.5;
    const y = -1;
    expect(model.getPressureAt(TRAPEZOID_LEFT_CHAMBER_CENTER_X, y)).toBeCloseTo(
      model.getPressureAt(TRAPEZOID_RIGHT_CHAMBER_CENTER_X, y) as number,
      6,
    );
  });
});
