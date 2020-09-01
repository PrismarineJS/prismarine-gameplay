import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver, Heuristics } from '../strategy';
import { ObtainItems } from '../dependencies/obtainItems';
import { ObtainItem } from '../dependencies';
import { DependencyResolver, HeuristicResolver } from '../tree';
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

function countNeeded(bot: Bot, obtainItemsTask: ObtainItems): number
{
    let count = obtainItemsTask.inputs.count;

    if (obtainItemsTask.inputs.countInventory)
        count -= countItemsOfType(bot, obtainItemsTask.inputs.itemType);

    count = Math.max(0, count);
    return count;
}

export class StratCollectResources extends StrategyBase
{
    readonly name: string = 'collectResources';

    constructor(solver: Solver)
    {
        super(solver, CollectResourcesInstance);
    }

    estimateHeuristic(dependency: Dependency, resolver: HeuristicResolver): Heuristics | null
    {
        if (dependency.name !== 'obtainItems')
            return null;

        const obtainItems = <ObtainItems>dependency;
        const needed = countNeeded(this.bot, obtainItems);

        if (needed === 0)
        {
            return {
                time: 0,
                childTasks: []
            };
        }

        const childTasks = [];

        for (let i = 0; i < needed; i++)
        {
            childTasks.push(new ObtainItem({
                itemType: obtainItems.inputs.itemType,
                countInventory: false
            }));
        }

        return {
            time: 0,
            childTasks: childTasks
        };
    }
}

class CollectResourcesInstance extends StrategyExecutionInstance
{
    handle(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
    {
        const obtainItems = <ObtainItems>dependency;
        const collectAnother = () =>
        {
            const remaining = countNeeded(this.bot, obtainItems);
            if (remaining === 0)
            {
                cb();
                return;
            }

            resolver(new ObtainItem({
                itemType: obtainItems.inputs.itemType,
                countInventory: false
            }), err =>
            {
                if (err)
                {
                    cb(err)
                    return;
                }

                collectAnother();
            });
        }

        collectAnother();
    }
}
