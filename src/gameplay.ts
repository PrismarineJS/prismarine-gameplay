import { Solver, Dependency, StrategyBase } from "./strategy"
import { Bot } from "mineflayer"
import { Callback } from "./strategy";
import * as strats from "./strategies";
import { createTree } from "./tree";

function loadDefaultStrategies(gameplay: Gameplay): void
{
    gameplay.loadStrategy(new strats.StratCollectItemDrop(gameplay.solver));
    gameplay.loadStrategy(new strats.StratMoveToTarget(gameplay.solver));
    gameplay.loadStrategy(new strats.StratWaitForItemDrop(gameplay.solver));
    gameplay.loadStrategy(new strats.StratBreakBlock(gameplay.solver));
    gameplay.loadStrategy(new strats.StratCollectBlock(gameplay.solver));
    gameplay.loadStrategy(new strats.StratCollectResources(gameplay.solver));
    gameplay.loadStrategy(new strats.StratSelectBestTool(gameplay.solver));
    gameplay.loadStrategy(new strats.StratCraftItem(gameplay.solver));
    gameplay.loadStrategy(new strats.StratCraftToObtain(gameplay.solver));
    gameplay.loadStrategy(new strats.StratTaskOrGroup(gameplay.solver));
    gameplay.loadStrategy(new strats.StratTaskAndGroup(gameplay.solver));
    gameplay.loadStrategy(new strats.StratGiveTo(gameplay.solver));
    gameplay.loadStrategy(new strats.StratAlreadyHasItem(gameplay.solver));
}

/**
 * A container for all containing and configuring gameplay strategies.
 */
export class Gameplay
{
    readonly solver: Solver;

    debugText: boolean = false;

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

        if (this.debugText)
        {
            console.log(`Executing task '${dependency.name}'`);
            console.log("Options:");
            console.log(dependency);
        }

        const finish = cb || function () { };

        const tree = createTree(this.solver, dependency);

        if (this.debugText)
            tree.debugMode = true;

        tree.execute(err => finish(err));
    }

    loadStrategy(strategy: StrategyBase): void
    {
        this.solver.register(strategy);
    }

    // TODO Add option to unload strategies.
    // TODO Don't load/unload strategies while executing.
    // TODO Add option to stop current task.
}
