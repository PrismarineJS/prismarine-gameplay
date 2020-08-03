import { StrategyExecutionInstance, Dependency, Solver, Callback } from "./strategy";

/**
 * A handler for resolving dependencies at runtime.
 */
export type DependencyResolver = (dependency: Dependency, cb: Callback) => void;

/**
 * A handler for resolving heuristics at runtime.
 */
export type HeuristicResolver = (Dependency: Dependency) => number;

/**
 * An execution status for a strategy to preform.
 */
export enum ExecutionStatus
{
    /**
     * The strategy is planned but has not been preformed yet.
     */
    Pending = 'PENDING',

    /**
     * The strategy failed to execute.
     */
    Failed = 'FAILED',

    /**
     * The strategy completed successfully.
     */
    Success = 'SUCCESS',

    /**
     * The strategy is currently running.
     */
    Running = 'RUNNING'
}

/**
 * The data to store within a tree node.
 */
interface TreeData
{
    /**
     * The line of debug text to print to the console for this data object.
     */
    getText(): string;

    /**
     * Calls this data object to run.
     */
    execute(tree: Tree, cb: Callback): void;
}

/**
 * Data for a tree node in the form of a strategy reference.
 */
class StrategyTreeData implements TreeData
{
    /**
     * Creates a new strategy tree data object.
     * 
     * @param strategy - The strategy instance to execute.
     * @param dependency - The dependency to execute.
     * @param index - The dependency resolution child index for this strategy.
     * @param heuristic - The dependency resolution heuristic estimate for this strategy.
     */
    constructor(private readonly strategy: StrategyExecutionInstance,
        private readonly solver: Solver,
        private readonly dependency: Dependency,
        private readonly index: number,
        private readonly heuristic: number)
    {
    }

    /** @inheritdoc */
    execute(tree: Tree, cb: Callback): void
    {
        const resolver: DependencyResolver = (dependency, cb) =>
        {
            const dep = new DependencyTreeData(this.solver, dependency);
            const childTree = new Tree(dep);
            tree.addChild(childTree);

            childTree.execute(cb);
        };

        this.strategy.run(this.dependency, resolver, cb);
    }

    /** @inheritdoc */
    getText(): string
    {
        return `${this.index}. ${this.strategy.name} [H: ${this.heuristic}]`;
    }
}

class DependencyTreeData implements TreeData
{
    /**
     * The number of solutions found in the dependency resolution.
     */
    private solutions: number = -1;

    /**
     * Creates a new dependency resolution tree data object.
     * 
     * @param dependency - The dependency resolution.
     */
    constructor(private readonly solver: Solver,
        private readonly dependency: Dependency)
    {
    }

    /** @inheritdoc */
    execute(tree: Tree, cb: Callback): void
    {
        const resolution = this.solver.findSolutionsFor(this.dependency);
        this.solutions = resolution.dependencyHandlers.length;

        let childIndex = 0;
        const attemptNext = () =>
        {
            if (childIndex >= resolution.dependencyHandlers.length)
            {
                cb(new Error("No more solutions available!"));
                return;
            }

            const strat = resolution.dependencyHandlers[childIndex][0].createExecutionInstance();
            const heuristic = resolution.dependencyHandlers[childIndex][1];
            const stratData = new StrategyTreeData(strat, this.solver, this.dependency, childIndex, heuristic);
            const childTree = new Tree(stratData);

            childIndex++;

            tree.addChild(childTree);
            childTree.execute(() =>
            {
                if (childTree.status === ExecutionStatus.Success) cb();
                else attemptNext();
            });
        };

        attemptNext();
    }

    /** @inheritdoc */
    getText(): string
    {
        if (this.solutions === -1)
            return `* Solve for '${this.dependency.name}'`;
        else
            return `* Solve for '${this.dependency.name}' [${this.solutions} solutions]`;
    }
}

/**
 * The tree represents a recursive set of strategies which are to be executed
 * and the children that will be executed in order to resolve the parent.
 */
export class Tree
{
    /**
     * All child tree nodes.
     */
    private readonly children: Tree[] = [];

    /**
     * The data being stored in this tree node.
     */
    private readonly data: TreeData;

    /**
     * The current execution status of this tree node.
     */
    private _status: ExecutionStatus = ExecutionStatus.Pending;

    /**
     * If this action failed, this contains the error message object.
     */
    private errMsg?: Error;

    /**
     * The parent node of this node.
     */
    private parent?: Tree;

    /**
     * If true, the console is spammed with information every time the tree updates.
     * Useful for debugging the solver.
     */
    debugMode = false;

    /**
     * Creates a new tree node object.
     * 
     * @param data - The data being stored in this tree node.
     */
    constructor(data: TreeData)
    {
        this.data = data;
    }

    /**
     * Gets the current execution status.
     */
    get status(): ExecutionStatus
    {
        return this._status;
    }

    get root(): Tree
    {
        if (this.parent === undefined) return this;
        else return this.parent.root;
    }

    /**
     * Prints this tree to the console for debugging purposes.
     * 
     * @param indent - The indention for the text. Default to 0.
     */
    printDebug(indent: number = 0)
    {
        let text = `${'  '.repeat(indent)}${this.data.getText()}  (${this.status})`;

        if (this.errMsg)
            text += ` Err: "${this.errMsg.message}"`;

        console.log(text);

        for (const child of this.children)
            child.printDebug(indent + 1);
    }

    /**
     * Triggers this tree node to begin executing.
     * 
     * @param cb - An optional callback when this tree node has finished.
     */
    execute(cb?: Callback): void
    {
        if (this._status !== ExecutionStatus.Pending)
            throw new Error('Tree node already executed!');

        this._status = ExecutionStatus.Running;
        this.data.execute(this, err =>
        {
            if (err)
            {
                this._status = ExecutionStatus.Failed;
                this.errMsg = err;
            }
            else
                this._status = ExecutionStatus.Success;

            if (this.debugMode)
            {
                console.log("==================================================================");
                this.root.printDebug();
                console.log("==================================================================");
            }

            if (cb)
                cb(err);
        });
    }

    addChild(tree: Tree): void
    {
        this.children.push(tree);
        tree.parent = this;

        if (this.debugMode)
        {
            console.log("==================================================================");
            this.root.printDebug();
            console.log("==================================================================");
        }
    }
}

export function createTree(solver: Solver, dependency: Dependency)
{
    const dep = new DependencyTreeData(solver, dependency);
    const tree = new Tree(dep);

    return tree;
}
