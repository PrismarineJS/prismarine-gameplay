import { Dependency, DependencyInputs, DependencyOutputs } from "../strategy";
import { Entity } from "prismarine-entity";

export interface CollectItemDropsInputs extends DependencyInputs
{
    items: Entity[];
}

export interface CollectItemDropsOutputs extends DependencyOutputs
{

}

export class CollectItemDrops implements Dependency
{
    readonly name: string = 'collectItemDrops';

    constructor(
        readonly inputs: CollectItemDropsInputs = {
            items: []
        },
        readonly outputs: CollectItemDropsOutputs = {
        })
    { }
}