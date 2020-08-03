import { Dependency, DependencyInputs, DependencyOutputs } from "../strategy";

export interface ObtainItemInputs extends DependencyInputs
{
    /**
     * The item name to obtain.
     */
    readonly itemType: string;
}

export interface ObtainItemOutputs extends DependencyOutputs
{

}

export class ObtainItem implements Dependency
{
    readonly name: string = 'obtainItem';

    constructor(
        readonly inputs: ObtainItemInputs = {
            itemType: 'air'
        },
        readonly outputs: ObtainItemOutputs = {
        })
    { }
}