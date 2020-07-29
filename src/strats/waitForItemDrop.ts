import { Strategy, Callback } from '../strategy';
import { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';
import { Entity } from 'prismarine-entity';

interface WaitForItemDropOptions
{
    position: Vec3;
    maxDistance: number;
    maxTicks: number;
    groupItems: boolean;
}

/**
 * Waits for an item to drop near an area and returns that item drop entity.
 */
export class WaitForItemDrop implements Strategy
{
    private shouldExit: boolean = false;

    readonly name = 'waitForItemDrop';
    readonly bot: Bot;

    /**
     * Creates a new Wait For Item Drop strategy.
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
     * * position - The location where the item is expected to spawn at. (Defaults to bot location)
     * * maxDistance - How far away from the position to check for item spawns within. (Defaults to 16 blocks)
     * * maxTicks - The maximum number of ticks to wait for. (Defaults to 50)
     * * groupItems - If an item drops, should additional ticks be allocated to wait for more drops in that same spot? (Defaults to false)
     *
     * Returns:
     * * items - A list of items which were spawned
     */
    run(options: WaitForItemDropOptions, cb: Callback): void
    {
        this.shouldExit = false;

        const position = options.position ? options.position : this.bot.entity.position;
        const maxDistance = options.maxDistance !== undefined ? options.maxDistance : 16;
        const maxTicks = options.maxTicks !== undefined ? options.maxTicks : 50;
        const groupItems = options.groupItems !== undefined ? options.groupItems : false;

        this.waitForDrop(position, maxDistance, maxTicks, groupItems, cb);
    }

    exit(): void
    {
        this.shouldExit = true;
    }

    private waitForDrop(position: Vec3, distance: number, ticks: number, groupItems: boolean, cb: Callback): void
    {
        const bot = this.bot;
        const items: Entity[] = [];
        const safeThis = this;

        function cleanup()
        {
            bot.removeListener('physicTick', countDown);
            bot.removeListener('entitySpawn', entitySpawn);

            cb(undefined, {
                items: items
            });
        }

        // Timeout
        function countDown()
        {
            ticks--;

            if (ticks === 0 || safeThis.shouldExit)
                cleanup();
        }

        function entitySpawn(entity: Entity)
        {
            if (entity.objectType !== 'Item') return;
            if (entity.position.distanceTo(position) > distance) return;

            items.push(entity);

            // Wait up to 3 more ticks if grouped items. Else, cleanup now.
            if (groupItems) ticks = 3;
            else cleanup();
        }

        bot.on('physicTick', countDown);
        bot.on('entitySpawn', entitySpawn);
    }
}
