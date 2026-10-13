import { expect, type Page, test } from "@playwright/test";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import type { DragListener, Node, Path } from "scenerystack/scenery";
import type { FlowModel } from "../../src/flow/model/FlowModel.js";
import type { MysteryQuantity } from "../../src/under-pressure/model/MysteryPoolModel.js";
import type { PoolScene } from "../../src/under-pressure/model/PoolScene.js";
import type { UnderPressureModel } from "../../src/under-pressure/model/UnderPressureModel.js";
import type { WaterTowerModel } from "../../src/water-tower/model/WaterTowerModel.js";

test.setTimeout(30_000);

const pageErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(({ page }) => {
  expect(pageErrors.get(page)).toEqual([]);
});

type ReviewSim = {
  simScreens: [
    { model: UnderPressureModel; view: Node },
    { model: FlowModel; view: Node },
    { model: WaterTowerModel; view: Node },
  ];
  selectedScreenProperty: { value: unknown };
};

declare global {
  interface Window {
    instrumentTestSim: ReviewSim;
  }
}

async function launch(page: Page, screen: number, locale = "en"): Promise<void> {
  await page.goto(`/?initialScreen=${screen}&locale=${locale}&ea`);
  await page.waitForSelector("#sim");
  await page.waitForFunction(() => {
    const sim = (window as unknown as { phet: { joist: { sim?: ReviewSim } } }).phet?.joist?.sim;
    if (!sim?.simScreens[2]?.view) {
      return false;
    }
    window.instrumentTestSim = sim;
    return true;
  });
}

function instrument(page: Page, name: string | RegExp) {
  return page.locator('div.a11y-pdom-element[tabindex="0"]').filter({ hasText: name }).filter({ visible: true });
}

test("mystery choices hide the numeric value and restore the normal sliders", async ({ page }) => {
  await launch(page, 1);
  await page.evaluate(() => {
    const model = window.instrumentTestSim.simScreens[0].model as UnderPressureModel;
    const scenes = model.sceneProperty.value.constructor as typeof PoolScene;
    model.sceneProperty.value = scenes.MYSTERY;
  });
  await expect(page.getByRole("slider", { name: "Fluid Density", exact: true })).toHaveCount(0);
  await expect(page.getByRole("slider", { name: "Gravity", exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => {
      const sliders: Array<{ opacity: number; pdomVisible: boolean }> = [];
      const visit = (node: Node) => {
        if (node.constructor.name === "UnitSlider") {
          sliders.push({ opacity: node.opacity, pdomVisible: node.pdomVisible });
        }
        node.children.forEach(visit);
      };
      visit(window.instrumentTestSim.simScreens[0].view);
      return sliders.filter((slider) => slider.opacity === 0 && !slider.pdomVisible).length;
    }),
  ).toBe(1);
  await page.evaluate(() => {
    const model = window.instrumentTestSim.simScreens[0].model as UnderPressureModel;
    const quantities = model.mysteryPool.mysteryQuantityProperty.value.constructor as typeof MysteryQuantity;
    model.mysteryPool.mysteryQuantityProperty.value = quantities.GRAVITY;
  });
  await expect(page.getByRole("slider", { name: "Gravity", exact: true })).toHaveCount(0);
  await expect(page.getByRole("slider", { name: "Fluid Density", exact: true })).toBeVisible();
  await page.evaluate(() => {
    const model = window.instrumentTestSim.simScreens[0].model as UnderPressureModel;
    const scenes = model.sceneProperty.value.constructor as typeof PoolScene;
    model.sceneProperty.value = scenes.SQUARE;
  });
  await expect(page.getByRole("slider", { name: "Gravity", exact: true })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Fluid Density", exact: true })).toBeVisible();
});

test("barometer descriptions follow pressure, probe position and units", async ({ page }) => {
  await launch(page, 1);
  await page.evaluate(() => {
    const model = window.instrumentTestSim.simScreens[0].model as UnderPressureModel;
    const barometer = model.barometers[0];
    if (barometer) {
      barometer.positionProperty.value = barometer.positionProperty.value.plusXY(4, -4.5);
      barometer.isActiveProperty.value = true;
    }
  });
  const barometer = instrument(page, /^Barometer$/);
  await expect(barometer).toHaveAccessibleDescription(/kPa\. Probe at x 0.0, y -2.5 m/);
  await barometer.focus();
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(250);
  await page.keyboard.up("ArrowUp");
  await barometer.press("ArrowUp");
  await barometer.press("ArrowUp");
  await expect(barometer).not.toHaveAccessibleDescription(/y -2.5 m/);
  await page.getByRole("radio", { name: "English", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(barometer).toHaveAccessibleDescription(/psi\. Probe at x 0.0, y -[\d.]+ ft/);
  await page.evaluate(() => {
    const model = window.instrumentTestSim.simScreens[0].model as UnderPressureModel;
    const sensor = model.barometers[0];
    if (sensor) {
      sensor.positionProperty.value = sensor.positionProperty.value.plusXY(8, 0);
    }
  });
  await expect(barometer).toHaveAccessibleDescription(/No reading/);
});

test("flow instruments expose speed and every flux meter reading while paused", async ({ page }) => {
  await launch(page, 2);
  await page.evaluate(() => {
    const model = window.instrumentTestSim.simScreens[1].model as FlowModel;
    model.isPlayingProperty.value = false;
    model.fluxMeter.isVisibleProperty.value = true;
    const sensor = model.velocitySensors[0];
    if (sensor) {
      sensor.positionProperty.value = sensor.positionProperty.value.plusXY(-1, -2.5);
      sensor.isActiveProperty.value = true;
    }
  });
  await expect(instrument(page, /^Speedometer$/)).toHaveAccessibleDescription(/1.6 m\/s\. Probe at x 0.0, y -2.0 m/);
  const meter = instrument(page, /^Flux Meter$/);
  await expect(meter).toHaveAccessibleDescription(
    /Flow Rate: 5000 L\/s\. Area: 3.14 m²\. Flux: 1591.55 L\/\(m²·s\).*x -3.0 m/,
  );
  await page.evaluate(() => {
    const model = window.instrumentTestSim.simScreens[1].model as FlowModel;
    model.pipe.flowRateProperty.value = 10;
  });
  await expect(instrument(page, /^Speedometer$/)).toHaveAccessibleDescription(/3.2 m\/s/);
  await expect(meter).toHaveAccessibleDescription(/Flow Rate: 10000 L\/s/);
});

test("the hose lowers normally and stays above ground when its aim changes", async ({ page }) => {
  await launch(page, 3);
  await page.getByRole("checkbox", { name: "Hose", exact: true }).focus();
  await page.keyboard.press("Space");
  const height = instrument(page, /^Tank Height$/).last();
  await height.focus();
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(250);
  await page.keyboard.up("ArrowDown");
  const lowered = await page.evaluate(
    () => (window.instrumentTestSim.simScreens[2].model as WaterTowerModel).hose.outletYProperty.value,
  );
  expect(lowered).toBeLessThan(9);
  expect(lowered).toBeGreaterThanOrEqual(6);
  await page.evaluate(() => {
    const model = window.instrumentTestSim.simScreens[2].model as WaterTowerModel;
    model.hose.angleProperty.value = 0;
    model.hose.outletYProperty.value = 1;
    model.hose.angleProperty.value = Math.PI / 2;
  });
  expect(
    await page.evaluate(
      () => (window.instrumentTestSim.simScreens[2].model as WaterTowerModel).hose.outletYProperty.value,
    ),
  ).toBe(6);
  await height.focus();
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(250);
  await page.keyboard.up("ArrowUp");
  const raised = await page.evaluate(
    () => (window.instrumentTestSim.simScreens[2].model as WaterTowerModel).hose.outletYProperty.value,
  );
  expect(raised).toBeGreaterThan(6);
  expect(raised).toBeLessThanOrEqual(14);
});

test("instrument descriptions use localized text", async ({ page }) => {
  await launch(page, 1, "fr");
  await page.evaluate(() => {
    const model = window.instrumentTestSim.simScreens[0].model as UnderPressureModel;
    const sensor = model.barometers[0];
    if (sensor) {
      sensor.positionProperty.value = sensor.positionProperty.value.plusXY(4, -4.5);
      sensor.isActiveProperty.value = true;
    }
  });
  await expect(instrument(page, /^Baromètre$/)).toHaveAccessibleDescription(/kPa\. Sonde à x 0.0, y -2.5 m/);
});

test("a probe inside the rendered hose samples water pressure", async ({ page }) => {
  await launch(page, 3);
  await page.getByRole("checkbox", { name: "Hose", exact: true }).focus();
  await page.keyboard.press("Space");
  const reading = await page.evaluate(() => {
    const screen = window.instrumentTestSim.simScreens[2];
    const model = screen.model;
    const hoseNodes: Node[] = [];
    const visit = (node: Node) => {
      if (node.constructor.name === "HoseNode") {
        hoseNodes.push(node);
      }
      node.children.forEach(visit);
    };
    visit(screen.view);
    const hoseNode = hoseNodes[0];
    const pipe = hoseNode?.children[0] as Path;
    const listener = hoseNode?.children[1]?.inputListeners.find(
      (input) => input.constructor.name === "DragListener",
    ) as DragListener;
    const probe = model.waterTower.baseCenterProperty.value.plusXY(7, 0.75);
    const viewPoint = (listener.transform as ModelViewTransform2).modelToViewPosition(probe);
    return {
      insideArtwork: pipe.shape?.containsPoint(viewPoint),
      pressure: model.getPressureAt(probe.x, probe.y),
      expected: model.getAirPressure(9) + 1000 * 9.8 * (9 - probe.y),
      air: model.getAirPressure(probe.y),
    };
  });
  expect(reading.insideArtwork).toBe(true);
  expect(reading.pressure).toBeCloseTo(reading.expected, 6);
  expect(reading.pressure).not.toBe(reading.air);
});
