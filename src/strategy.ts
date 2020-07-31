import { Bot } from "mineflayer";

/**
 * The callback function for a strategy.
 */
export type Callback = (err?: Error, results?: any) => void;

/**
 * A configurable function which can be executed to preform a task.
 */
export interface Strategy
{
    readonly name: string;
    readonly bot: Bot;

    /**
     * Executes this strategy.
     *
     * @param {*} options - The options for how this strategy should be executed.
     * @param {Callback} cb - Called when this strategy has finished executing.
     */
    run(options: any, cb: Callback): void;

    /**
     * Requests this strategy to stop executing at the next available opportunity.
     */
    exit(): void;
}

/**
 * A simple container representing a world state/dependency that needs to be resolved.
 */
export interface Dependency
{
    /**
     * Gets the name of this dependency type.
     */
    readonly name: string;
}

/**
 * The dependency resolver
 */
export class Solver
{
    private strategies: StrategyBase[] = [];

    readonly bot: Bot;

    constructor(bot: Bot)
    {
        this.bot = bot;
    }

    register(strategy: StrategyBase): void
    {
        if (this.strategies.indexOf(strategy) > -1)
            throw new Error("Strategy already registered!");

        this.strategies.push(strategy);
    }

    /**
     * Checks all available strategies within the solver to find all strategies which can
     * solve the given dependency and how much it would cost.
     * 
     * @param dependency - The dependency to solver for.
     * @param caller - If defined, this strategy is ignored from the list.
     * 
     * @returns A list of tuples containing each available strategy and its heuristic value.
     */
    findSolutionsFor(dependency: Dependency, caller?: StrategyBase): DependencyResolution
    {
        const solutions: [StrategyBase, number][] = [];

        for (const strategy of this.strategies)
        {
            if (strategy === caller)
                continue;

            const h = strategy.estimateHeuristic(dependency);
            if (h < 0)
                continue;

            solutions.push([strategy, h]);
        }

        solutions.sort((a, b) => a[1] - b[1]);

        return new DependencyResolution(dependency, solutions);
    }

    /**
     * Creates and runs a new task tree execution instance to resolve the given dependency.
     * 
     * @param dependency - The dependency to resolve.
     * @param cb - The callback to execute when finished.
     * 
     * @returns The execution tree root node representing this execution instance and a
     * hierarchy of all tasks to preform/were preformed.
     */
    runDependency(dependency: Dependency, cb: Callback): DependencyResolution
    {
        const depRes = this.findSolutionsFor(dependency);
        depRes.runNext(cb);
        return depRes;
    }
}

export class DependencyResolution
{
    readonly dependency: Dependency;
    readonly dependencyHandlers: [StrategyBase, number][];

    constructor(dependency: Dependency, dependencyHandlers: [StrategyBase, number][])
    {
        this.dependency = dependency;
        this.dependencyHandlers = dependencyHandlers;
    }

    runNext(cb: Callback): void
    {
        try
        {
            const dep = this.dependencyHandlers.pop();

            if (!dep)
                throw new Error("No dependencies remaining!");

            dep[0].createExecutionInstance().run(this.dependency, cb);
        }
        catch (err)
        {
            cb(err)
        }
    }
}

/**
 * A strategy implementation which can used to construct task lists within the solver.
 */
export abstract class StrategyBase
{
    private readonly solver: Solver;

    constructor(solver: Solver)
    {
        this.solver = solver;
    }

    /**
     * Checks all available strategies within the solver to find all strategies which can
     * solve the given dependency and how much it would cost.
     *
     * @param dependency - The dependency to solver for.
     *
     * @returns The solved dependency resolution.
     */
    protected findSolutionsFor(dependency: Dependency): DependencyResolution
    {
        return this.solver.findSolutionsFor(dependency, this);
    }

    /**
     * Creates a new executable instance of this strategy.
     * 
     * @returns The execution instance.
     */
    abstract createExecutionInstance(): StrategyExecutionInstance;

    /**
     * Estimates the heuristic return value for the given dependency input. This is
     * often represented in the number of estimated ticks required to complete this
     * task.
     * 
     * @param dependency - The dependency to estimate for.
     * 
     * @returns The estimated heuristic cost, or a negative number if this task cannot
     * complete the given dependency task.
     */
    abstract estimateHeuristic(dependency: Dependency): number;
}

export abstract class StrategyExecutionInstance
{
    /**
     * Executes this strategy.
     *
     * @param dependency - The dependency to solve for.
     * @param cb - The callback to execute when this instance has finished executing.
     */
    abstract run(dependency: Dependency, cb: Callback): void;
}
