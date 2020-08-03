import { Callback } from "./strategy";

export type Task = (cb: Callback) => void;

export class TaskQueue
{
    private readonly tasks: Task[] = [];

    addTask(task: Task): void
    {
        this.tasks.push(task);
    }

    runAll(cb: Callback): void
    {
        let index = -1;
        const runNext = () =>
        {
            index++;
            if (index >= this.tasks.length)
            {
                cb();
                return;
            }

            try
            {
                this.tasks[index](err =>
                {
                    if (err) cb(err);
                    else runNext();
                });
            }
            catch (err)
            {
                cb(err);
            }
        };

        runNext();
    }
}