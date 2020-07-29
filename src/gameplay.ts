import { Strategy } from "./strategy"
import { Bot } from "mineflayer"
import { Callback } from "./strategy";

const { CollectItem } = require('./strats/collectItem');
const { CollectBlock } = require('./strats/collectBlock');
const { WaitForTime } = require('./strats/waitForTime');
const { WaitForItemDrop } = require('./strats/waitForItemDrop');

function loadDefaultStrategies(gameplay: Gameplay)
{
    gameplay.addStrategy(new CollectItem(gameplay.bot));
    gameplay.addStrategy(new CollectBlock(gameplay.bot));
    gameplay.addStrategy(new WaitForTime(gameplay.bot));
    gameplay.addStrategy(new WaitForItemDrop(gameplay.bot));
}

export interface GameplayAPI
{
    [strategyAPI: string]: (options: any, cb: Callback) => void;
}

/**
 * A container for all containing and configuring gameplay strategies.
 */
export class Gameplay
{
    private readonly strategies: Strategy[] = [];
    private activeStrategy: (Strategy | null) = null;

    readonly bot: Bot;
    readonly api: GameplayAPI = {};

    // [strategyAPI: string]: (options: any, cb: Callback) => void;

    /**
     * Creates a new gameplay object
     *
     * @param {Bot} bot - The bot this gameplay container is acting upon
     */
    constructor(bot: Bot, loadDefault: boolean = true)
    {
        this.bot = bot;

        if (loadDefault)
            loadDefaultStrategies(this);
    }

    /**
     * Adds a new strategy to this gameplay container.
     *
     * @param {Strategy} strategy - The strategy to add.
     */
    addStrategy(strategy: Strategy): void
    {
        this.strategies.push(strategy);

        this.api[strategy.name] = (options: any, cb: Callback) =>
        {
            if (this.activeStrategy !== null)
            {
                cb(new Error(`Strategy ${this.activeStrategy.name} is still active!`));
                return;
            }

            try
            {
                this.activeStrategy = strategy;
                strategy.run(options, (err, returns) =>
                {
                    this.activeStrategy = null;
                    cb(err, returns);
                });
            }
            catch (err)
            {
                this.activeStrategy = null;
                cb(err);
            }
        }
    }

    stopAll(): void
    {
        if (this.activeStrategy !== null)
            this.activeStrategy.exit();
    }
}
