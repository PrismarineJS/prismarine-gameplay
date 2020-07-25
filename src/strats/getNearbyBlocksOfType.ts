import { Strategy, SolverState, Targets, Callback } from "../solver";
import { Bot } from "mineflayer";

export class GetNearbyBlocksOfType implements Strategy
{
    private mcData?: any;

    readonly bot: Bot;

    constructor(bot: Bot)
    {
        this.bot = bot
    }

    modifyState(state: SolverState): boolean
    {
        try 
        {
            this.findBlocks(state.targets);
            return true;
        }
        catch (err)
        {
            return false;
        }
    }

    estimateExecutionTime(): number
    {
        return 3
    }

    execute(targets: Targets, cb: Callback): void
    {
        try 
        {
            this.findBlocks(targets);
            cb();
        }
        catch (err)
        {
            cb(err);
        }
    }

    private findBlocks(targets: Targets): void
    {
        if (targets.blockTypes.length == 0)
            throw new Error("No block types defined in targets!");

        if (this.mcData === undefined)
            this.mcData = require('minecraft-data')(this.bot.version);

        const blockIds: number[] = [];
        for (const blockType of targets.blockTypes)
            blockIds.push(this.mcData.blocksByName[blockType].id);

        const blocks = this.bot.findBlocks({
            matching: block => blockIds.indexOf(block.type) >= 0,
            maxDistance: 32,
            point: this.bot.entity.position // TODO Assign to future position.
        });

        targets.blockPositions = [];
        for (const block of blocks)
            targets.blockPositions.push(block.position);
    }
}