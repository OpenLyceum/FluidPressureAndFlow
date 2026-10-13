import { Vector2 } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import { Hose } from "../../src/water-tower/model/Hose.js";
import { getMinOutletY } from "../../src/water-tower/model/HoseGeometry.js";
import { WaterTowerModel } from "../../src/water-tower/model/WaterTowerModel.js";

describe("hose geometry and pressure", () => {
  it("samples water in the drawn horizontal run instead of air", () => {
    const model = new WaterTowerModel();
    model.hose.isEnabledProperty.value = true;
    const point = new Vector2(7, 11.75);
    expect(model.hose.getPipeShape(model.waterTower.getHolePosition()).containsPoint(point)).toBe(true);
    expect(model.getPressureAt(point.x, point.y)).toBeCloseTo(model.getAirPressure(9) + 1000 * 9.8 * (9 - point.y), 6);
    expect(model.getPressureAt(point.x, point.y)).not.toBe(model.getAirPressure(point.y));
    model.dispose();
  });

  it("uses the painted outline throughout changes in radius, altitude and aim", () => {
    const hose = new Hose();
    hose.isEnabledProperty.value = true;
    for (const attachment of [new Vector2(3.5, 6.5), new Vector2(6.5, 15.5)]) {
      for (const angle of [0, Math.PI / 4, Math.PI / 2]) {
        hose.angleProperty.value = angle;
        for (const outletY of [getMinOutletY(angle), 9, 14]) {
          hose.outletYProperty.value = outletY;
          const shape = hose.getPipeShape(attachment);
          // Away from the nozzle, containment must agree with the painted water.
          for (let x = attachment.x + 0.25; x < 12; x += 0.5) {
            for (let y = 0.25; y < 17; y += 0.5) {
              expect(hose.containsPoint(attachment, x, y)).toBe(shape.containsPoint(new Vector2(x, y)));
            }
          }
          expect(shape.bounds.minY).toBeGreaterThanOrEqual(-1e-8);
        }
      }
    }
  });

  it("reuses the outline until the attachment, outlet or aim changes", () => {
    const hose = new Hose();
    const attachment = new Vector2(5, 11.5);
    const initial = hose.getPipeShape(attachment);
    expect(hose.getPipeShape(attachment.copy())).toBe(initial);
    hose.outletYProperty.value = 10;
    const raised = hose.getPipeShape(attachment);
    expect(raised).not.toBe(initial);
    hose.angleProperty.value = 0;
    const aimed = hose.getPipeShape(attachment);
    expect(aimed).not.toBe(raised);
    expect(hose.getPipeShape(attachment.plusXY(1, 0))).not.toBe(aimed);
    hose.reset();
    expect(hose.containsPoint(attachment, 7, 11.75)).toBe(false);
  });
});
