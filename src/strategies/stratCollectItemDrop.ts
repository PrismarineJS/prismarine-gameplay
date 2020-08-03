import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { ObtainItem } from '../dependencies/obtainItem';
import { Bot } from 'mineflayer';
import { Entity } from 'prismarine-entity';
import { Movements, Result } from 'mineflayer-pathfinder';
import { CollectItemDrops } from '../dependencies';
import { Vec3 } from 'vec3';
import { DependencyResolver } from '../tree';

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

    constructor(solver: Solver)
    {
        super(solver, CollectItemDropInstance);
    }

    estimateHeuristic(dependency: Dependency): number
    {
        switch (dependency.name)
        {
            case 'obtainItem':
                const obtainItem = <ObtainItem>dependency;
                return this.calculateHeuristicForItem(obtainItem.inputs.itemType);

            case 'collectItemDrops':
                const collectItem = <CollectItemDrops>dependency;
                return this.calculateHeuristicForItemList(collectItem.inputs.items);

            default:
                return -1;
        }
    }

    private calculateHeuristicForItemList(items: Entity[]): number
    {
        let h = 0;

        let pos: Vec3 = this.bot.entity.position;
        for (const item of items)
        {
            const itemPos = item.position;

            let distance = pos.distanceTo(itemPos);
            distance *= 1.2; // Add 20% to account for pathfinding around stuff
            distance *= 10; // Assume 10 ticks per block moved

            h += distance;
            pos = itemPos;
        }

        return h;
    }

    private calculateHeuristicForItem(itemId: number): number
    {
        const entity = getNearbyItem(this.bot, itemId);

        if (!entity)
            return -1;

        let h = this.bot.entity.position.distanceTo(entity.position);
        h *= 1.2; // Add 20% to account for pathfinding around stuff
        h *= 10; // Assume 10 ticks per block moved

        return h;
    }
}

class CollectItemDropInstance extends StrategyExecutionInstance
{
    run(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
    {
        try
        {
            let entities: Entity[] = [];
            switch (dependency.name)
            {
                case 'obtainItem':
                    const obtainItem = <ObtainItem>dependency;
                    const entity = getNearbyItem(this.bot, obtainItem.inputs.itemType);

                    if (entity)
                        entities = [entity];

                    break;

                case 'collectItemDrops':
                    const collectItem = <CollectItemDrops>dependency;
                    entities = collectItem.inputs.items;
                    break;

                default:
                    throw new Error("Unsupported dependency!");
            }

            const collectAll = () =>
            {
                const entity = entities.pop();
                if (!entity)
                {
                    cb();
                    return;
                }

                if (!entity.isValid)
                {
                    collectAll();
                    return;
                }

                this.collectEntity(entity, err =>
                {
                    if (err)
                    {
                        cb(err);
                        return;
                    }

                    collectAll();
                });
            };

            collectAll();
        }
        catch (err)
        {
            cb(err)
        }
    }

    private collectEntity(entity: Entity, cb: Callback): void
    {
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
}