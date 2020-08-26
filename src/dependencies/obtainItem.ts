import { Dependency, DependencyInputs, DependencyOutputs } from "../strategy";

export interface ObtainItemInputs extends DependencyInputs
{
    /**
     * The item name to obtain.
     */
    readonly itemType: string;

    /**
     * If false, the items currently in the bot's inventory are not counted.
     */
    countInventory?: boolean;
}

export interface ObtainItemOutputs extends DependencyOutputs
{

}

export class ObtainItem implements Dependency
{
    readonly name: string = 'obtainItem';
    readonly outputs: ObtainItemOutputs = {};

    constructor(readonly inputs: ObtainItemInputs)
    { }
}