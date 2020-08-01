import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { Movements, Result, Move } from 'mineflayer-pathfinder';
import { MoveTo } from '../dependencies/moveTo';
import { Vec3 } from 'vec3';
import { MoveToInteract } from '../dependencies';

const { Goal, GoalNear } = require('mineflayer-pathfinder').goals;

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
            case 'moveToInteract':
                const moveTo = <MoveTo>dependency;
                return this.calculateHeuristicForMoveTarget(moveTo.inputs);

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
    run(dependency: Dependency, cb: Callback): void
    {
        try
        {
            let goal = null;
            let targetPos = null;

            switch (dependency.name)
            {
                case 'moveTo':
                    targetPos = (<MoveTo>dependency).inputs;
                    goal = new MoveTargetGoal(targetPos);
                    break;

                case 'moveToInteract':
                    targetPos = (<MoveToInteract>dependency).inputs.position;
                    goal = new GoalNear(targetPos.x, targetPos.y, targetPos.z, 1); // TODO Replace with GoalInteract
                    break;

                default:
                    throw new Error("Unsupported dependency!");
            }

            // @ts-ignore
            if (this.bot.gameplay.debugText)
            {
                const x = targetPos.x === undefined ? '-' : targetPos.x;
                const y = targetPos.y === undefined ? '-' : targetPos.y;
                const z = targetPos.z === undefined ? '-' : targetPos.z;
                console.log(`Moving from ${this.bot.entity.position} to (${x}, ${y}, ${z})`);
            }

            // @ts-ignore
            const pathfinder: Pathfinder = this.bot.pathfinder;

            const mcData = require('minecraft-data')(this.bot.version);
            const defaultMove = new Movements(this.bot, mcData);
            pathfinder.setMovements(defaultMove);
            pathfinder.setGoal(goal);

            const bot = this.bot;

            function pathUpdate(results: Result)
            {
                if (results.status === 'noPath')
                    cleanup(false);
            }

            function goalReached()
            {
                cleanup(true);
            }

            function cleanup(success: boolean)
            {
                // @ts-ignore
                bot.removeListener('goal_reached', goalReached);

                // @ts-ignore
                bot.removeListener('path_update', pathUpdate);

                pathfinder.setGoal(null);

                if (success) cb();
                else cb(new Error("No path to target!"));
            }

            // @ts-ignore
            this.bot.on('goal_reached', goalReached);

            // @ts-ignore
            this.bot.on('path_update', pathUpdate);
        }
        catch (err)
        {
            cb(err)
        }
    }
}

function distanceXZ(dx: number, dz: number): number
{
    dx = Math.abs(dx);
    dz = Math.abs(dz);
    return Math.abs(dx - dz) + Math.min(dx, dz) * Math.SQRT2;
}

class MoveTargetGoal extends Goal
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
        let dx = 0;
        let dy = 0;
        let dz = 0;

        if (this.moveTarget.x !== undefined)
            dx = Math.abs(this.moveTarget.x - node.x);

        if (this.moveTarget.y !== undefined)
            dy = Math.abs(this.moveTarget.y - node.y);

        if (this.moveTarget.z !== undefined)
            dz = Math.abs(this.moveTarget.z - node.z);

        return distanceXZ(dx, dz) + Math.abs(dy);
    }

    isEnd(node: Move): boolean
    {
        let dx = 0;
        let dy = 0;
        let dz = 0;

        if (this.moveTarget.x !== undefined)
            dx = Math.abs(this.moveTarget.x - node.x);

        if (this.moveTarget.y !== undefined)
            dy = Math.abs(this.moveTarget.y - node.y);

        if (this.moveTarget.z !== undefined)
            dz = Math.abs(this.moveTarget.z - node.z);

        const range = this.moveTarget.range !== undefined ? this.moveTarget.range : 0.5;
        return Math.sqrt(dx * dx + dy * dy + dz * dz) <= range;
    }
}