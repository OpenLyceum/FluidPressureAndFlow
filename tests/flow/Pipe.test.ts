/**
 * Pipe.test.ts
 *
 * Continuity, and the guard rails around it.
 *
 * The claim the Flow screen makes is that `v · A` is the same everywhere in the
 * pipe. These tests check that it holds in a uniform pipe, in a deformed one,
 * and after the flow rate changes — and that the minimum-height clamp that keeps
 * Bernoulli in its domain actually holds.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { MIN_PIPE_HEIGHT, Pipe } from "../../src/flow/model/Pipe.js";

describe("Pipe", () => {
  let pipe: Pipe;

  beforeEach(() => {
    pipe = new Pipe();
  });

  it("starts as a uniform two-metre-tall duct", () => {
    for (const x of [-5, -2, 0, 3, 5]) {
      const section = pipe.getCrossSectionAt(x);
      expect(section.topY - section.bottomY).toBeCloseTo(2, 6);
    }
  });

  it("keeps v·A constant along a uniform pipe", () => {
    const reference = pipe.getSpeed(0) * pipe.getCrossSectionalArea(0);
    for (const x of [-5, -2, 2, 5]) {
      expect(pipe.getSpeed(x) * pipe.getCrossSectionalArea(x)).toBeCloseTo(reference, 6);
    }
  });

  it("keeps v·A constant after the pipe is deformed", () => {
    const middle = pipe.crossSections[3];
    expect(middle).toBeDefined();
    if (!middle) {
      return;
    }
    middle.topYProperty.value = -2.2;
    middle.bottomYProperty.value = -2.9;

    const flowRate = pipe.flowRateProperty.value;
    for (const x of [-4, -1, 0, 1, 4]) {
      expect(pipe.getSpeed(x) * pipe.getCrossSectionalArea(x)).toBeCloseTo(flowRate, 6);
    }
  });

  it("speeds the fluid up where the pipe is narrower", () => {
    const middle = pipe.crossSections[3];
    expect(middle).toBeDefined();
    if (!middle) {
      return;
    }
    const wideSpeed = pipe.getSpeed(0);
    middle.topYProperty.value = -2.0;
    expect(pipe.getSpeed(0)).toBeGreaterThan(wideSpeed);
  });

  it("scales speed with the flow rate", () => {
    const before = pipe.getSpeed(0);
    pipe.flowRateProperty.value *= 2;
    expect(pipe.getSpeed(0)).toBeCloseTo(2 * before, 6);
  });

  it("never lets the wall close below the minimum height", () => {
    // Drive both handles to the same y; the spline must still be pushed apart.
    for (const section of pipe.crossSections) {
      section.topYProperty.value = -2;
      section.bottomYProperty.value = -2;
    }
    for (const sample of pipe.getWall()) {
      expect(sample.topY - sample.bottomY).toBeGreaterThanOrEqual(MIN_PIPE_HEIGHT - 1e-9);
    }
  });

  it("reports a point inside the pipe as inside, and one above ground as outside", () => {
    expect(pipe.containsPoint(0, -2)).toBe(true);
    expect(pipe.containsPoint(0, 5)).toBe(false);
  });

  it("maps fraction-to-top and back consistently", () => {
    const y = pipe.fractionToY(1.5, 0.25);
    expect(pipe.getFractionToTop(1.5, y)).toBeCloseTo(0.25, 6);
  });

  describe("friction", () => {
    it("raises centreline speed to compensate for slower flow near the wall", () => {
      const centreY = pipe.fractionToY(0, 0.5);
      const withoutFriction = pipe.getTweakedVx(0, centreY);
      pipe.isFrictionEnabledProperty.value = true;
      expect(pipe.getTweakedVx(0, centreY)).toBeGreaterThan(withoutFriction);
    });

    it("slows particles near the wall", () => {
      pipe.isFrictionEnabledProperty.value = true;
      const centre = pipe.getTweakedVx(0, pipe.fractionToY(0, 0.5));
      const nearWall = pipe.getTweakedVx(0, pipe.fractionToY(0, 0.9));
      expect(nearWall).toBeLessThan(centre);
      expect(nearWall).toBeGreaterThan(0);
    });

    it("carries the reported flow rate across the circular section with friction", () => {
      pipe.isFrictionEnabledProperty.value = true;
      const samples = 1000;
      let weightedSpeed = 0;
      let totalWeight = 0;
      for (let i = 0; i < samples; i++) {
        const radiusFraction = -1 + (2 * (i + 0.5)) / samples;
        const fractionToTop = (radiusFraction + 1) / 2;
        const weight = Math.sqrt(1 - radiusFraction * radiusFraction);
        weightedSpeed += pipe.getTweakedVelocity(0, pipe.fractionToY(0, fractionToTop)).x * weight;
        totalWeight += weight;
      }
      const carriedFlow = (weightedSpeed / totalWeight) * pipe.getCrossSectionalArea(0);
      expect(carriedFlow).toBeCloseTo(pipe.effectiveFlowRateProperty.value, 3);
    });

    it("scales both components of velocity in a sloped pipe", () => {
      const middle = pipe.crossSections[3];
      expect(middle).toBeDefined();
      if (!middle) {
        return;
      }
      middle.topYProperty.value = -1.5;
      middle.bottomYProperty.value = -3.5;

      const x = -1;
      const y = pipe.fractionToY(x, 0.9);
      const withoutFriction = pipe.getVelocity(x, y);
      expect(Math.abs(withoutFriction.y)).toBeGreaterThan(1e-6);

      pipe.isFrictionEnabledProperty.value = true;
      const withFriction = pipe.getTweakedVelocity(x, y);
      expect(Math.abs(withFriction.y)).toBeLessThan(Math.abs(withoutFriction.y));
      expect(withFriction.x / withoutFriction.x).toBeCloseTo(withFriction.y / withoutFriction.y, 6);
    });

    it("reduces flow through a constriction at a fixed pump setting", () => {
      const requestedFlow = pipe.flowRateProperty.value;
      pipe.isFrictionEnabledProperty.value = true;
      const middle = pipe.crossSections[3];
      expect(middle).toBeDefined();
      if (!middle) {
        return;
      }
      middle.topYProperty.value = -2;

      expect(pipe.effectiveFlowRateProperty.value).toBeLessThan(requestedFlow);
      expect(pipe.getRelativeHydraulicResistance()).toBeGreaterThan(1);
    });
  });

  it("restores the initial shape on reset", () => {
    const middle = pipe.crossSections[3];
    expect(middle).toBeDefined();
    if (!middle) {
      return;
    }
    middle.topYProperty.value = -1.5;
    pipe.flowRateProperty.value = 9;
    pipe.reset();
    expect(middle.topYProperty.value).toBe(-1);
    expect(pipe.getCrossSectionAt(0).topY - pipe.getCrossSectionAt(0).bottomY).toBeCloseTo(2, 6);
  });
});
