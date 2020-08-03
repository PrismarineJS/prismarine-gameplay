import { Dependency, DependencyInputs, DependencyOutputs } from "../strategy";
import { Vec3 } from "vec3";

export interface BreakBlockInputs extends DependencyInputs
{
    /**
     * The position of the block.
     */
    position: Vec3;
}

export interface BreakBlockOutputs extends DependencyOutputs
{

}

export class BreakBlock implements Dependency
{
    readonly name: string = 'breakBlock';

    constructor(
        readonly inputs: BreakBlockInputs = {
            position: new Vec3(0, 0, 0)
        },
        readonly outputs: BreakBlockOutputs = {

        })
    { }
}