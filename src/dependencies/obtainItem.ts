import { Dependency } from "../strategy";
import { Bot } from "mineflayer";

export class ObtainItem implements Dependency
{
    readonly name: string = 'obtainItem';
    readonly bot: Bot;

    readonly itemType: number;

    constructor(bot: Bot, itemType: number)
    {
        this.bot = bot;
        this.itemType = itemType;
    }
}