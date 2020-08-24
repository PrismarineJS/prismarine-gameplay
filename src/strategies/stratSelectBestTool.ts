import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { SelectBestTool, Craft } from '../dependencies';

// @ts-ignore
import nbt from 'prismarine-nbt';
import { HeuristicResolver, DependencyResolver } from '../tree';
import { Block } from 'prismarine-block';
import { Item } from 'prismarine-item';
import { Bot, Enchantment } from 'mineflayer';

function estimateCraftTime(dependency: Dependency): number
{
    switch (dependency.name)
    {
        case 'selectBestTool':
            const selectBestTool = <SelectBestTool>dependency;
            if (!selectBestTool.inputs.craftIfNeeded)
                return 0;

            // Let's assume 20 seconds
            return 20 * 20;

        default:
            throw new Error("Unsupported dependency!");
    }
}

function toolListContains(toolList: ItemToEquip[], item: Item): boolean
{
    const enchants = (tool && tool.nbt) ? nbt.simplify(tool.nbt).Enchantments : [];
    const silkTouchId = 0
    const hasSilkTouch = enchantments.find(x => x.id === silkTouchId) !== undefined;

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

function selectBestTool(block: Block, bot: Bot, toolList: ItemToEquip[]): Item | null
{
    const availableTools = bot.inventory.items();

    // TODO Add effects to entity *.d.ts
    // @ts-expect-error
    const effects = bot.entity.effects;

    let fastest = Number.MAX_VALUE;
    let bestTool = null;
    for (const tool of availableTools)
    {
        if (!toolListContains(toolList, tool))
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

function estimateBestToolToCraft(mcData: any, block: Block, requiredDrop?: string): string
{
    // TODO
    return '';
}

interface ItemToEquip
{
    name: string;
    silkTouch: boolean;
}

function getHarvestTools(mcData: any, block: Block): ItemToEquip[]
{
    const harvestTools: number[] = mcData.blocksByName[block.name].harvestTools;
    const tools = [];

    for (const t of harvestTools)
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

function getRequiredToolsFor(mcData: any, block: Block, requiredDrop?: string): ItemToEquip[]
{
    let tools = getHarvestTools(mcData, block);

    if (requiredDrop)
    {
        const blockLoot = mcData.blockLoot[block.name].drops;
        for (const drop of blockLoot)
        {
            if (drop.item !== requiredDrop)
                continue;

            if (drop.silkTouch)
                tools = tools.filter(t => t.silkTouch === false)

            if (drop.noSilkTouch)
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

    estimateHeuristic(dependency: Dependency, resolver: HeuristicResolver): number
    {
        switch (dependency.name)
        {
            case 'selectBestTool':
                return estimateCraftTime(dependency);

            default:
                return -1;
        }
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

        const items = selectBestTool(block, this.bot, toolList);

        const tool = items[0];
        const canCollect = items[1];

        if (!canCollect)
        {
            const craft = new Craft({
                itemType: toolList[0], // TODO Replace with "OR" task group
                count: 1
            });

            resolver(craft, err =>
            {
                if (err)
                {
                    cb(err);
                    return;
                }

                if (tool) this.bot.equip(tool, 'hand', cb);
                else cb();
            });
        }
        else
        {
            if (tool) this.bot.equip(tool, 'hand', cb);
            else cb();
        }
    }
}
