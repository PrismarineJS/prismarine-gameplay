import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver, Heuristics } from '../strategy';
import { DependencyResolver } from '../tree';
import { TaskAndGroup } from '../dependencies';

export class StratTaskAndGroup extends StrategyBase
{
    readonly name: string = 'taskAndGroup';

    constructor(solver: Solver)
    {
        super(solver, TaskAndGroupInstance);
    }

    estimateHeuristic(dependency: Dependency): Heuristics | null
    {
        if (dependency.name !== 'taskAndGroup')
            return null;

        const taskAndGroupTask = <TaskAndGroup>dependency;
        
        return {
            time: 0,
            childTasks: taskAndGroupTask.inputs.tasks
        };
    }
}

class TaskAndGroupInstance extends StrategyExecutionInstance
{
    handle(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
    {
        if (dependency.name !== 'taskAndGroup')
            throw new Error("Unsupported dependency!");

        const taskAndGroupTask = <TaskAndGroup>dependency;

        const tasks = [...taskAndGroupTask.inputs.tasks]

        // @ts-ignore
        tasks.sort((a, b) => a.estimatedCost - b.estimatedCost)

        function handleNext()
        {
            const task = tasks.pop();

            if (!task)
            {
                cb();
                return;
            }

            resolver(task, err => {
                if (err)
                {
                    taskAndGroupTask.outputs.failingTask = task;
                    cb(err);
                }
                else
                    handleNext();
            })
        }

        handleNext();
    }
}