import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { DependencyResolver } from '../tree';
import { MoveToInteract } from '../dependencies';
import { TaskQueue } from 'mineflayer-utils';
import { Craft } from '../dependencies/craft';
import { Recipe } from 'prismarine-recipe';

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
    canCraft(recipe: Recipe): boolean
    {
        // TODO check materials in inventory
        return false
    }

    prepareRecipe(recipes: Recipe[], cb: (err?: Error, recipe?: Recipe) => void): void
    {
        for (const r of recipes)
        {
            if (this.canCraft(r))
            {
                cb(undefined, r);
                return;
            }
        }

        // TODO Collect materials
        cb(new Error("Not yet implemented!"))
    }

    handle(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
    {
        if (dependency.name !== 'craft')
            throw new Error("Unsupported dependency!");

        const mcData = require('minecraft-data')(this.bot.version)
        const craftItemTask = <Craft>dependency;
        const itemId = mcData.itemsByName[craftItemTask.inputs.itemType].id

        const recipeList = this.bot.recipesAll(itemId, null, true);

        if (recipeList.length === 0)
            throw new Error("Item is not craftable!");

        this.prepareRecipe(recipeList, (err, recipe) => {
            if (err || !recipe)
            {
                cb(err);
                return;
            }

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
            taskQueue.add((cb: Callback) => resolver(moveToCraftingTable, cb));
            taskQueue.add((cb: Callback) => this.bot.craft(recipe, craftItemTask.inputs.count, craftingTable, cb))
            taskQueue.runAll(cb);
        });
    }
}