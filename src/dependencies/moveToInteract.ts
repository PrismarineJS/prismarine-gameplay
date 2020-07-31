import { Dependency } from "../strategy";

export interface MoveInteractTarget
{
    /**
     * The block x position.
     */
    x: number;

    /**
     * The block y position.
     */
    y: number;

    /**
     * The block z position.
     */
    z: number;
}

export class MoveToInteract implements Dependency
{
    readonly name: string = 'moveToInteract';

    readonly moveTarget: MoveInteractTarget;

    constructor(moveTarget: MoveInteractTarget)
    {
        this.moveTarget = moveTarget;
    }
}