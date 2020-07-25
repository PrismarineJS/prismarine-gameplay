import { Flag } from "../solver/flag";
import { Bot } from "mineflayer";
import { Vec3 } from "vec3";

export interface ModifiedBlock
{
    position: Vec3;
    type: string;
}

export class ModifiedBlocksFlag implements Flag
{
    readonly name: string = 'modifiedBlocks';
    readonly blockList: ModifiedBlock[] = [];
    readonly matchExact: boolean;

    bot?: Bot;

    constructor(matchExact: boolean = true)
    {
        this.matchExact = matchExact;
    }

    initializeRealValue(bot: Bot): void
    {
        this.bot = bot;
    }

    matchesGoal(flag: Flag): boolean
    {
        const goalBlockList = (<ModifiedBlocksFlag>flag).blockList;

        for (const blockMod of goalBlockList)
        {
            const cur = this.getModifiedBlockAt(blockMod.position, this.blockList);

            if (!cur || cur.type !== blockMod.type)
                return false;
        }

        if (this.matchExact)
        {
            if (this.countExtraBlocks(goalBlockList) > 0)
                return false;
        }

        return true;
    }

    private getModifiedBlockAt(position: Vec3, blockList: ModifiedBlock[] = this.blockList): ModifiedBlock | undefined
    {
        for (const block of blockList)
            if (block.position.equals(position))
                return block;

        return undefined;
    }

    private countExtraBlocks(goalBlocks: ModifiedBlock[]): number
    {
        let count = 0;

        for (const block of this.blockList)
        {
            if (!this.getModifiedBlockAt(block.position, goalBlocks))
                count++;
        }

        return count;
    }

    getDistanceTo(flag: Flag): number
    {
        const goalBlockList = (<ModifiedBlocksFlag>flag).blockList;

        let dist = 0;

        if (this.matchExact)
            dist = this.countExtraBlocks(goalBlockList) * 10;

        for (const blockMod of goalBlockList)
        {
            const cur = this.getModifiedBlockAt(blockMod.position);

            if (!cur || cur.type !== blockMod.type)
                dist += 10;
        }

        return dist;
    }

    clone(): Flag
    {
        const flag = new ModifiedBlocksFlag(this.matchExact);

        for (const block of this.blockList)
        {
            flag.blockList.push({
                position: block.position,
                type: block.type
            });
        }

        return flag;
    }

    getBlockAt(position: Vec3): string
    {
        const block = this.getModifiedBlockAt(position);
        if (block)
            return block.type;

        if (!this.bot)
            throw new Error("Flag not correctly initialized!");

        return this.bot.blockAt(position)?.name || "air";
    }

    setBlockAt(position: Vec3, type: string): void
    {
        const block = this.getModifiedBlockAt(position);
        if (block)
        {
            block.type = type;
            return;
        }

        this.blockList.push({
            position: position,
            type: type
        });
    }
}