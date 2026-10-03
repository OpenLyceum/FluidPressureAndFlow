/**
 * torricelli.test.ts
 *
 * The Water Tower screen's claims, one test each.
 *
 * The two that matter most are the negatives: the efflux speed does not depend
 * on how much water is in the tank, and it does not depend on the fluid. Both are
 * things students predict wrongly, and both are easy to break with a plausible
 * edit — a stray ρ in the efflux term would look reasonable and would quietly
 * make the sim teach the opposite of Torricelli's law.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { EARTH_GRAVITY } from "../../src/FluidPressureAndFlowConstants.js";
import { FaucetMode } from "../../src/water-tower/model/FaucetMode.js";
import { TANK_RADIUS, TANK_VOLUME } from "../../src/water-tower/model/WaterTower.js";
import { WaterTowerModel } from "../../src/water-tower/model/WaterTowerModel.js";

/** Cross-sectional area of the tank, m². */
const TANK_AREA = Math.PI * TANK_RADIUS * TANK_RADIUS;

describe("Torricelli's law", () => {
  let model: WaterTowerModel;

  beforeEach(() => {
    model = new WaterTowerModel();
    model.waterTower.isHoleOpenProperty.value = true;
  });

  it("gives v = √(2gh) for the head above the hole", () => {
    const head = model.getHead();
    expect(head).toBeGreaterThan(0);
    expect(model.getEffluxSpeed()).toBeCloseTo(Math.sqrt(2 * EARTH_GRAVITY * head), 9);
  });

  it("does not depend on the fluid", () => {
    const withWater = model.getEffluxSpeed();
    model.fluidDensityProperty.value = 1420;
    expect(model.getEffluxSpeed()).toBeCloseTo(withWater, 9);
    model.fluidDensityProperty.value = 700;
    expect(model.getEffluxSpeed()).toBeCloseTo(withWater, 9);
  });

  it("depends on the head, not on the height of the tank above the ground", () => {
    // Raising the whole tank carries the water and the hole up together, so the
    // head — and the speed — is unchanged.
    const before = model.getEffluxSpeed();
    const base = model.waterTower.baseCenterProperty.value;
    model.waterTower.baseCenterProperty.value = base.plusXY(0, 2);
    expect(model.getEffluxSpeed()).toBeCloseTo(before, 9);
  });

  it("does not depend on tank capacity when the water level is held fixed", () => {
    const head = model.getHead();
    const speed = model.getEffluxSpeed();
    model.waterTower.capacityProperty.value *= 1.5;
    expect(model.waterTower.getRadius()).toBeGreaterThan(TANK_RADIUS);
    expect(model.getHead()).toBeCloseTo(head, 9);
    expect(model.getEffluxSpeed()).toBeCloseTo(speed, 9);
  });

  it("falls as the tank drains", () => {
    const fast = model.getEffluxSpeed();
    model.waterTower.fluidVolumeProperty.value = TANK_VOLUME * 0.3;
    expect(model.getEffluxSpeed()).toBeLessThan(fast);
  });

  it("is zero once the tank is empty", () => {
    model.waterTower.fluidVolumeProperty.value = 0;
    expect(model.getEffluxSpeed()).toBe(0);
    expect(model.isFlowing()).toBe(false);
  });

  it("is zero while the hole is covered", () => {
    model.waterTower.isHoleOpenProperty.value = false;
    expect(model.isFlowing()).toBe(false);
  });

  it("measures the head from the hose nozzle when the hose is attached", () => {
    model.hose.isEnabledProperty.value = true;
    model.hose.outletYProperty.value = 0;
    const lowNozzle = model.getEffluxSpeed();
    model.hose.outletYProperty.value = 8;
    expect(model.getEffluxSpeed()).toBeLessThan(lowNozzle);
  });

  it("stops flowing if the nozzle is raised above the water", () => {
    model.hose.isEnabledProperty.value = true;
    model.hose.outletYProperty.value = model.waterTower.getFluidSurfaceY() + 1;
    expect(model.getEffluxSpeed()).toBe(0);
  });

  it("stops draining through a hose when water falls below the side hole", () => {
    model.hose.isEnabledProperty.value = true;
    model.hose.outletYProperty.value = 5;
    model.waterTower.fluidVolumeProperty.value = TANK_AREA * 0.25;
    expect(model.getHead()).toBeGreaterThan(0);
    expect(model.isFlowing()).toBe(false);
    const volume = model.waterTower.fluidVolumeProperty.value;
    model.stepOnce(0.016);
    expect(model.waterTower.fluidVolumeProperty.value).toBe(volume);
  });
});

describe("volume conservation", () => {
  let model: WaterTowerModel;

  beforeEach(() => {
    model = new WaterTowerModel();
    model.waterTower.isHoleOpenProperty.value = true;
  });

  it("hands the tank's lost volume to the drops that carry it away", () => {
    const before = model.waterTower.fluidVolumeProperty.value;
    for (let i = 0; i < 20; i++) {
      model.stepOnce(0.016);
    }
    const lost = before - model.waterTower.fluidVolumeProperty.value;
    const carried = model.effluxDrops.reduce((sum, drop) => sum + drop.volume, 0);

    expect(lost).toBeGreaterThan(0);
    // Drops are removed once they hit the ground, so what is still in flight can
    // only be a part of what left; over twenty steps none has landed yet.
    expect(carried).toBeCloseTo(lost, 6);
  });

  it("drains the tank monotonically with the hole open and the faucet shut", () => {
    let previous = model.waterTower.fluidVolumeProperty.value;
    for (let i = 0; i < 100; i++) {
      model.stepOnce(0.016);
      const now = model.waterTower.fluidVolumeProperty.value;
      expect(now).toBeLessThanOrEqual(previous + 1e-12);
      previous = now;
    }
  });

  it("never overfills the tank", () => {
    model.waterTower.isHoleOpenProperty.value = false;
    model.faucetFlowRateProperty.value = 1;
    for (let i = 0; i < 500; i++) {
      model.stepOnce(0.016);
    }
    expect(model.waterTower.fluidVolumeProperty.value).toBeLessThanOrEqual(TANK_VOLUME + 1e-9);
    expect(model.waterTower.isFullProperty.value).toBe(true);
  });

  it("holds the level steady in Match Leakage", () => {
    model.faucetModeProperty.value = FaucetMode.MATCH_LEAKAGE;
    const level = model.waterTower.getFluidLevel();
    for (let i = 0; i < 100; i++) {
      model.stepOnce(0.016);
    }
    expect(model.waterTower.getFluidLevel()).toBeCloseTo(level, 6);
  });

  it("relates fluid level to volume through the tank's cross-section", () => {
    model.waterTower.fluidVolumeProperty.value = TANK_AREA * 4;
    expect(model.waterTower.getFluidLevel()).toBeCloseTo(4, 9);
  });
});

describe("the jet", () => {
  let model: WaterTowerModel;

  beforeEach(() => {
    model = new WaterTowerModel();
    model.waterTower.isHoleOpenProperty.value = true;
  });

  it("leaves the hole horizontally", () => {
    model.stepOnce(0.016);
    const drop = model.effluxDrops[0];
    expect(drop).toBeDefined();
    if (!drop) {
      return;
    }
    // The drop is emitted with no vertical velocity and then falls for the rest
    // of the step it was born in, so all it has picked up by now is one step of
    // gravity — small next to the sideways speed it left with.
    expect(drop.velocity.x).toBeGreaterThan(0);
    expect(Math.abs(drop.velocity.y)).toBeLessThan(EARTH_GRAVITY * 0.016 + 1e-9);
  });

  it("leaves the hose along the angle it is aimed", () => {
    model.hose.isEnabledProperty.value = true;
    model.hose.angleProperty.value = Math.PI / 2;
    model.stepOnce(0.016);
    const drop = model.effluxDrops[0];
    expect(drop).toBeDefined();
    if (!drop) {
      return;
    }
    expect(drop.velocity.x).toBeCloseTo(0, 6);
    expect(drop.velocity.y).toBeGreaterThan(0);
  });

  it("follows a parabola whose range matches the projectile prediction", () => {
    model.stepOnce(0.016);
    const drop = model.effluxDrops[0];
    expect(drop).toBeDefined();
    if (!drop) {
      return;
    }

    // Predict from the drop's own state now, not from the idealized efflux: the
    // claim under test is that the integrator traces the parabola implied by
    // wherever the drop actually is and however it is actually moving. That
    // Torricelli sets the launch speed is a separate test above.
    const startX = drop.position.x;
    const startY = drop.position.y;
    const vx = drop.velocity.x;
    const vy = drop.velocity.y;
    const timeToGround = (vy + Math.sqrt(vy * vy + 2 * EARTH_GRAVITY * startY)) / EARTH_GRAVITY;
    const expectedRange = vx * timeToGround;

    let steps = 0;
    while (drop.position.y > 0 && steps < 100000) {
      drop.step(0.0002, EARTH_GRAVITY);
      steps++;
    }

    expect(drop.position.x - startX).toBeCloseTo(expectedRange, 1);
  });

  it("clears drops once they land", () => {
    for (let i = 0; i < 20; i++) {
      model.stepOnce(0.016);
    }
    expect(model.effluxDrops.length).toBeGreaterThan(0);

    // Close the hole so no new drops are emitted, then let the ones in flight
    // finish their fall.
    model.waterTower.isHoleOpenProperty.value = false;
    for (let i = 0; i < 500; i++) {
      model.stepOnce(0.016);
    }
    expect(model.effluxDrops.length).toBe(0);
  });

  it("drains the tank toward empty, slowing as the head falls", () => {
    // The efflux speed goes as √h, so the tank approaches empty asymptotically
    // rather than reaching it — which is Torricelli, not a stuck model.
    for (let i = 0; i < 2000; i++) {
      model.stepOnce(0.016);
    }
    expect(model.waterTower.getFluidLevel()).toBeLessThan(1);
    expect(model.getEffluxSpeed()).toBeLessThan(2);
  });
});

describe("pressure in the tank", () => {
  let model: WaterTowerModel;

  beforeEach(() => {
    model = new WaterTowerModel();
  });

  it("reads air pressure at the water surface", () => {
    const surfaceY = model.waterTower.getFluidSurfaceY();
    expect(model.getPressureAt(0, surfaceY)).toBeCloseTo(model.getAirPressure(surfaceY), 6);
  });

  it("adds ρgh with depth below the surface", () => {
    const surfaceY = model.waterTower.getFluidSurfaceY();
    const depth = 3;
    const expected = model.getAirPressure(surfaceY) + model.fluidDensityProperty.value * EARTH_GRAVITY * depth;
    expect(model.getPressureAt(0, surfaceY - depth)).toBeCloseTo(expected, 6);
  });

  it("reports still water inside the tank", () => {
    const velocity = model.getVelocityAt(0, model.waterTower.baseCenterProperty.value.y + 1);
    expect(velocity).not.toBeNull();
    expect((velocity as { magnitude: number }).magnitude).toBe(0);
  });

  it("reports the hydrostatic pressure inside an attached hose", () => {
    model.hose.isEnabledProperty.value = true;
    model.hose.outletYProperty.value = 5;
    const pressureInHose = model.getPressureAt(17, 4);
    expect(pressureInHose).not.toBeNull();
    expect(pressureInHose as number).toBeGreaterThan(model.getAirPressure(4));
  });

  it("reads air in a hose when the tank is empty or its side hole is dry", () => {
    model.hose.isEnabledProperty.value = true;
    model.hose.outletYProperty.value = 5;
    model.waterTower.fluidVolumeProperty.value = 0;
    expect(model.getPressureAt(17, 4)).toBeCloseTo(model.getAirPressure(4), 6);
    model.waterTower.fluidVolumeProperty.value = TANK_AREA * 0.25;
    expect(model.getPressureAt(17, 4)).toBeCloseTo(model.getAirPressure(4), 6);
  });

  it("refreshes sensor readings when the hose angle changes", () => {
    const updateSensors = vi.spyOn(model, "updateSensorValues");
    model.hose.angleProperty.value = 0;
    expect(updateSensors).toHaveBeenCalledOnce();
  });
});
