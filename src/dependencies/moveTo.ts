import { Dependency } from "../strategy";
import { Bot } from "mineflayer";

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
    readonly bot: Bot;

    readonly moveTarget: MoveTarget;

    constructor(bot: Bot, moveTarget: MoveTarget)
    {
        this.bot = bot;
        this.moveTarget = moveTarget;
    }
}