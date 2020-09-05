import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver, Heuristics } from '../strategy';
import { DependencyResolver } from '../tree';
import { Craft, ObtainItem } from '../dependencies';
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

export class StratCraftToObtain extends StrategyBase
{
    readonly name: string = 'craftItem';

    constructor(solver: Solver)
    {
        super(solver, CraftToObtainInstance);
    }

    estimateHeuristic(dependency: Dependency): Heuristics | null
    {
        if (dependency.name !== 'obtainItem')
            return null;

        const obtainItem = <ObtainItem>dependency;

        if (!isNeeded(this.bot, obtainItem))
            return null;

        return {
            time: 0,
            childTasks: [
                new Craft({
                    itemType: obtainItem.inputs.itemType,
                    count: 1
                })
            ]
        };
    }
}

class CraftToObtainInstance extends StrategyExecutionInstance
{
    handle(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
    {
        if (dependency.name !== 'obtainItem')
            throw new Error("Unsupported dependency!");

        const obtainTask = <ObtainItem>dependency;

        resolver(new Craft({
            itemType: obtainTask.inputs.itemType,
            count: 1
        }), cb);
    }
}