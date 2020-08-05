import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { BreakBlock } from '../dependencies/breakBlock';
import { MoveToInteract, SelectBestTool } from '../dependencies';

// @ts-ignore
import nbt from 'prismarine-nbt';
import { HeuristicResolver, DependencyResolver } from '../tree';
import { TaskQueue } from '../taskqueue';

export class StratBreakBlock extends StrategyBase
{
    readonly name: string = 'waitForItemDrop';

    constructor(solver: Solver)
    {
        super(solver, BreakBlockInstance);
    }

    estimateHeuristic(dependency: Dependency, resolver: HeuristicResolver): number
    {
        switch (dependency.name)
        {
            case 'breakBlock':
                return this.estimateTime(<BreakBlock>dependency, resolver);

            default:
                return -1;
        }
    }

    private estimateTime(breakBlock: BreakBlock, resolver: HeuristicResolver): number
    {
        const moveHeuristic = resolver(new MoveToInteract({
            position: breakBlock.inputs.position
        }));

        if (moveHeuristic < 0)
            return -1;

        const breakHeuristic = this.estimateBreakTime(breakBlock);

        if (breakHeuristic < 0)
            return -1;

        return moveHeuristic + breakHeuristic;
    }

    private estimateBreakTime(breakBlock: BreakBlock): number
    {
        const block = this.bot.blockAt(breakBlock.inputs.position);

        if (!block)
            return -1;

        // TODO Shouldn't tool selection and time estimate be saved for a child task?

        // @ts-ignore
        const effects = this.bot.entity.effects;

        // @ts-ignore
        let fastest = block.digTime(null, false, false, false, [], effects);

        for (const tool of this.bot.inventory.items())
        {
            const enchants = (tool && tool.nbt) ? nbt.simplify(tool.nbt).Enchantments : []

            // @ts-ignore
            const digTime = block.digTime(tool ? tool.type : null, false, false, false, enchants, effects);

            if (digTime < fastest)
                fastest = digTime;
        }

        return fastest;
    }
}

class BreakBlockInstance extends StrategyExecutionInstance
{
    handle(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
    {
        if (dependency.name !== 'breakBlock')
            throw new Error("Unsupported dependency!");

        const breakBlock = <BreakBlock>dependency;
        const position = breakBlock.inputs.position;
        const block = this.bot.blockAt(position);

        if (!block)
            throw new Error(`Cannot break block at ${position} in unloaded chunk!`);

        const moveToInteract = new MoveToInteract({
            position: position
        });

        const requiredDrop = breakBlock.inputs.requiredDrop;

        let toolOptions;
        if (requiredDrop)
            toolOptions = {
                block: block,
                requiredDrop: requiredDrop,
                craftIfNeeded: true
            }
        else
            toolOptions = {
                block: block
            }

        const selectBestTool = new SelectBestTool(toolOptions);

        const taskQueue = new TaskQueue();
        taskQueue.addTask(cb => resolver(moveToInteract, cb));
        taskQueue.addTask(cb => resolver(selectBestTool, cb));
        taskQueue.addTask(cb => this.bot.dig(block, cb));
        taskQueue.runAll(cb);
    }
}
