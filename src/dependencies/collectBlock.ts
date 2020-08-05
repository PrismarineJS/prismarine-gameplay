import { DependencyInputs, DependencyOutputs, Dependency } from "../strategy";
import { Vec3 } from "vec3";

export interface CollectBlockInputs extends DependencyInputs
{
    /**
     * The position of the block to collect.
     */
    position: Vec3;

    /**
     * The name of the desired item drop. If not defined, the bot has no preference.
     */
    requiredDrop?: string;
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