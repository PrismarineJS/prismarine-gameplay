import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { ObtainItem } from '../dependencies/obtainItem';
import { Bot } from 'mineflayer';
import { Entity } from 'prismarine-entity';
import { Movements, Result } from 'mineflayer-pathfinder';
import { CollectItemDrops } from '../dependencies';
import { Vec3 } from 'vec3';
import { DependencyResolver } from '../tree';

const { GoalFollow } = require('mineflayer-pathfinder').goals;

function getNearbyItem(bot: Bot, itemName: string): Entity | undefined
{
    let closestEntity: Entity | undefined = undefined;
    let distance = -1;

    const itemID = require('minecraft-data')(bot.version).itemsByName[itemName]?.id || -1;

    for (let entityName of Object.keys(bot.entities))
    {
        let entity = bot.entities[entityName];

        if (entity.objectType !== 'Item')
            continue;

        // @ts-ignore
        if (entity.metadata[7]?.itemId !== itemID)
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

function countItemsOfType(bot: Bot, itemType: string): number
{
    let count = 0;

    for (const item of bot.inventory.items())
    {
        if (item.name === itemType)
            count += item.count;
    }

    return count;
}

function isNeeded(bot: Bot, obtainItem: ObtainItem): boolean
{
    if (obtainItem.inputs.countInventory)
        return countItemsOfType(bot, obtainItem.inputs.itemType) === 0;

    return true;
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

                if (!isNeeded(this.bot, obtainItem))
                    return -1;

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

    private calculateHeuristicForItem(itemId: string): number
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
    handle(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
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

    private collectEntity(entity: Entity, cb: Callback): void
    {
        // @ts-ignore
        const pathfinder: Pathfinder = this.bot.pathfinder;

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

            cleanup("Entity disappeared!");
        }

        function pathUpdate(results: Result)
        {
            if (results.status === 'noPath')
                cleanup("No path to entity!");
        }

        function playerCollect(collector: Entity, item: Entity): void
        {
            if (collector === bot.entity && item === entity)
                cleanup();
        }

        function cleanup(errMessage?: string)
        {
            bot.removeListener('entityGone', entityGone);
            bot.removeListener('playerCollect', playerCollect);

            // @ts-ignore
            bot.removeListener('path_update', pathUpdate);

            pathfinder.setGoal(null);

            if (errMessage) cb(new Error(errMessage));
            else cb();
        }

        this.bot.on('entityGone', entityGone);
        this.bot.on('playerCollect', playerCollect);

        // @ts-ignore
        this.bot.on('path_update', pathUpdate);
    }
}