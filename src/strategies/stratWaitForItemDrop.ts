import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { Entity } from 'prismarine-entity';
import { WaitForItemDrop } from '../dependencies/waitForItemDrop';

export class StratWaitForItemDrop extends StrategyBase
{
    readonly name: string = 'waitForItemDrop';

    constructor(solver: Solver)
    {
        super(solver, WaitForItemDropInstance);
    }

    estimateHeuristic(dependency: Dependency): number
    {
        switch (dependency.name)
        {
            case 'waitForItemDrop':
                return 10; // Item drops usually happen almost instantly.

            default:
                return -1;
        }
    }
}

class WaitForItemDropInstance extends StrategyExecutionInstance
{
    run(dependency: Dependency, cb: Callback): void
    {
        try
        {
            const itemDrop = <WaitForItemDrop>dependency;
            const bot = this.bot;
            let ticksRemaining = itemDrop.maxTicks;

            function entitySpawn(entity: Entity): void
            {
                if (entity.objectType !== 'Item')
                    return;

                if (entity.position.distanceTo(itemDrop.position) > itemDrop.maxDistance)
                    return;

                itemDrop.itemDrops.push(entity);

                if (itemDrop.groupItems) ticksRemaining = 3;
                else cleanup();
            }

            function physicTick(): void
            {
                ticksRemaining--;

                if (ticksRemaining <= 0)
                    cleanup();
            }

            function cleanup(): void
            {
                bot.removeListener('entitySpawn', entitySpawn);
                bot.removeListener('physicTick', physicTick);
                cb();
            }

            bot.on('entitySpawn', entitySpawn);
            bot.on('physicTick', physicTick);
        }
        catch (err)
        {
            cb(err)
        }
    }
}
