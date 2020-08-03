import { Dependency, DependencyInputs, DependencyOutputs } from "../strategy";

export interface MoveToInputs extends DependencyInputs
{
    /**
     * The world x position. If not defined, all x coords are valid.
     */
    x?: number;

    /**
     * The world y position. If not defined, all y coords are valid.
     */
    y?: number;

    /**
     * The world z position. If not defined, all y coords are valid.
     */
    z?: number;

    /**
     * The maximum distance away from the target which is considered valid.
     * If not defined, defaults to same block.
     */
    range: number;
}

export interface MoveToOutputs extends DependencyOutputs
{

}

export class MoveTo implements Dependency
{
    readonly name: string = 'moveTo';

    constructor(
        readonly inputs: MoveToInputs = {
            range: 0.5
        },
        readonly outputs: MoveToOutputs = {
        })
    { }
}