/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import FluidPressureAndFlowColors from "./FluidPressureAndFlowColors.js";
import { FlowScreen } from "./flow/FlowScreen.js";
import { StringManager } from "./i18n/StringManager.js";
import { FluidPressureAndFlowPreferencesModel } from "./preferences/FluidPressureAndFlowPreferencesModel.js";
import { FluidPressureAndFlowPreferencesNode } from "./preferences/FluidPressureAndFlowPreferencesNode.js";
import { UnderPressureScreen } from "./under-pressure/UnderPressureScreen.js";
import { WaterTowerScreen } from "./water-tower/WaterTowerScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  // Simulation-specific preferences; initial values come from fluidPressureAndFlowQueryParameters.
  const simPreferences = new FluidPressureAndFlowPreferencesModel(Tandem.ROOT.createTandem("preferences"));

  // One unit system shared by all three screens, gated on the "match units"
  // preference. Built here because no single screen owns it.
  const sharedUnits = {
    sharedUnitSystemProperty: simPreferences.sharedUnitSystemProperty,
    linkUnitsProperty: simPreferences.linkUnitsProperty,
  };

  const screens = [
    new UnderPressureScreen({
      // The screen name Property updates automatically when the locale changes
      name: stringManager.getScreenNames().underPressureStringProperty,
      tandem: Tandem.ROOT.createTandem("underPressureScreen"),
      backgroundColorProperty: FluidPressureAndFlowColors.backgroundColorProperty,
      sharedUnits: sharedUnits,
    }),
    new FlowScreen({
      // The screen name Property updates automatically when the locale changes
      name: stringManager.getScreenNames().flowStringProperty,
      tandem: Tandem.ROOT.createTandem("flowScreen"),
      backgroundColorProperty: FluidPressureAndFlowColors.backgroundColorProperty,
      sharedUnits: sharedUnits,
    }),
    new WaterTowerScreen({
      // The screen name Property updates automatically when the locale changes
      name: stringManager.getScreenNames().waterTowerStringProperty,
      tandem: Tandem.ROOT.createTandem("waterTowerScreen"),
      backgroundColorProperty: FluidPressureAndFlowColors.backgroundColorProperty,
      sharedUnits: sharedUnits,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new FluidPressureAndFlowPreferencesNode(simPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Credits shown in Help → About. The design is PhET's; this is a port.
    credits: {
      leadDesign: "Sam Reid (PhET Interactive Simulations)",
      softwareDevelopment: "OpenLyceum, ported from PhET Interactive Simulations",
      team: "Noah Podolefsky, Ariel Paul, Trish Loeblein, Kathy Perkins, Rachel Pepper, Bryce Gruneich, John Blanco",
      qualityAssurance: "PhET Interactive Simulations",
    },
  });

  sim.start();
});
