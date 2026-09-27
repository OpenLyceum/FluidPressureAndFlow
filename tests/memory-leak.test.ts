/**
 * Fleet-standard memory-leak regression suite (SceneryStackTemplate / QubitSketch pattern).
 *
 * Creates a disposable model object inside a function boundary, disposes it, forces
 * garbage collection via global.gc (--expose-gc in vitest.config.ts), then asserts via
 * WeakRef that the object was collected. V8 requires a function boundary (not merely
 * a block scope) so local strong references die when the helper returns.
 */

import { describe, expect, it } from "vitest";
import { TimeModel } from "../src/common/TimeModel.js";
import { FlowModel } from "../src/flow/model/FlowModel.js";
import { UnderPressureModel } from "../src/under-pressure/model/UnderPressureModel.js";
import { WaterTowerModel } from "../src/water-tower/model/WaterTowerModel.js";
import { describeDisposalLeaks, forceGC } from "./helpers/memoryLeak.js";

function createAndDisposeTimeModel(): WeakRef<object> {
  const model = new TimeModel();
  const ref = new WeakRef<object>(model);
  model.dispose();
  return ref;
}

/**
 * Runs a screen model through a stretch of simulated time, then disposes it.
 *
 * The dynamic screens create and destroy objects continuously — tracers in the
 * pipe, drops leaving the tank — so a leak here would not be a single retained
 * model but a slow accumulation over a session. Stepping before disposing is what
 * makes that visible: an empty model has nothing to leak.
 */
function createStepAndDispose(create: () => { step(dt: number): void; dispose(): void }): WeakRef<object> {
  const model = create();
  for (let i = 0; i < 120; i++) {
    model.step(1 / 60);
  }
  const ref = new WeakRef<object>(model);
  model.dispose();
  return ref;
}

describe("Memory leak regression", () => {
  it("TimeModel is collected after dispose", async () => {
    const ref = createAndDisposeTimeModel();
    await forceGC(ref);
    expect(ref.deref()).toBeUndefined();
  });

  it("double dispose() does not throw", () => {
    const model = new TimeModel();
    model.dispose();
    expect(() => model.dispose()).not.toThrow();
  });

  it("UnderPressureModel is collected after dispose", async () => {
    const ref = createStepAndDispose(() => new UnderPressureModel());
    await forceGC(ref);
    expect(ref.deref()).toBeUndefined();
  });

  it("FlowModel is collected after dispose, tracers and all", async () => {
    const ref = createStepAndDispose(() => {
      const model = new FlowModel();
      model.injectGrid();
      return model;
    });
    await forceGC(ref);
    expect(ref.deref()).toBeUndefined();
  });

  it("WaterTowerModel is collected after dispose, drops and all", async () => {
    const ref = createStepAndDispose(() => {
      const model = new WaterTowerModel();
      model.waterTower.isHoleOpenProperty.value = true;
      return model;
    });
    await forceGC(ref);
    expect(ref.deref()).toBeUndefined();
  });

  it("clears every tracer and drop on reset, so a session does not accumulate", () => {
    const flow = new FlowModel();
    flow.injectGrid();
    for (let i = 0; i < 60; i++) {
      flow.step(1 / 60);
    }
    expect(flow.particles.length).toBeGreaterThan(0);
    flow.reset();
    expect(flow.particles.length).toBe(0);
    flow.dispose();

    const waterTower = new WaterTowerModel();
    waterTower.waterTower.isHoleOpenProperty.value = true;
    for (let i = 0; i < 60; i++) {
      waterTower.step(1 / 60);
    }
    expect(waterTower.effluxDrops.length).toBeGreaterThan(0);
    waterTower.reset();
    expect(waterTower.effluxDrops.length).toBe(0);
    expect(waterTower.faucetDrops.length).toBe(0);
    waterTower.dispose();
  });

  it("retires tracers rather than letting them pile up off the end of the pipe", () => {
    const flow = new FlowModel();
    for (let i = 0; i < 600; i++) {
      flow.step(1 / 60);
    }
    const afterTenSeconds = flow.particles.length;
    for (let i = 0; i < 1800; i++) {
      flow.step(1 / 60);
    }
    // The drip rate and the transit time are both constant, so the population
    // settles rather than growing without bound.
    expect(flow.particles.length).toBeLessThan(afterTenSeconds * 2);
    flow.dispose();
  });

  it("repeated create/dispose cycles leave no survivors", async () => {
    const refs: WeakRef<object>[] = [];
    for (let i = 0; i < 10; i++) {
      refs.push(createAndDisposeTimeModel());
    }
    await forceGC(refs);
    const survivors = refs.filter((r) => r.deref() !== undefined).length;
    expect(survivors).toBe(0);
  });
});

describeDisposalLeaks([{ name: "TimeModel", create: () => new TimeModel(), idempotentDispose: true }]);
