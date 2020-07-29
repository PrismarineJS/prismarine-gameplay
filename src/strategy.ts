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
