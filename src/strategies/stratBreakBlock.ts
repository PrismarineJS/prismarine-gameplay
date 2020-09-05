import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver, Heuristics } from '../strategy';
import { BreakBlock } from '../dependencies/breakBlock';
import { MoveToInteract, SelectBestTool } from '../dependencies';

// @ts-ignore
import nbt from 'prismarine-nbt';
import { DependencyResolver } from '../tree';
import { TaskQueue } from 'mineflayer-utils';
import { Block } from 'prismarine-block';

export class StratBreakBlock extends StrategyBase
{
    readonly name: string = 'waitForItemDrop';

    constructor(solver: Solver)
    {
        super(solver, BreakBlockInstance);
    }

    estimateHeuristic(dependency: Dependency): Heuristics | null
    {
        if (dependency.name !== 'breakBlock')
            return null;

        const breakBlock = <BreakBlock>dependency;
        const block = this.bot.blockAt(breakBlock.inputs.position);

        if (!block)
            return null;

        return {
            time: this.estimateBreakTime(block),
            childTasks: [
                new MoveToInteract({
                    position: breakBlock.inputs.position
                }),
                new SelectBestTool({
                    block: block,
                    requiredDrop: breakBlock.inputs.requiredDrop,
                    craftIfNeeded: breakBlock.inputs.requiredDrop !== undefined
                })
            ]
        };
    }

    private estimateBreakTime(block: Block): number
    {

        // TODO Shouldn't tool selection and time estimate be saved for a child task?

        // @ts-expect-error
        const effects = this.bot.entity.effects;

        // @ts-expect-error
        let fastest = block.digTime(null, false, false, false, [], effects);

        for (const tool of this.bot.inventory.items())
        {
            const enchants = (tool && tool.nbt) ? nbt.simplify(tool.nbt).Enchantments : []

            // @ts-expect-error
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
        taskQueue.add(cb => resolver(moveToInteract, cb));
        taskQueue.add(cb => resolver(selectBestTool, cb));
        taskQueue.add(cb => this.bot.dig(block, cb));
        taskQueue.runAll(cb);
    }
}
