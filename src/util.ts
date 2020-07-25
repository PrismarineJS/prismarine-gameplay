import { FlagContainer, Flag } from "./solver/flag";
import { ModifiedBlocksFlag } from "./flags";
import { Strategy } from "./solver";
import { GetBlocksThatDropStrategy, BreakBlockStrategy } from "./strats";
import { Bot } from "mineflayer";

function registerFlag(container: FlagContainer, bot: Bot, flag: Flag): void
{
    container.flags.push(flag);
    flag.initializeRealValue(bot);
}

export function defaultFlags(bot: Bot): FlagContainer
{
    const container = new FlagContainer();

    registerFlag(container, bot, new ModifiedBlocksFlag());

    return container;
}

export function defaultStrategies(bot: Bot): Strategy[]
{
    return [
        new GetBlocksThatDropStrategy(bot),
        new BreakBlockStrategy(bot)
    ]
}