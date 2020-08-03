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
}

export interface ObtainItemsOutputs extends DependencyOutputs
{

}

export class ObtainItems implements Dependency
{
    readonly name: string = 'obtainItems';

    constructor(
        readonly inputs: ObtainItemsInputs = {
            itemType: 'air',
            count: 1
        },
        readonly outputs: ObtainItemsOutputs = {
        })
    { }
}