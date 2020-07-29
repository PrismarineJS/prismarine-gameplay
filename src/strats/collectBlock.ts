import { Bot } from "mineflayer";
import { WaitForItemDrop } from "./waitForItemDrop";
import { CollectItem } from "./collectItem";
import { Callback, Strategy } from "../strategy";
import { Block } from "prismarine-block";
import { Movements, goals, Pathfinder } from 'mineflayer-pathfinder';
const { GoalNear } = goals;

interface CollectBlockOptions_Block
{
    block: Block;
}

interface CollectBlockOptions_BlockType
{
    blockType: string;
    distance: number;
}

type CollectBlockOptions = CollectBlockOptions_Block | CollectBlockOptions_BlockType;

function optionsIsBlock(options: CollectBlockOptions): options is CollectBlockOptions_Block
{
    const op = options as CollectBlockOptions_Block;
    return op.block !== undefined;
}

function optionsIsBlockType(options: CollectBlockOptions): options is CollectBlockOptions_BlockType
{
    const op = options as CollectBlockOptions_BlockType;
    return op.blockType !== undefined;
}

/**
 * A strategy which mines and collects the target block.
 * Requires the pathfinder plugin to be loaded in order to work.
 */
export class CollectBlock implements Strategy
{
    private readonly waitForItemDrop: WaitForItemDrop;
    private readonly collectItem: CollectItem;
    private shouldExit: boolean = false;

    readonly name: string = 'collectBlock';
    readonly bot: Bot;

    /**
     * Creates a new Collect Block strategy.
     *
     * @param {Bot} bot - The bot to act on.
     */
    constructor(bot: Bot)
    {
        this.bot = bot;

        this.waitForItemDrop = new WaitForItemDrop(bot);
        this.collectItem = new CollectItem(bot);
    }

    /**
     * @inheritdoc
     *
     * Options:
     * * block - The block to mine and collect
     *
     * _OR_
     *
     * * blockType - The type of block to look for.
     * * distance - How far away from the bot to look for this block in
     */
    run(options: CollectBlockOptions, cb: Callback): void
    {
        this.shouldExit = false

        if (optionsIsBlock(options))
            this.handleBlock(options.block, cb);

        if (optionsIsBlockType(options))
        {
            const mcData = require('minecraft-data')(this.bot.version)
            const id = mcData.blocksByName[options.blockType].id

            const findNext = () =>
            {
                if (this.shouldExit)
                {
                    cb()
                    return
                }

                const block = this.findNearbyBlock(id, options.distance)

                if (block)
                {
                    this.handleBlock(block, err =>
                    {
                        if (err) cb(err);
                        else findNext();
                    })
                }
                else
                    cb();
            }

            findNext();
        }
    }

    exit(): void
    {
        this.waitForItemDrop.exit();
        this.collectItem.exit();

        this.shouldExit = true;

        // @ts-ignore
        const pathfinder: Pathfinder = this.bot.pathfinder;
        pathfinder.setGoal(null);
    }

    private findNearbyBlock(blockId: number, distance: number): Block
    {
        return this.bot.findBlock({
            matching: (block: Block) => block.type === blockId,
            maxDistance: distance
        });
    }

    private handleBlock(block: Block, cb: Callback): void
    {
        //@ts-ignore
        const pathfinder: Pathfinder = this.bot.pathfinder;

        const mcData = require('minecraft-data')(this.bot.version);
        const defaultMove = new Movements(this.bot, mcData);
        pathfinder.setMovements(defaultMove);

        if (!this.canMine(block))
        {
            cb(new Error('Does not have available tools to mine block!'));
            return;
        }

        const pos = block.position;
        const goalNear = new GoalNear(pos.x, pos.y, pos.z, 3); // TODO Replace with GoalInteract
        pathfinder.setGoal(goalNear);

        // @ts-ignore
        this.bot.once('goal_reached', () =>
        {
            const dig = (block: Block) =>
            {
                this.bot.dig(block, err =>
                {
                    if (err)
                    {
                        cb(err);
                        return;
                    }

                    this.waitForItemDrop.run(
                        {
                            position: block.position,
                            maxDistance: 5,
                            maxTicks: 20,
                            groupItems: true
                        },
                        (err?: Error, returns?: any) =>
                        {
                            if (err)
                            {
                                cb(err);
                                return;
                            }

                            this.collectItem.run(
                                {
                                    items: returns.items
                                },
                                err => cb(err)
                            );
                        }
                    );
                });
            }

            const tool = pathfinder.bestHarvestTool(block);

            if (tool)
            {
                this.bot.equip(tool, 'hand', err =>
                {
                    if (err)
                    {
                        cb(err);
                        return;
                    }

                    dig(block);
                })
            }
            else
                dig(block);
        })
    }

    private canMine(block: Block): boolean
    {
        if (block.harvestTools === undefined)
            return true;

        const items = this.bot.inventory.items();
        for (const tool in block.harvestTools)
        {
            const id = parseInt(tool, 10);
            for (const j in items)
            {
                const item = items[j];
                if (item.type === id)
                    return true;
            }

            return false;
        }

        return false;
    }
}
