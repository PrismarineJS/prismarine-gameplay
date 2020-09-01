import { StrategyBase, StrategyExecutionInstance, Dependency, Solver, Callback, Heuristics } from "../strategy";
import { CollectBlock, MoveToInteract, BreakBlock, WaitForItemDrop, ObtainItem } from "../dependencies";
import { CollectItemDrops } from "../dependencies/collectItemDrop";
import { Vec3 } from "vec3";
import { DependencyResolver, HeuristicResolver } from "../tree";
import { TaskQueue } from "mineflayer-utils";
import { Bot } from "mineflayer";

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

function getBlockPosition(dependency: Dependency, bot: Bot): Vec3
{
    switch (dependency.name)
    {
        case 'collectBlock':
            const collectBlock = <CollectBlock>dependency;
            return collectBlock.inputs.position;

        case 'obtainItem':
            const obtainItem = <ObtainItem>dependency;

            const blockIds = getBlocksThatDrop(bot, obtainItem.inputs.itemType);
            const position = bot.findBlock({
                // @ts-expect-error
                matching: blockIds,
                maxDistance: 32
            })?.position;

            if (!position)
                throw new Error("Cannot find block!");

            return position;

        default:
            throw new Error("Unsupported dependency!");
    }
}

function getBlocksThatDrop(bot: Bot, requiredDrop: string): number[]
{
    const mcData = require('minecraft-data')(bot.version);
    const ids: number[] = [];

    for (const blockLoot of mcData.blockLootArray)
    {
        for (const drop of blockLoot.drops)
        {
            if (drop.item === requiredDrop)
            {
                ids.push(mcData.blocksByName[blockLoot.block].id);
                break;
            }
        }
    }

    return ids;
}

function getRequiredDrop(dependency: Dependency): string | undefined
{
    switch (dependency.name)
    {
        case 'collectBlock':
            const collectBlock = <CollectBlock>dependency;
            return collectBlock.inputs.requiredDrop;

        case 'obtainItem':
            const obtainItem = <ObtainItem>dependency;
            return obtainItem.inputs.itemType;

        default:
            throw new Error("Unsupported dependency!");
    }
}

function estimateDistance(dependency: Dependency, bot: Bot): number
{
    const position = getBlockPosition(dependency, bot);

    let distance = bot.entity.position.distanceTo(position);
    distance *= 1.2; // 20% for pathfinding around stuff
    distance *= 10; // Estimates 10 ticks per block movement

    // Assume it'll take as long to collect the block as it does to get there.
    // Help account for things like crafting the item if needed.
    distance *= 2;

    return distance;
}

export class StratCollectBlock extends StrategyBase
{
    readonly name: string = 'collectBlock';

    constructor(solver: Solver)
    {
        super(solver, CollectBlockInstance);
    }

    estimateHeuristic(dependency: Dependency, resolver: HeuristicResolver): Heuristics | null
    {
        // TODO Add child tasks

        let time = -1;

        switch (dependency.name)
        {
            case 'collectBlock':
                time = estimateDistance(dependency, this.bot);
                break;

            case 'obtainItem':
                const obtainItem = <ObtainItem>dependency;

                if (!isNeeded(this.bot, obtainItem)) time = -1;
                else time = estimateDistance(dependency, this.bot);
                break;
        }

        if (time < 0)
            return null;
        
        return {
            time: time,
            childTasks: []
        }
    }
}

class CollectBlockInstance extends StrategyExecutionInstance
{
    handle(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
    {
        const position = getBlockPosition(dependency, this.bot);
        const requiredDrop = getRequiredDrop(dependency);

        const moveToInteract = new MoveToInteract({
            position: position
        });

        const breakBlock = new BreakBlock({
            position: position,
            requiredDrop: requiredDrop
        });

        const waitForItemDrop = new WaitForItemDrop({
            position: position,
            maxDistance: 1,
            maxTicks: 10,
            groupItems: true
        });

        const collectItemDrop = new CollectItemDrops({
            items: waitForItemDrop.outputs.itemDrops
        });

        const taskQueue = new TaskQueue();
        taskQueue.add(cb => resolver(moveToInteract, cb));
        taskQueue.add(cb => resolver(breakBlock, cb));
        taskQueue.add(cb => resolver(waitForItemDrop, cb));
        taskQueue.add(cb => resolver(collectItemDrop, cb));
        taskQueue.runAll(cb);
    }
}