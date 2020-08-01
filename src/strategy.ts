import { Bot } from "mineflayer";

/**
 * The callback function for a strategy.
 */
export type Callback = (err?: Error) => void;

export interface DependencyInputs { }

export interface DependencyOutputs { }

/**
 * A simple container representing a world state/dependency that needs to be resolved.
 */
export interface Dependency
{
    /**
     * Gets the name of this dependency type.
     */
    readonly name: string;

    readonly inputs: DependencyInputs;
    readonly outputs: DependencyOutputs;
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
    findSolutionsFor(dependency: Dependency, caller?: StrategyBase, depth: number = 0): DependencyResolution
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

        return new DependencyResolution(dependency, solutions, depth);
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
    readonly depth: number;

    constructor(dependency: Dependency, dependencyHandlers: [StrategyBase, number][], depth: number)
    {
        this.dependency = dependency;
        this.dependencyHandlers = dependencyHandlers;
        this.depth = depth;
    }

    runNext(cb: Callback): void
    {
        try
        {
            const dep = this.dependencyHandlers.pop();

            if (!dep)
                throw new Error("No dependencies remaining!");

            console.log(`${'  '.repeat(this.depth)}Executing '${dep[0].name}'`);
            dep[0].createExecutionInstance().run(this.dependency, cb);
        }
        catch (err)
        {
            cb(err)
        }
    }

    hasNext(): boolean
    {
        return this.dependencyHandlers.length > 0;
    }
}

type Executor = new (parent: StrategyBase, solver: Solver) => StrategyExecutionInstance;

export abstract class SolverHandler
{
    protected readonly parent?: StrategyBase;
    protected readonly solver: Solver;

    constructor(solver: Solver, parent?: StrategyBase)
    {
        if (!parent && this instanceof StrategyBase)
            parent = this;

        this.parent = parent;
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
        return this.solver.findSolutionsFor(dependency, this.parent);
    }

    /**
     * Finds all solutions for a dependency and executes them in order or lowest to highest
     * heuristic until the entire list is exhausted or no strategies are left.
     * 
     * Throws an error is no strategies remain.
     * 
     * @param dependency - The dependency to solve to.
     * @param cb - The callback.
     */
    protected solveDependency(dependency: Dependency, cb: Callback): void
    {
        const resolution = this.findSolutionsFor(dependency);

        const trySolve = () =>
        {
            if (!resolution.hasNext())
            {
                cb(new Error("No solutions available!"));
                return;
            }

            resolution.runNext(err =>
            {
                if (err) trySolve();
                else cb();
            });
        }

        trySolve();
    }

    /**
     * Estimates the heuristic value of the given dependency to be resolved.
     * 
     * @param dependency - The dependency.
     * 
     * @returns The heuristic estimate, or -1 if it could not be resolved.
     */
    protected quickHeuristicFor(dependency: Dependency): number
    {
        const resolution = this.findSolutionsFor(dependency);

        if (!resolution.hasNext())
            return -1;

        return resolution.dependencyHandlers[0][1];
    }
}

/**
 * A strategy implementation which can used to construct task lists within the solver.
 */
export abstract class StrategyBase extends SolverHandler
{
    private readonly executor: Executor;
    readonly bot: Bot;

    abstract name: string;

    constructor(solver: Solver, executor: Executor)
    {
        super(solver);
        this.executor = executor;
        this.bot = solver.bot;
    }

    /**
     * Creates a new executable instance of this strategy.
     * 
     * @returns The execution instance.
     */
    public createExecutionInstance(): StrategyExecutionInstance
    {
        return new this.executor(this, this.solver);
    }

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

export abstract class StrategyExecutionInstance extends SolverHandler
{
    readonly bot: Bot;

    constructor(parent: StrategyBase, solver: Solver)
    {
        super(solver, parent);
        this.bot = parent.bot;
    }

    /**
     * Executes this strategy.
     *
     * @param dependency - The dependency to solve for.
     * @param cb - The callback to execute when this instance has finished executing.
     */
    abstract run(dependency: Dependency, cb: Callback): void;
}
