import { Dependency, DependencyInputs, DependencyOutputs } from "../strategy";
import { Vec3 } from "vec3";
import { Entity } from "prismarine-entity";

export interface WaitForItemDropInputs extends DependencyInputs
{
    /**
     * The position in the world where the item will drop at.
     */
    position: Vec3;

    /**
     * The maximum distance from the item to search for.
     */
    maxDistance: number;

    /**
     * The maximum number of ticks to wait for the item to drop.
     */
    maxTicks: number;

    /**
     * If an item drops, should additional ticks be allocated to wait
     * for more drops to spawn in that same location?
     */
    groupItems: boolean;
}

export interface WaitForItemDropOutputs extends DependencyOutputs
{
    /**
     * Result Type:
     * The list of items which were dropped.
     */
    itemDrops: Entity[];
}

export class WaitForItemDrop implements Dependency
{
    readonly name: string = 'waitForItemDrop';

    constructor(
        readonly inputs: WaitForItemDropInputs = {
            position: new Vec3(0, 0, 0),
            maxDistance: 1,
            maxTicks: 50,
            groupItems: true
        },
        readonly outputs: WaitForItemDropOutputs = {
            itemDrops: []
        })
    { }
}