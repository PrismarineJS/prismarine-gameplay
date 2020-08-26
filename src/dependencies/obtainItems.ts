import { Dependency, DependencyInputs, DependencyOutputs } from "../strategy";

export interface ObtainItemsInputs extends DependencyInputs
{
    /**
     * The item ID to obtain.
     */
    itemType: string;

    /**
     * The number to collect.
     */
    count: number;

    /**
     * If false, the items currently in the bot's inventory are not counted.
     */
    countInventory: boolean;
}

export interface ObtainItemsOutputs extends DependencyOutputs
{

}

export class ObtainItems implements Dependency
{
    readonly name: string = 'obtainItems';
    readonly outputs: ObtainItemsOutputs = {};

    constructor(readonly inputs: ObtainItemsInputs)
    {}
}