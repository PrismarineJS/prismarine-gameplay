import { Dependency, DependencyInputs, DependencyOutputs } from "../strategy";

export interface CraftInputs extends DependencyInputs
{
    /**
     * The item type to craft.
     */
    itemType: string;

    /**
     * The minimum number of that item to craft.
     */
    count: number;
}

export interface CraftOutputs extends DependencyOutputs
{

}

export class Craft implements Dependency
{
    readonly name: string = 'craft';
    readonly outputs: CraftOutputs = {};

    constructor(readonly inputs: CraftInputs) { }
}