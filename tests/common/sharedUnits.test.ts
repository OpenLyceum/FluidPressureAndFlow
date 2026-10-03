import { BooleanProperty, EnumerationProperty } from "scenerystack/axon";
import { describe, expect, it } from "vitest";
import { UnitSystem } from "../../src/common/model/units.js";
import { UnderPressureModel } from "../../src/under-pressure/model/UnderPressureModel.js";

describe("shared unit preferences", () => {
  it("stops updating a disposed model", () => {
    const sharedUnitSystemProperty = new EnumerationProperty(UnitSystem.METRIC);
    const linkUnitsProperty = new BooleanProperty(true);
    const model = new UnderPressureModel({ sharedUnitSystemProperty, linkUnitsProperty });
    model.dispose();

    sharedUnitSystemProperty.value = UnitSystem.ENGLISH;
    expect(model.unitSystemProperty.value).toBe(UnitSystem.METRIC);
    linkUnitsProperty.value = false;
    linkUnitsProperty.value = true;
    expect(model.unitSystemProperty.value).toBe(UnitSystem.METRIC);
    model.unitSystemProperty.value = UnitSystem.ATMOSPHERES;
    expect(sharedUnitSystemProperty.value).toBe(UnitSystem.ENGLISH);
  });
});
