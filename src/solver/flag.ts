import { Bot } from "mineflayer";

export interface Flag
{
    readonly name: string;
    initializeRealValue(bot: Bot): void;
    matchesGoal(flag: Flag): boolean;
    getDistanceTo(flag: Flag): number;
    clone(): Flag;
}

export class FlagContainer
{
    readonly flags: Flag[] = [];

    getFlag(name: string): Flag | undefined
    {
        for (const flag of this.flags)
            if (flag.name === name)
                return flag;

        return undefined;
    }

    matchesGoal(goal: FlagContainer): boolean
    {
        for (const flag of goal.flags) 
        {
            const current = this.getFlag(flag.name)
            if (current === undefined)
                throw new Error("Flag does not exist in current!")

            if (!current.matchesGoal(flag))
                return false;
        }

        return true
    }

    getDistanceToGoal(goal: FlagContainer): number
    {
        let h = 0;

        for (const flag of goal.flags) 
        {
            const current = this.getFlag(flag.name)
            if (current === undefined)
                throw new Error("Flag does not exist in current!")

            h += current.getDistanceTo(flag);
        }

        return h;
    }

    clone(): FlagContainer
    {
        const container = new FlagContainer();

        for (const flag of this.flags)
            container.flags.push(flag.clone());

        return container;
    }
}

export class FlagInitializer
{
    readonly flags: Flag[] = [];

    registerFlag(flag: Flag): void
    {
        this.flags.push(flag);
    }

    createContainer(bot: Bot): FlagContainer
    {
        const container = new FlagContainer();

        for (const flag of this.flags)
        {
            const f = flag.clone();
            f.initializeRealValue(bot);
            container.flags.push(f);
        }

        return container;
    }
}