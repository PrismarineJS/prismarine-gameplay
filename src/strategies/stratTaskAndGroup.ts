import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { DependencyResolver, HeuristicResolver } from '../tree';
import { TaskAndGroup } from '../dependencies';

export class StratTaskAndGroup extends StrategyBase
{
    readonly name: string = 'taskAndGroup';

    constructor(solver: Solver)
    {
        super(solver, TaskAndGroupInstance);
    }

    estimateHeuristic(dependency: Dependency, resolver: HeuristicResolver): number
    {
        switch (dependency.name)
        {
            case 'taskAndGroup':
                const taskAndGroupTask = <TaskAndGroup>dependency;

                const sum = 0;
                for (const task of taskOrGroupTask.inputs.tasks)
                {
                    const h = resolver(task);

                    // @ts-ignore
                    task.estimatedCost = h; // TODO Estimate heuristic at execute time, as it may change

                    if (h < 0)
                        return -1;

                    sum += h;
                }

                return sum;

            default:
                return -1;
        }
    }
}

class TaskAndGroupInstance extends StrategyExecutionInstance
{
    handle(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
    {
        if (dependency.name !== 'taskAndGroup')
            throw new Error("Unsupported dependency!");

        const taskAndGroupTask = <TaskAndGroup>dependency;

        // @ts-ignore
        taskAndGroupTask.inputs.tasks.sort((a, b) => a.estimatedCost - b.estimatedCost)

        function handleNext()
        {
            const task = taskAndGroupTask.inputs.tasks.pop();

            if (!task)
            {
                cb();
                return;
            }

            resolver(task, err => {
                if (err) cb(err);
                else handleNext();
            })
        }
    }
}