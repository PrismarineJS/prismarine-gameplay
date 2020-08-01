import { Dependency, DependencyInputs, DependencyOutputs } from "../strategy";

export interface ObtainItemInputs extends DependencyInputs
{
    /**
     * The item ID to obtain.
     */
    readonly itemType: number;
}

export interface ObtainItemOutputs extends DependencyOutputs
{

}

export class ObtainItem implements Dependency
{
    readonly name: string = 'obtainItem';

    constructor(
        readonly inputs: ObtainItemInputs = {
            itemType: 0
        },
        readonly outputs: ObtainItemOutputs = {
        })
    { }
}