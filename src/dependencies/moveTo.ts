import { Dependency } from "../strategy";

export interface MoveTarget
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
    range?: number;
}

export class MoveTo implements Dependency
{
    readonly name: string = 'moveTo';
    readonly moveTarget: MoveTarget;

    constructor(moveTarget: MoveTarget)
    {
        this.moveTarget = moveTarget;
    }
}