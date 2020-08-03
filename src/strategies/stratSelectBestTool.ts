import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { SelectBestTool } from '../dependencies';

// @ts-ignore
import nbt from 'prismarine-nbt';
import { HeuristicResolver, DependencyResolver } from '../tree';
import { Pathfinder } from 'mineflayer-pathfinder';

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
                return 0;

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

        // @ts-ignore
        const pathfinder: Pathfinder = this.bot.pathfinder;

        const item = pathfinder.bestHarvestTool(block);

        if (item) this.bot.equip(item, 'hand', cb);
        else cb();
    }
}
