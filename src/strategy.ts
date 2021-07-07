import { Bot } from "mineflayer";
import { DependencyResolver } from "./tree";
import { findSolutions } from "./bestFirstSearch";

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
 * The estimated heuristics that is returned from each strategy to check how ideal using this
 * strategy would be.
 */
export interface Heuristics
{
    /**
     * The estimated number of ticks required for this strategy to be executed, not counting
     * any child tasks.
     */
    time: number;

    /**
     * The list of tasks that are estimated to be used if this strategy is run.
     */
    childTasks: Dependency[];
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

    /**
     * Registers a new strategy to be used in this solver.
     * 
     * @param strategy - The strategy.
     */
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
        const solutions = findSolutions(dependency, this.strategies, 8);
        return new DependencyResolution(dependency, solutions);
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
}

type Executor = new (parent: StrategyBase) => StrategyExecutionInstance;

/**
 * A strategy implementation which can used to construct task lists within the solver.
 */
export abstract class StrategyBase
{
    private readonly executor: Executor;
    readonly bot: Bot;

    abstract name: string;

    constructor(solver: Solver, executor: Executor)
    {
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
        return new this.executor(this);
    }

    /**
     * Estimates the heuristic return value for the given dependency input. This is
     * often represented in the number of estimated ticks required to complete this
     * task.
     * 
     * @param dependency - The dependency to estimate for.
     *
     * @returns The estimated heuristic object, or a null.
     */
    abstract estimateHeuristic(dependency: Dependency): Heuristics | null;
}

export abstract class StrategyExecutionInstance
{
    readonly name: string;
    readonly bot: Bot;

    constructor(parent: StrategyBase)
    {
        this.bot = parent.bot;
        this.name = parent.name;
    }

    abstract handle(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void

    /**
     * Executes this strategy.
     *
     * @param dependency - The dependency to solve for.
     * @param resolver - The resolver for handling dependencies while running.
     * @param cb - The callback to execute when this instance has finished executing.
     */
    run(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
    {
        try
        {
            this.handle(dependency, resolver, cb);
        }
        catch (err)
        {
            cb(err);
        }
    }
}
