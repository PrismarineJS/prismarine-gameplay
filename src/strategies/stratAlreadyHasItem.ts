import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver, Heuristics } from '../strategy';
import { DependencyResolver } from '../tree';
import { ObtainItem } from '../dependencies';
import { Bot } from 'mineflayer';

function countItemsOfType(bot: Bot, itemType: string): number
{
    let count = 0;

    for (const item of bot.inventory.items())
    {
        if (item.name === itemType)
            count += item.count;
    }

    return count;
}

function isNeeded(bot: Bot, obtainItem: ObtainItem): boolean
{
    if (obtainItem.inputs.countInventory)
        return countItemsOfType(bot, obtainItem.inputs.itemType) === 0;

    return true;
}

export class StratAlreadyHasItem extends StrategyBase
{
    readonly name: string = 'alreadyHasItem';

    constructor(solver: Solver)
    {
        super(solver, AlreadyHasItemInstance);
    }

    estimateHeuristic(dependency: Dependency): Heuristics | null
    {
        if (dependency.name !== 'obtainItem')
            return null;

        const obtainItem = <ObtainItem>dependency;

        if (isNeeded(this.bot, obtainItem))
            return null;

        return {
            time: 0,
            childTasks: []
        };
    }
}

class AlreadyHasItemInstance extends StrategyExecutionInstance
{
    handle(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
    {
        if (dependency.name !== 'obtainItem')
            throw new Error("Unsupported dependency!");

        // Do nothing
        cb();
    }
}