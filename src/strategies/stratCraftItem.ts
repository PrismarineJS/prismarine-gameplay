import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { DependencyResolver, HeuristicResolver } from '../tree';
import { MoveToInteract, ObtainItems } from '../dependencies';
import { TaskQueue } from 'mineflayer-utils';
import { Craft, TaskOrGroup, TaskAndGroup } from '../dependencies';
import { Recipe } from 'prismarine-recipe';
import { Bot } from 'mineflayer';

function getRequireIngredients(recipe: Recipe): RecipeIngredient[]
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

function canCraft(bot: Bot, recipe: Recipe): boolean
{
    const ingredients = getRequireIngredients(recipe);

    for (const item of bot.inventory.items())
    {
        for (const ingredient of ingredients)
        {
            if (item.type === ingredient.id)
                ingredient.count -= item.count;
        }
    }

    return ingredients.filter(x => x.count > 0).length === 0;
}

export class StratCraftItem extends StrategyBase
{
    readonly name: string = 'craftItem';

    constructor(solver: Solver)
    {
        super(solver, CraftItemInstance);
    }

    estimateHeuristic(dependency: Dependency, resolver: HeuristicResolver): number
    {
        switch (dependency.name)
        {
            case 'craft':
                const craftTask = <Craft>dependency;
                const mcData = require('minecraft-data')(this.bot.version)
                const itemId = mcData.itemsByName[craftTask.inputs.itemType].id
                const recipeList = this.bot.recipesAll(itemId, null, true);

                for (const r of recipeList)
                    if (canCraft(this.bot, r))
                        return 1;
                
                const collectOneRecipeTask = new TaskOrGroup();

                for (const recipe of recipeList)
                {
                    const collectIngredientsTask = new TaskAndGroup();
                    collectOneRecipeTask.inputs.tasks.push(collectIngredientsTask);

                    const ingredients = getRequireIngredients(recipe);
                    for (const ingredient of ingredients)
                    {
                        collectIngredientsTask.inputs.tasks.push(new ObtainItems({
                            itemType: mcData.items[ingredient.id].name,
                            count: ingredient.count,
                            countInventory: true
                        }));
                    }
                }

                return resolver(collectOneRecipeTask);

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
    prepareRecipe(recipes: Recipe[], cb: (err?: Error, recipe?: Recipe) => void, resolver: DependencyResolver): void
    {
        for (const r of recipes)
        {
            if (canCraft(this.bot, r))
            {
                cb(undefined, r);
                return;
            }
        }

        const mcData = require('minecraft-data')(this.bot.version)
        const collectOneRecipeTask = new TaskOrGroup();

        for (const recipe of recipes)
        {
            const collectIngredientsTask = new TaskAndGroup();
            collectOneRecipeTask.inputs.tasks.push(collectIngredientsTask);

            const ingredients = getRequireIngredients(recipe);
            for (const ingredient of ingredients)
            {
                collectIngredientsTask.inputs.tasks.push(new ObtainItems({
                    itemType: mcData.items[ingredient.id].name,
                    count: ingredient.count,
                    countInventory: true
                }));
            }

            // @ts-ignore
            collectIngredientsTask.recipe = recipe;
        }

        resolver(collectOneRecipeTask, err => {
            if (err)
            {
                cb(err);
                return;
            }
            
            // @ts-ignore
            cb(undefined, collectOneRecipeTask.outputs.passingTask.recipe);
        })
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