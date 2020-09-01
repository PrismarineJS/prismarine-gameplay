import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver, Heuristics } from '../strategy';
import { SelectBestTool, Craft, TaskOrGroup } from '../dependencies';

// @ts-ignore
import nbt from 'prismarine-nbt';
import { HeuristicResolver, DependencyResolver } from '../tree';
import { Block } from 'prismarine-block';
import { Item } from 'prismarine-item';
import { Bot, Enchantment } from 'mineflayer';

function estimateCraftTime(dependency: Dependency): Heuristics | null
{
    if (dependency.name !== 'selectBestTool')
        return null;

    const selectBestTool = <SelectBestTool>dependency;

    if (!selectBestTool.inputs.craftIfNeeded)
    {
        return {
            time: 0,
            childTasks: []
        };
    }

    // TODO Improve this heuristic.
    return {
        time: 20 * 20, // Let's assume 20 seconds
        childTasks: []
    };
}

function toolListContains(mcData: any, toolList: ItemListEquip, item: Item): boolean
{
    if (toolList === 'all')
        return true;

    const enchants: Enchantment[] = ((item && item.nbt) ? nbt.simplify(item.nbt).Enchantments : []) || [];
    const silkTouchId = mcData.enchantmentsByName.silk_touch.id

    // @ts-ignore
    const hasSilkTouch = enchants.find(x => x.id === silkTouchId) !== undefined;

    if (toolList === 'all_silkTouch')
        return hasSilkTouch;

    if (toolList === 'all_noSilkTouch')
        return !hasSilkTouch;

    for (const l of toolList)
    {
        if (l.name !== item.name)
            continue;
        
        if (l.silkTouch !== hasSilkTouch)
            continue;

        return true;
    }

    return false;
}

function selectBestTool(mcData: any, block: Block, bot: Bot, toolList: ItemListEquip): Item | null
{
    const availableTools = bot.inventory.items();

    // TODO Add effects to entity *.d.ts
    // @ts-expect-error
    const effects = bot.entity.effects;

    let fastest = Number.MAX_VALUE;
    let bestTool = null;
    for (const tool of availableTools)
    {
        if (!toolListContains(mcData, toolList, tool))
            continue;

        const enchants = (tool && tool.nbt) ? nbt.simplify(tool.nbt).Enchantments : [];

        // TODO Add digTime(6 args) to block *.d.ts
        // @ts-expect-error
        const digTime = block.digTime(tool ? tool.type : null, false, false, false, enchants, effects);

        if (digTime < fastest)
        {
            fastest = digTime;
            bestTool = tool;
        }
    }

    return bestTool;
}

interface ItemToEquip
{
    name: string;
    silkTouch: boolean;
}

type ItemListEquip = ItemToEquip[] | 'all' | 'all_silkTouch' | 'all_noSilkTouch'

function getHarvestTools(mcData: any, block: Block): ItemListEquip
{
    const harvestTools: number[] = mcData.blocksByName[block.name].harvestTools;

    if (!harvestTools)
        return 'all';

    const tools = [];

    for (const t in harvestTools)
    {
        const itemData = mcData.items[t];
        tools.push({
            name: itemData.name,
            silkTouch: false
        });
        tools.push({
            name: itemData.name,
            silkTouch: true
        });
    }

    return tools;
}

function getRequiredToolsFor(mcData: any, block: Block, requiredDrop?: string): ItemListEquip
{
    let tools = getHarvestTools(mcData, block);

    if (requiredDrop)
    {
        const blockLoot = mcData.blockLoot[block.name].drops;
        for (const drop of blockLoot)
        {
            if (drop.item !== requiredDrop)
                continue;

            if (tools === 'all' && drop.silkTouch)
                return 'all_silkTouch'

            if (tools === 'all' && drop.noSilkTouch)
                return 'all_noSilkTouch'

            if (drop.silkTouch)
                // @ts-ignore
                tools = tools.filter(t => t.silkTouch === false)

            if (drop.noSilkTouch)
                // @ts-ignore
                tools = tools.filter(t => t.silkTouch === true)
        }
    }

    return tools
}

export class StratSelectBestTool extends StrategyBase
{
    readonly name: string = 'selectBestTool';

    constructor(solver: Solver)
    {
        super(solver, SelectBestToolInstance);
    }

    estimateHeuristic(dependency: Dependency, resolver: HeuristicResolver): Heuristics | null
    {
        if (dependency.name !== 'selectBestTool')
            return null;

        return estimateCraftTime(dependency);
    }
}

class SelectBestToolInstance extends StrategyExecutionInstance
{
    handle(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
    {
        if (dependency.name !== 'selectBestTool')
            throw new Error("Unsupported dependency!");

        const selectBestToolTask = <SelectBestTool>dependency;
        const block = selectBestToolTask.inputs.block;
        const requiredDrop = selectBestToolTask.inputs.requiredDrop;

        const mcData = require('minecraft-data')(this.bot.version);
        const toolList = getRequiredToolsFor(mcData, block, requiredDrop);

        const item = selectBestTool(mcData, block, this.bot, toolList);

        if (!item && toolList !== 'all')
        {
            const taskOrGroupTask = new TaskOrGroup();

            for (const tool of toolList)
            {
                taskOrGroupTask.inputs.tasks.push(new Craft({
                    // @ts-ignore
                    itemType: tool.name,
                    count: 1
                }));

                // TODO Add enchant tasks for silk touch items
            }

            resolver(taskOrGroupTask, err =>
            {
                if (err)
                {
                    cb(err);
                    return;
                }

                const item2 = selectBestTool(mcData, block, this.bot, toolList);
                if (item2) this.bot.equip(item2, 'hand', cb);
                else cb(new Error("Failed to selected item!"));
            });
        }
        else
        {
            if (item) this.bot.equip(item, 'hand', cb);
            else cb();
        }
    }
}
