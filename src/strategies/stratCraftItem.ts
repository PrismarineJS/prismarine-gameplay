import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { DependencyResolver } from '../tree';
import { MoveToInteract } from '../dependencies';
import { TaskQueue } from 'mineflayer-utils';

export class StratCraftItem extends StrategyBase
{
    readonly name: string = 'craftItem';

    constructor(solver: Solver)
    {
        super(solver, CraftItemInstance);
    }

    estimateHeuristic(dependency: Dependency): number
    {
        switch (dependency.name)
        {
            case 'craft':
                return 1;

            default:
                return -1;
        }
    }
}

class CraftItemInstance extends StrategyExecutionInstance
{
    handle(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
    {
        if (dependency.name !== 'craft')
            throw new Error("Unsupported dependency!");

        const mcData = require('minecraft-data')(this.bot.version)
        const craftItemTask = <CraftItem>dependency;
        const itemId = mcData.itemsByName[craftItemTask.itemType].id

        // @ts-expect-error
        const recipeList = this.bot.recipesAll(itemId, null, true);

        if (recipeList.length === 0)
            throw new Error("Item is not craftable!");

        const craftingTable = this.bot.findBlock({
            matching: mcData.blocksByName.crafting_table.id,
            maxDistance: 64
        });

        if (!craftingTable)
            throw new Error("Could not find crafting table!");

        const moveToCraftingTable = new MoveToInteract({
            position: craftingTable.position,
        });

        const taskQueue = new TaskQueue();
        taskQueue.add(cb => resolver(moveToCraftingTable, cb));
        taskQueue.add(cb => this.bot.craft(recipeList[0], craftItemTask.count, craftingTable, cb))
        taskQueue.runAll(cb);
    }
}