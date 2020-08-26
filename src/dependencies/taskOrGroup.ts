import { Dependency, DependencyInputs, DependencyOutputs } from "../strategy";

export interface TaskOrGroupInputs extends DependencyInputs
{
    /**
     * The list of tasks to be handled. Only one needs to be executed in order for
     * this task to be considered a success. Tasks are attempted in order of lowest
     * to highest heuristic.
     */
    tasks: Dependency[];
}

export interface TaskOrGroupOutputs extends DependencyOutputs
{

}

export class TaskOrGroup implements Dependency
{
    readonly name: string = 'taskOrGroup';
    readonly outputs: TaskOrGroupOutputs = {};

    constructor(readonly inputs: TaskOrGroupInputs = {
        tasks = []
    }) { }
}