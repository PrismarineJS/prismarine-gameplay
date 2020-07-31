import { Dependency } from "../strategy";

export interface MoveTarget
{
    x: number;
    y?: number;
    z: number;
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