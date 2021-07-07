import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver, Heuristics } from '../strategy';
import { DependencyResolver } from '../tree';
import { GiveTo, ObtainItems } from '../dependencies';
import { TaskQueue, TemporarySubscriber } from 'mineflayer-utils';
import { Movements, Result, goals } from 'mineflayer-pathfinder';

const GoalFollow = goals.GoalFollow;

export class StratGiveTo extends StrategyBase
{
    readonly name: string = 'giveTo';

    constructor(solver: Solver)
    {
        super(solver, GiveToInstance);
    }

    estimateHeuristic(dependency: Dependency): Heuristics | null
    {
        if (dependency.name !== 'giveTo')
            return null;

        const giveToTask = <GiveTo>dependency;

        // TODO Use movement task inside of hardcoding it in here
        let distanceCost = this.bot.entity.position.distanceTo(giveToTask.inputs.entity.position);
        distanceCost *= 1.2; // Add 20% to account for pathfinding around stuff
        distanceCost *= 10; // Assume 10 ticks per block moved

        return {
            time: distanceCost,
            childTasks: [
                new ObtainItems({
                    itemType: giveToTask.inputs.itemType,
                    count: giveToTask.inputs.count,
                    countInventory: true
                }),
            ]
        };
    }
}

class GiveToInstance extends StrategyExecutionInstance
{
    handle(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
    {
        if (dependency.name !== 'giveTo')
            throw new Error("Unsupported dependency!");

        const giveToTask = <GiveTo>dependency;

        const obtainItems = new ObtainItems({
            itemType: giveToTask.inputs.itemType,
            count: giveToTask.inputs.count,
            countInventory: false
        });

        const moveToEntity = (cb1: Callback) => {
            // @ts-ignore
            const pathfinder: Pathfinder = this.bot.pathfinder;

            const mcData = require('minecraft-data')(this.bot.version);
            const defaultMove = new Movements(this.bot, mcData);
            pathfinder.setMovements(defaultMove);

            const followGoal = new GoalFollow(giveToTask.inputs.entity, 2.5);
            pathfinder.setGoal(followGoal, true);

            const tempSub = new TemporarySubscriber(this.bot);
            
            tempSub.subscribeTo('path_update', (results: Result) => {
                if (results.status === 'noPath')
                {
                    tempSub.cleanup();
                    pathfinder.setGoal(null);
                    cb1(new Error("No path to entity!"))
                }
            });

            tempSub.subscribeTo('physicTick', () => {
                if (this.bot.entity.position.distanceTo(giveToTask.inputs.entity.position) < 3)
                {
                    tempSub.cleanup();
                    pathfinder.setGoal(null);

                    const itemId = mcData.itemsByName[giveToTask.inputs.itemType].id;
                    this.bot.toss(itemId, null, giveToTask.inputs.count, cb1);
                }
            });
        };

        const taskQueue = new TaskQueue();
        taskQueue.add(cb => resolver(obtainItems, cb));
        taskQueue.add(cb => moveToEntity(cb));
        taskQueue.runAll(cb);
    }
}