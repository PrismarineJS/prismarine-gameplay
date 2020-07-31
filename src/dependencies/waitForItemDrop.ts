import { Dependency } from "../strategy";
import { Vec3 } from "vec3";
import { Entity } from "prismarine-entity";

export class WaitForItemDrop implements Dependency
{
    readonly name: string = 'waitForItemDrop';

    /**
     * The position in the world where the item will drop at.
     */
    readonly position: Vec3;

    /**
     * The maximum distance from the item to search for.
     */
    readonly maxDistance: number;

    /**
     * The maximum number of ticks to wait for the item to drop.
     */
    readonly maxTicks: number;

    /**
     * If an item drops, should additional ticks be allocated to wait
     * for more drops to spawn in that same location?
     */
    readonly groupItems: boolean;

    /**
     * Result Type:
     * The list of items which were dropped.
     */
    itemDrops: Entity[] = [];

    constructor(position: Vec3, maxDistance = 1.5, maxTicks = 50, groupItems = true)
    {
        this.position = position;
        this.maxDistance = maxDistance;
        this.maxTicks = maxTicks;
        this.groupItems = groupItems;
    }
}