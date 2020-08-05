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

function getDrops(block: Block, item?: Item, enchantments?: Enchantment[]): string[]
{
    // TODO

    return [];
}

function selectBestTool(block: Block, bot: Bot, requiredDrop?: string): [Item | null, boolean]
{
    const availableTools = bot.inventory.items();

    // TODO Add effects to entity *.d.ts
    // @ts-expect-error
    const effects = bot.entity.effects;

    let fastest = Number.MAX_VALUE;
    let bestTool = null;
    for (const tool of availableTools)
    {
        const enchants = (tool && tool.nbt) ? nbt.simplify(tool.nbt).Enchantments : [];

        if (requiredDrop)
        {
            if (getDrops(block, tool, enchants).indexOf(requiredDrop) < 0)
                continue;
        }

        // TODO Add digTime(6 args) to block *.d.ts
        // @ts-expect-error
        const digTime = block.digTime(tool ? tool.type : null, false, false, false, enchants, effects);

        if (digTime < fastest)
        {
            fastest = digTime;
            bestTool = tool;
        }
    }

    if (bestTool)
        return [bestTool, true];

    if (requiredDrop) return [null, getDrops(block).indexOf(requiredDrop) >= 0];
    else return [null, true];
}

function estimateBestToolToCraft(): string
{
    // TODO
    return '';
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

        const block = (<SelectBestTool>dependency).inputs.block;

        const items = selectBestTool(block, this.bot);

        const tool = items[0];
        const canCollect = items[1];

        if (!canCollect)
        {
            const craft = new Craft({
                itemType: estimateBestToolToCraft(),
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
