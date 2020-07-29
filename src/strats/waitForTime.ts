import { Bot } from "mineflayer"
import { Callback, Strategy } from "../strategy"

/**
 * An extremely simple task which just waits for a period of time.
 */
export class WaitForTime implements Strategy
{
    private shouldExit: boolean = false;

    readonly name: string = 'waitForTime';
    readonly bot: Bot;

    /**
     * Creates a new Wait For Time strategy.
     *
     * @param {Bot} bot - The bot to act on.
     */
    constructor(bot: Bot)
    {
        this.bot = bot;
    }

    /**
     * @inheritdoc
     *
     * Options:
     * * ticks - The number of ticks to wait for.
     */
    run(options: any, cb: Callback): void
    {
        this.shouldExit = false

        if (options.ticks !== undefined)
            this.waitForTime(options.ticks, cb)
        else
            cb(new Error('Number of ticks to wait for must be specified!'))
    }

    exit(): void
    {
        this.shouldExit = true;
    }

    private waitForTime(ticks: number, cb: Callback): void
    {
        const bot = this.bot;
        const thisSafe = this;

        function countDown()
        {
            ticks--;

            if (ticks === 0 || thisSafe.shouldExit)
            {
                bot.removeListener('physicTick', countDown);
                cb();
            }
        }

        bot.on('physicTick', countDown);
    }
}
