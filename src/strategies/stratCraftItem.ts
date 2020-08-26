import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { DependencyResolver } from '../tree';
import { MoveToInteract, ObtainItems } from '../dependencies';
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

interface RecipeIngredient
{
    id: number;
    count: number;
}

class CraftItemInstance extends StrategyExecutionInstance
{
    getRequireIngredients(recipe: Recipe): RecipeIngredient[]
    {
        const ingredients: RecipeIngredient[] = [];

        function addOrPut(id?: number): void
        {
            if (id === undefined || id === null)
                return;

            for (const ingredient of ingredients)
            {
                if (ingredient.id === id)
                {
                    ingredient.count++;
                    return;
                }
            }

            ingredients.push({
                id: id,
                count: 1
            });
        }

        if (recipe.inShape) 
        {
            for (const row of recipe.inShape)
            {
                for (const col of row)
                    addOrPut(col.id)
            }
        }
        else
        {
            for (const item of recipe.ingredients)
                addOrPut(item.id)
        }

        return ingredients;
    }

    canCraft(recipe: Recipe): boolean
    {
        const ingredients = this.getRequireIngredients(recipe);

        for (const item of this.bot.inventory.items())
        {
            for (const ingredient of ingredients)
            {
                if (item.type === ingredient.id)
                    ingredient.count -= item.count;
            }
        }

        return ingredients.filter(x => x.count > 0).length === 0;
    }

    prepareRecipe(recipes: Recipe[], cb: (err?: Error, recipe?: Recipe) => void, resolver: DependencyResolver): void
    {
        for (const r of recipes)
        {
            if (this.canCraft(r))
            {
                cb(undefined, r);
                return;
            }
        }

        // TODO Replace with "OR" task group for all recipes

        const recipe = recipes[0];
        const ingredients = this.getRequireIngredients(recipe);
        const mcData = require('minecraft-data')(this.bot.version)

        function getNextIngredient()
        {
            // TODO Replace with orderless task group
            const ingredient = ingredients.pop();

            if (ingredient === undefined)
            {
                cb(undefined, recipe);
                return;
            }
            
            resolver(new ObtainItems({
                itemType: mcData.items[ingredient.id].name,
                count: ingredient.count
            }), err => {
                if (err)
                {
                    cb(err);
                    return;
                }

                getNextIngredient();
            });
        }

        getNextIngredient();
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
        }, resolver);
    }
}