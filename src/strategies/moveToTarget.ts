import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { Bot } from 'mineflayer';
import { Movements, Result, Move } from 'mineflayer-pathfinder';
import { MoveTo, MoveTarget } from '../dependencies/moveTo';
import { Vec3 } from 'vec3';

const { Goal } = require('mineflayer-pathfinder').goals;

export class MoveToTarget extends StrategyBase
{
    readonly name: string = 'moveToTarget';
    readonly bot: Bot;

    constructor(solver: Solver)
    {
        super(solver);
        this.bot = solver.bot;
    }

    createExecutionInstance(): StrategyExecutionInstance
    {
        return new MoveToTargetInstance(this.bot);
    }

    estimateHeuristic(dependency: Dependency): number
    {
        switch (dependency.name)
        {
            case 'moveTo':
                const moveTo = <MoveTo>dependency;
                return this.calculateHeuristicForMoveTarget(moveTo.moveTarget);

            default:
                return -1;
        }
    }

    private calculateHeuristicForMoveTarget(moveTarget: MoveTarget): number
    {
        const y = moveTarget.y !== undefined ? moveTarget.y : this.bot.entity.position.y;
        const pos = new Vec3(moveTarget.x, y, moveTarget.z);

        let distance = pos.distanceTo(this.bot.entity.position);
        distance *= 1.2; // Add 20% for pathfinding around stuff

        return distance;
    }
}

export class MoveToTargetInstance implements StrategyExecutionInstance
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
            if (dependency.name !== 'moveTo')
                throw new Error("Unsupported dependency!");

            const moveTo = <MoveTo>dependency;

            // @ts-ignore
            if (this.bot.gameplay.debugText)
            {
                let moveTargetText: string;
                if (moveTo.moveTarget.y === undefined)
                    moveTargetText = `(${moveTo.moveTarget.x, moveTo.moveTarget.z})`;
                else
                    moveTargetText = `(${moveTo.moveTarget.x, moveTo.moveTarget.y, moveTo.moveTarget.z})`;

                console.log(`Moving from ${this.bot.entity.position} to ${moveTargetText}`);
            }

            // @ts-ignore
            const pathfinder: Pathfinder = this.bot.pathfinder;

            const mcData = require('minecraft-data')(this.bot.version);
            const defaultMove = new Movements(this.bot, mcData);
            pathfinder.setMovements(defaultMove);

            const goal = new MoveTargetGoal(moveTo.moveTarget);
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
    readonly moveTarget: MoveTarget;

    constructor(moveTarget: MoveTarget)
    {
        super();

        this.moveTarget = {
            x: Math.floor(moveTarget.x),
            y: moveTarget.y != undefined ? Math.floor(moveTarget.y) : undefined,
            z: Math.floor(moveTarget.z),
            range: moveTarget.range,
        };
    }

    heuristic(node: Move): number
    {
        const dx = this.moveTarget.x - node.x;
        const dz = this.moveTarget.z - node.z;
        let dy = 0;

        if (this.moveTarget.y !== undefined)
            dy = Math.abs(this.moveTarget.y - node.y);

        return distanceXZ(dx, dz) + Math.abs(dy);
    }

    isEnd(node: Move): boolean
    {
        const dx = this.moveTarget.x - node.x;
        const dz = this.moveTarget.z - node.z;
        let dy = 0;

        if (this.moveTarget.y !== undefined)
            dy = Math.abs(this.moveTarget.y - node.y);

        const range = this.moveTarget.range !== undefined ? this.moveTarget.range : 0.5;
        return Math.sqrt(dx * dx + dy * dy + dz * dz) <= range;
    }
}