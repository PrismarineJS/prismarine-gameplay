import { Bot } from "mineflayer";
import { Entity } from "prismarine-entity";
import { Callback, Strategy } from "../strategy";
import { Movements, goals, Pathfinder } from 'mineflayer-pathfinder';
const { GoalFollow } = goals;

interface CollectItemOptions_Item
{
    item: Entity;
}

interface CollectItemOptions_Items
{
    items: Entity[];
}

interface CollectItemOptions_Area
{
    distance: number;
}

type CollectItemOptions = CollectItemOptions_Item | CollectItemOptions_Items | CollectItemOptions_Area;

function optionsIsItem(options: CollectItemOptions): options is CollectItemOptions_Item
{
    const op = options as CollectItemOptions_Item;
    return op.item !== undefined;
}

function optionsIsItems(options: CollectItemOptions): options is CollectItemOptions_Items
{
    const op = options as CollectItemOptions_Items;
    return op.items !== undefined;
}

function optionsIsArea(options: CollectItemOptions): options is CollectItemOptions_Area
{
    const op = options as CollectItemOptions_Area;
    return op.distance !== undefined;
}

/**
 * A simple task which collects a specific item from the ground.
 * Requires the pathfinder plugin to be loaded in order to work.
 */
export class CollectItem implements Strategy
{
    private shouldExit: boolean = false;

    readonly name: string = 'collectItem';
    readonly bot: Bot;

    /**
     * Creates a new Collect Item strategy.
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
     * * item - The item drop to pick up.
     *
     * _OR_
     *
     * * items - A list of items drops to pick up.
     *
     * _OR_
     *
     * * distance - The maximum distance to look for item drops if specific target not specified.
     */
    run(options: CollectItemOptions, cb: Callback): void
    {
        this.shouldExit = false;

        if (optionsIsItem(options))
            this.handleItems([options.item], cb);

        if (optionsIsItems(options))
            this.handleItems(options.items, cb);

        if (optionsIsArea(options))
            this.handleItems(this.findNearbyItems(options.distance), cb);
    }

    exit(): void
    {
        this.shouldExit = true

        // @ts-ignore
        this.bot.pathfinder.setGoal(null)
    }

    private findNearbyItems(distance: number): Entity[]
    {
        const items = []
        for (const entityName of Object.keys(this.bot.entities))
        {
            const entity = this.bot.entities[entityName]

            if (entity.objectType !== 'Item')
            {
                continue
            }

            if (entity.position.distanceTo(this.bot.entity.position) > distance)
            {
                continue
            }

            items.push(entity)
        }

        items.sort((a, b) =>
        {
            return (
                b.position.distanceTo(this.bot.entity.position) -
                a.position.distanceTo(this.bot.entity.position)
            );
        });

        return items
    }

    private handleItems(items: Entity[], cb: Callback): void 
    {
        if (items.length === 0)
        {
            cb()
            return
        }

        const bot = this.bot
        const safeThis = this;

        // @ts-ignore
        const pathfinder: Pathfinder = bot.pathfinder;

        function checkItems()
        {
            if (safeThis.shouldExit)
            {
                bot.removeListener('physicTick', checkItems);

                cb();
                return;
            }

            if (!items[items.length - 1].isValid)
            {
                items.pop();

                if (items.length === 0)
                {
                    bot.removeListener('physicTick', checkItems);

                    // @ts-ignore
                    bot.pathfinder.setGoal(null);

                    cb();
                    return;
                }

                const followGoal = new GoalFollow(items[items.length - 1], 0);
                pathfinder.setGoal(followGoal);
            }
        }

        const mcData = require('minecraft-data')(this.bot.version);
        const defaultMove = new Movements(this.bot, mcData);
        pathfinder.setMovements(defaultMove);

        bot.on('physicTick', checkItems);

        const followGoal = new GoalFollow(items[items.length - 1], 0);
        pathfinder.setGoal(followGoal);
    }
}
