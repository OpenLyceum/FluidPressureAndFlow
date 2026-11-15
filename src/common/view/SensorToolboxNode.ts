/**
 * SensorToolboxNode.ts
 *
 * The tray the barometers and speedometers live in until the student pulls one
 * out, and the target they snap back to when dropped on it.
 *
 * The tray holds static pictures of the instruments, not the instruments
 * themselves: pressing one activates a real sensor and hands the drag straight
 * to it. Keeping the stowed and the placed instrument as separate nodes avoids
 * the reparenting dance that would otherwise be needed to move a node between
 * the panel's coordinate frame and the play area's.
 */

import type { Property, TReadOnlyProperty } from "scenerystack/axon";
import { DerivedProperty } from "scenerystack/axon";
import type { Vector2 } from "scenerystack/dot";
import { HBox, Node, type PressListenerEvent } from "scenerystack/scenery";
import { FluidPressureAndFlowPanel } from "../FluidPressureAndFlowPanel.js";

/** Opacity of a slot with nothing left in it. */
const DISABLED_OPACITY = 0.4;

/**
 * All the toolbox needs of an instrument: whether it is out, and where it is.
 * Narrower than {@link Sensor} on purpose, so one tray can hold barometers and
 * speedometers side by side without their differing reading types leaking in.
 */
type StowableSensor = {
  readonly isActiveProperty: Property<boolean>;
  readonly positionProperty: Property<Vector2>;
};

/** One instrument's slot in the tray. */
export type ToolboxItem = {
  /** The sensors this slot can hand out, tried in order. */
  readonly sensors: readonly StowableSensor[];
  /** A static picture of the instrument, sized for the tray. */
  readonly icon: Node;
  /** Accessible name for the slot. */
  readonly accessibleName: TReadOnlyProperty<string>;
  /**
   * Hands the press to the instrument being drawn out, so it follows the pointer
   * straight from the tray into the play area. Called with the tray's press
   * event and the sensor that was handed out.
   */
  readonly onGrab: (sensor: StowableSensor, event: PressListenerEvent) => void;

  /**
   * Where an instrument appears when it is taken with the keyboard rather than
   * dragged. There is no pointer to follow in that case, so it has to land
   * somewhere sensible and be walked from there with the arrow keys.
   */
  readonly keyboardGrabPosition: Vector2;
};

export class SensorToolboxNode extends FluidPressureAndFlowPanel {
  private readonly disposeSensorToolboxNode: () => void;

  public constructor(items: readonly ToolboxItem[]) {
    const slots: Node[] = [];
    const disposers: Array<() => void> = [];

    for (const item of items) {
      const slot = new Node({
        children: [item.icon],
        cursor: "pointer",
        tagName: "button",
        accessibleName: item.accessibleName,
      });

      /** The first instrument still in the tray, or null if the tray is empty. */
      const takeSensor = (): StowableSensor | null =>
        item.sensors.find((sensor) => !sensor.isActiveProperty.value) ?? null;

      slot.addInputListener({
        down: (event: PressListenerEvent) => {
          const sensor = takeSensor();
          if (sensor) {
            sensor.isActiveProperty.value = true;
            item.onGrab(sensor, event);
          }
        },
        click: () => {
          const sensor = takeSensor();
          if (sensor) {
            sensor.positionProperty.value = item.keyboardGrabPosition;
            sensor.isActiveProperty.value = true;
          }
        },
      });

      // A slot with nothing left in it is dimmed and taken out of the tab order,
      // rather than silently doing nothing when pressed.
      const hasAvailableProperty = DerivedProperty.deriveAny(
        item.sensors.map((sensor) => sensor.isActiveProperty),
        () => item.sensors.some((sensor) => !sensor.isActiveProperty.value),
      );
      const updateEnabled = (hasAvailable: boolean) => {
        slot.opacity = hasAvailable ? 1 : DISABLED_OPACITY;
        slot.pickable = hasAvailable;
        slot.focusable = hasAvailable;
      };
      hasAvailableProperty.link(updateEnabled);
      disposers.push(() => {
        hasAvailableProperty.unlink(updateEnabled);
        hasAvailableProperty.dispose();
      });

      slots.push(slot);
    }

    super(new HBox({ spacing: 12, align: "center", children: slots }));

    this.disposeSensorToolboxNode = () => {
      for (const dispose of disposers) {
        dispose();
      }
    };
  }

  public override dispose(): void {
    this.disposeSensorToolboxNode();
    super.dispose();
  }
}
