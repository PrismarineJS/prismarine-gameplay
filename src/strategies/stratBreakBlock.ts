import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { BreakBlock } from '../dependencies/breakBlock';
import { MoveToInteract } from '../dependencies';
import { Vec3 } from 'vec3';

// @ts-ignore
import nbt from 'prismarine-nbt';

export class StratBreakBlock extends StrategyBase
{
    readonly name: string = 'waitForItemDrop';

    constructor(solver: Solver)
    {
        super(solver, BreakBlockInstance);
    }

    estimateHeuristic(dependency: Dependency): number
    {
        switch (dependency.name)
        {
            case 'breakBlock':
                return this.estimateTime(<BreakBlock>dependency);

            default:
                return -1;
        }
    }

    private estimateTime(breakBlock: BreakBlock): number
    {
        const moveHeuristic = this.quickHeuristicFor(new MoveToInteract({
            x: breakBlock.x,
            y: breakBlock.y,
            z: breakBlock.z,
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
        const blockPos = new Vec3(breakBlock.x, breakBlock.y, breakBlock.z);
        const block = this.bot.blockAt(blockPos);

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
    run(dependency: Dependency, cb: Callback): void
    {
        try
        {
            const breakBlock = <BreakBlock>dependency;

            this.solveDependency(new MoveToInteract({
                x: breakBlock.x,
                y: breakBlock.y,
                z: breakBlock.z,
            }), err =>
            {
                if (err)
                {
                    cb(err);
                    return;
                }

                const blockPos = new Vec3(breakBlock.x, breakBlock.y, breakBlock.z);
                const block = this.bot.blockAt(blockPos);

                if (block) this.bot.dig(block, cb);
                else cb(new Error(`Cannot break block at ${blockPos} in unloaded chunk!`));
            });

        }
        catch (err)
        {
            cb(err)
        }
    }
}
