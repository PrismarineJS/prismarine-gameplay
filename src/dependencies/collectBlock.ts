import { DependencyInputs, DependencyOutputs, Dependency } from "../strategy";
import { Vec3 } from "vec3";

export interface CollectBlockInputs extends DependencyInputs
{
    position: Vec3;
}

export interface CollectBlockOutputs extends DependencyOutputs
{

}

export class CollectBlock implements Dependency
{
    readonly name: string = 'collectBlock';

    constructor(
        readonly inputs: CollectBlockInputs = {
            position: new Vec3(0, 0, 0)
        },
        readonly outputs: CollectBlockOutputs = {
        }
    ) { }
}