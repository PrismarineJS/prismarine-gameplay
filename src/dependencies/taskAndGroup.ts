import { Dependency, DependencyInputs, DependencyOutputs } from "../strategy";

export interface TaskAndGroupInputs extends DependencyInputs
{
    /**
     * The list of tasks to be handled. All of them need to complete in order for
     * this task to be considered a success. Tasks are executed in order of lowest
     * to highest heuristic.
     */
    tasks: Dependency[];
}

export interface TaskAndGroupOutputs extends DependencyOutputs
{
    /**
     * The task that caused this group to fail, if any.
     */
    failingTask?: Dependency;
}

export class TaskAndGroup implements Dependency
{
    readonly name: string = 'taskAndGroup';
    readonly outputs: TaskAndGroupOutputs = {};

    constructor(readonly inputs: TaskAndGroupInputs = {
        tasks: []
    }) { }
}