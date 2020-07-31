import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { ObtainItem } from '../dependencies/obtainItem';
import { Bot } from 'mineflayer';
import { Entity } from 'prismarine-entity';
import { Movements, Result } from 'mineflayer-pathfinder';

const { GoalFollow } = require('mineflayer-pathfinder').goals;

function getNearbyItem(bot: Bot, itemId: number): Entity | undefined
{
    let closestEntity: Entity | undefined = undefined;
    let distance = -1;

    for (let entityName of Object.keys(bot.entities))
    {
        let entity = bot.entities[entityName];

        if (entity.objectType !== 'Item')
            continue;

        // @ts-ignore
        if (entity.metadata[7]?.itemId !== itemId)
            continue;

        let dist = bot.entity.position.distanceTo(entity.position);
        if (distance < 0 || dist < distance)
        {
            closestEntity = entity;
            distance = dist;
        }
    }

    return closestEntity;
}

export class StratCollectItemDrop extends StrategyBase
{
    readonly name: string = 'collectItemDrop';
    readonly bot: Bot;

    constructor(solver: Solver)
    {
        super(solver);
        this.bot = solver.bot;
    }

    createExecutionInstance(): StrategyExecutionInstance
    {
        return new CollectItemDropInstance(this.bot);
    }

    estimateHeuristic(dependency: Dependency): number
    {
        switch (dependency.name)
        {
            case 'obtainItem':
                const obtainItem = <ObtainItem>dependency;
                return this.calculateHeuristicForItem(obtainItem.itemType);

            default:
                return -1;
        }
    }

    private calculateHeuristicForItem(itemId: number): number
    {
        const entity = getNearbyItem(this.bot, itemId);

        if (!entity)
            return -1;

        let h = this.bot.entity.position.distanceTo(entity.position);
        h *= 1.2; // Add 20% to account for pathfinding around stuff

        return h;
    }
}

export class CollectItemDropInstance implements StrategyExecutionInstance
{
    private readonly bot: Bot;

    constructor(bot: Bot)
    {
        this.bot = bot;
    }

    run(dependency: Dependency, cb: Callback): void
    {
        try
        {
            if (dependency.name !== 'obtainItem')
                throw new Error("Unsupported dependency!");

            const obtainItem = <ObtainItem>dependency;
            const entity = getNearbyItem(this.bot, obtainItem.itemType);

            if (!entity)
                throw new Error("No nearby item drops available!");

            // @ts-ignore
            const pathfinder: Pathfinder = bot.pathfinder;

            const mcData = require('minecraft-data')(this.bot.version);
            const defaultMove = new Movements(this.bot, mcData);
            pathfinder.setMovements(defaultMove);

            const followGoal = new GoalFollow(entity, 0);
            pathfinder.setGoal(followGoal, true);

            const bot = this.bot;

            function entityGone(e: Entity)
            {
                if (e !== entity)
                    return;

                cleanup(false);
            }

            function pathUpdate(results: Result)
            {
                if (results.status === 'noPath')
                    cleanup(false);
            }

            function playerCollect(collector: Entity, item: Entity): void
            {
                if (collector === bot.entity && item === entity)
                    cleanup(true);
            }

            function cleanup(success: boolean)
            {
                bot.removeListener('entityGone', entityGone);
                bot.removeListener('playerCollect', playerCollect);

                // @ts-ignore
                bot.removeListener('path_update', pathUpdate);

                pathfinder.setGoal(null);

                if (success) cb();
                else cb(new Error("Failed to collect item!"));
            }

            this.bot.on('entityGone', entityGone);
            this.bot.on('playerCollect', playerCollect);

            // @ts-ignore
            this.bot.on('path_update', pathUpdate);
        }
        catch (err)
        {
            cb(err)
        }
    }
}