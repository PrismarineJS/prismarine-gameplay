import { StrategyBase, StrategyExecutionInstance, Dependency, Solver, Callback } from "../strategy";
import { CollectBlock, MoveToInteract, BreakBlock, WaitForItemDrop, ObtainItem } from "../dependencies";
import { CollectItemDrops } from "../dependencies/collectItemDrop";
import { Vec3 } from "vec3";
import { DependencyResolver, HeuristicResolver } from "../tree";
import { TaskQueue } from "../taskqueue";
import { Bot } from "mineflayer";

function getBlockPosition(dependency: Dependency, bot: Bot): Vec3
{
    switch (dependency.name)
    {
        case 'collectBlock':
            const collectBlock = <CollectBlock>dependency;
            return collectBlock.inputs.position;

        case 'obtainItem':
            const obtainItem = <ObtainItem>dependency;
            const blockId = require('minecraft-data')(bot.version).blocksByName[obtainItem.inputs.itemType]?.id || -1;
            const position = bot.findBlock({
                matching: b => b.type === blockId,
                maxDistance: 32
            })?.position;

            if (!position)
                throw new Error("Cannot find block!");

            return position;

        default:
            throw new Error("Unsupported dependency!");
    }
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

    estimateHeuristic(dependency: Dependency, resolver: HeuristicResolver): number
    {
        switch (dependency.name)
        {
            case 'collectBlock':
            case 'obtainItem':
                return estimateDistance(dependency, this.bot);

            default:
                return -1;
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
        taskQueue.addTask(cb => resolver(moveToInteract, cb));
        taskQueue.addTask(cb => resolver(breakBlock, cb));
        taskQueue.addTask(cb => resolver(waitForItemDrop, cb));
        taskQueue.addTask(cb => resolver(collectItemDrop, cb));
        taskQueue.runAll(cb);
    }
}