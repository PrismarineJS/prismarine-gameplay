import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { Movements, Result, Move, goals } from 'mineflayer-pathfinder';
import { MoveTo } from '../dependencies/moveTo';
import { Vec3 } from 'vec3';
import { MoveToInteract } from '../dependencies';
import { DependencyResolver } from '../tree';
import { TemporarySubscriber } from 'mineflayer-utils';

interface PositionHolder
{
    x?: number;
    y?: number;
    z?: number;
    range?: number;
}

export class StratMoveToTarget extends StrategyBase
{
    readonly name: string = 'moveToTarget';

    constructor(solver: Solver)
    {
        super(solver, MoveToTargetInstance);
    }

    estimateHeuristic(dependency: Dependency): number
    {
        switch (dependency.name)
        {
            case 'moveTo':
                return this.calculateHeuristicForMoveTarget((<MoveTo>dependency).inputs);

            case 'moveToInteract':
                return this.calculateHeuristicForMoveTarget((<MoveToInteract>dependency).inputs.position);

            default:
                return -1;
        }
    }

    private calculateHeuristicForMoveTarget(moveTarget: PositionHolder): number
    {
        const x = moveTarget.x !== undefined ? moveTarget.x : this.bot.entity.position.x;
        const y = moveTarget.y !== undefined ? moveTarget.y : this.bot.entity.position.y;
        const z = moveTarget.z !== undefined ? moveTarget.z : this.bot.entity.position.z;
        const pos = new Vec3(x, y, z);

        let distance = pos.distanceTo(this.bot.entity.position);
        distance *= 1.2; // Add 20% for pathfinding around stuff
        distance *= 10; // Assume 10 ticks per block moved

        return distance;
    }
}

class MoveToTargetInstance extends StrategyExecutionInstance
{
    handle(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
    {
        const goal = this.getGoal(dependency);

        // TODO Switch to a more stable "isEnd" API
        const node = {
            x: Math.floor(this.bot.entity.position.x),
            y: Math.floor(this.bot.entity.position.y),
            z: Math.floor(this.bot.entity.position.z),
        };
        if (goal.isEnd(node))
        {
            cb();
            return
        }

        // @ts-ignore
        if (this.bot.gameplay.debugText)
            console.log(`Moving from ${this.bot.entity.position} to ${goalToString(goal)}`);

        // @ts-ignore
        const pathfinder: Pathfinder = this.bot.pathfinder;

        const mcData = require('minecraft-data')(this.bot.version);
        const defaultMove = new Movements(this.bot, mcData);
        pathfinder.setMovements(defaultMove);
        pathfinder.setGoal(goal);

        const sub = new TemporarySubscriber(this.bot);
        sub.subscribeTo('goal_reached', () =>
        {
            sub.cleanup();
            pathfinder.setGoal(null);

            cb();
        });

        sub.subscribeTo('path_update', (results: Result) =>
        {
            if (results.status === 'noPath')
            {
                sub.cleanup();
                pathfinder.setGoal(null);

                cb(new Error("No path to target!"));
            }
        });
    }

    private getGoal(dependency: Dependency): goals.Goal
    {
        switch (dependency.name)
        {
            case 'moveTo':
                return new MoveTargetGoal((<MoveTo>dependency).inputs);

            case 'moveToInteract':
                const targetPos = (<MoveToInteract>dependency).inputs.position;
                return new goals.GoalNear(targetPos.x, targetPos.y, targetPos.z, 1); // TODO Replace with GoalInteract

            default:
                throw new Error("Unsupported dependency!");
        }
    }
}

function goalToString(goal: any): string
{
    const x = goal.x === undefined ? '-' : goal.x;
    const y = goal.y === undefined ? '-' : goal.y;
    const z = goal.z === undefined ? '-' : goal.z;
    return `(${x}, ${y}, ${z})`;
}

function distanceXZ(dx: number, dz: number): number
{
    dx = Math.abs(dx);
    dz = Math.abs(dz);
    return Math.abs(dx - dz) + Math.min(dx, dz) * Math.SQRT2;
}

class MoveTargetGoal extends goals.Goal
{
    readonly moveTarget: PositionHolder;

    constructor(moveTarget: PositionHolder)
    {
        super();

        this.moveTarget = {
            x: moveTarget.x != undefined ? Math.floor(moveTarget.x) : undefined,
            y: moveTarget.y != undefined ? Math.floor(moveTarget.y) : undefined,
            z: moveTarget.z != undefined ? Math.floor(moveTarget.z) : undefined,
            range: moveTarget.range,
        };
    }

    heuristic(node: Move): number
    {
        const delta = this.delta(node);
        return distanceXZ(delta.x, delta.z) + delta.y;
    }

    isEnd(node: Move): boolean
    {
        const delta = this.delta(node);
        const range = this.moveTarget.range !== undefined ? this.moveTarget.range : 0.5;
        return Math.sqrt(delta.x * delta.x + delta.y * delta.y + delta.z * delta.z) <= range;
    }

    private delta(node: Move): Vec3
    {
        return new Vec3(
            this.moveTarget.x !== undefined ? Math.abs(this.moveTarget.x - node.x) : 0,
            this.moveTarget.y !== undefined ? Math.abs(this.moveTarget.y - node.y) : 0,
            this.moveTarget.z !== undefined ? Math.abs(this.moveTarget.z - node.z) : 0
        );
    }
}
