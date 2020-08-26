import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { DependencyResolver, HeuristicResolver } from '../tree';
import { TaskOrGroup } from '../dependencies';

export class StratTaskOrGroup extends StrategyBase
{
    readonly name: string = 'taskOrGroup';

    constructor(solver: Solver)
    {
        super(solver, TaskOrGroupInstance);
    }

    estimateHeuristic(dependency: Dependency, resolver: HeuristicResolver): number
    {
        switch (dependency.name)
        {
            case 'taskOrGroup':
                const taskOrGroupTask = <TaskOrGroup>dependency;

                let min = -1;
                for (const task of taskOrGroupTask.inputs.tasks)
                {
                    const h = resolver(task);

                    // @ts-ignore
                    task.estimatedCost = h; // TODO Estimate heuristic at execute time, as it may change

                    if (h >= 0 && min < 0 || h < min)
                        min = h;
                }

                if (min < 0)
                    console.log(JSON.stringify(taskOrGroupTask, null, 2));

                return min;

            default:
                return -1;
        }
    }
}

class TaskOrGroupInstance extends StrategyExecutionInstance
{
    handle(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
    {
        if (dependency.name !== 'taskOrGroup')
            throw new Error("Unsupported dependency!");

        const taskOrGroupTask = <TaskOrGroup>dependency;

        const tasks = [...taskOrGroupTask.inputs.tasks];

        // @ts-ignore
        tasks.sort((a, b) => a.estimatedCost - b.estimatedCost)

        function handleNext()
        {
            const task = tasks.pop();

            if (!task)
            {
                cb(new Error("No tasks remaining!"));
                return;
            }

            // @ts-ignore
            if (task.estimatedCost === -1)
            {
                handleNext();
                return;
            }

            resolver(task, err => {
                if (err) handleNext();
                else
                {
                    taskOrGroupTask.outputs.passingTask = task;
                    cb();
                }
            })
        }

        handleNext();
    }
}