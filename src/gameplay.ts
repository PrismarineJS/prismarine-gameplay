import { Solver, Dependency, StrategyBase } from "./strategy"
import { Bot } from "mineflayer"
import { Callback } from "./strategy";
import { StratMoveToTarget, StratCollectItemDrop, StratWaitForItemDrop, StratBreakBlock, StratCollectBlock } from "./strategies";

function loadDefaultStrategies(gameplay: Gameplay): void
{
    gameplay.loadStrategy(new StratCollectItemDrop(gameplay.solver));
    gameplay.loadStrategy(new StratMoveToTarget(gameplay.solver));
    gameplay.loadStrategy(new StratWaitForItemDrop(gameplay.solver));
    gameplay.loadStrategy(new StratBreakBlock(gameplay.solver));
    gameplay.loadStrategy(new StratCollectBlock(gameplay.solver));
}

/**
 * A container for all containing and configuring gameplay strategies.
 */
export class Gameplay
{
    readonly solver: Solver;

    debugText: boolean = true;

    /**
     * Creates a new gameplay object
     *
     * @param bot - The bot this gameplay container is acting upon
     * @param loadDefault - Whether or not to load all default strategies.
     * Defaults to true.
     */
    constructor(bot: Bot, loadDefault: boolean = true)
    {
        // TODO Allow individual strategies to be turned on or off.

        this.solver = new Solver(bot);

        if (loadDefault)
            loadDefaultStrategies(this);
    }

    solveFor(dependency: Dependency, cb?: Callback): void
    {
        // TODO Don't run strategies while executing.

        const finish: Callback = err =>
        {
            if (this.debugText)
            {
                if (err)
                {
                    console.log(`Task '${dependency.name}' finished with errors!`);
                    console.log(err);
                }
                else
                    console.log(`Task '${dependency.name}' complete.`);
            }

            if (cb)
                cb(err);
        };

        if (this.debugText)
        {
            console.log(`Executing task '${dependency.name}'`);
            console.log("Options:");
            console.log(dependency);
        }

        this.solver.runDependency(dependency, finish, 0);
    }

    loadStrategy(strategy: StrategyBase): void
    {
        this.solver.register(strategy);
    }

    // TODO Add option to unload strategies.
    // TODO Don't load/unload strategies while executing.
    // TODO Add option to stop current task.
}
