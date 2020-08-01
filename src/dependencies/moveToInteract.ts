import { Dependency, DependencyOutputs, DependencyInputs } from "../strategy";
import { Vec3 } from "vec3";

export interface MoveToInteractInputs extends DependencyInputs
{
    /**
     * The block position.
     */
    position: Vec3;
}

export interface MoveToInteractOutputs extends DependencyOutputs
{

}

export class MoveToInteract implements Dependency
{
    readonly name: string = 'moveToInteract';

    constructor(
        readonly inputs: MoveToInteractInputs = {
            position: new Vec3(0, 0, 0)
        },
        readonly outputs: MoveToInteractOutputs = {
        })
    { }
}