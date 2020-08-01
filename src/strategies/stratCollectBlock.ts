import { StrategyBase, StrategyExecutionInstance, Dependency, Solver, Callback } from "../strategy";
import { CollectBlock, MoveToInteract, BreakBlock, WaitForItemDrop, ObtainItem } from "../dependencies";
import { CollectItemDrops } from "../dependencies/collectItemDrop";
import { Vec3 } from "vec3";

export class StratCollectBlock extends StrategyBase
{
    readonly name: string = 'collectBlock';

    constructor(solver: Solver)
    {
        super(solver, CollectBlockInstance);
    }

    estimateHeuristic(dependency: Dependency): number
    {
        switch (dependency.name)
        {
            case 'collectBlock':
                return this.collectBlockHeuristic((<CollectBlock>dependency).inputs.position);

            case 'obtainItem':
                return this.obtainItemHeuristic((<ObtainItem>dependency).inputs.itemType);

            default:
                return -1;
        }
    }

    private obtainItemHeuristic(itemType: number): number
    {
        const block = this.bot.findBlock({
            matching: b => b.type === itemType,
            maxDistance: 32
        });

        if (!block)
            return -1;

        let distance = this.bot.entity.position.distanceTo(block.position);
        distance *= 1.2; // 20% for pathfinding around stuff
        distance *= 10; // Estimates 10 ticks per block movement

        const collectH = this.collectBlockHeuristic(block.position);
        return this.addH(distance, collectH);
    }

    private collectBlockHeuristic(position: Vec3): number
    {
        let h = 0;

        const moveToInteract = new MoveToInteract({
            position: position
        });

        const breakBlock = new BreakBlock({
            position: position
        });

        const waitForItemDrop = new WaitForItemDrop({
            position: position,
            maxDistance: 1,
            maxTicks: 10,
            groupItems: true
        });

        const collectItemDrop = new CollectItemDrops({
            items: []
        });

        h = this.addH(h, this.quickHeuristicFor(moveToInteract));
        h = this.addH(h, this.quickHeuristicFor(breakBlock));
        h = this.addH(h, this.quickHeuristicFor(waitForItemDrop));
        h = this.addH(h, this.quickHeuristicFor(collectItemDrop));

        return h;
    }

    private addH(h: number, v: number): number
    {
        if (h < 0 || v < 0)
            return -1;

        return h + v;
    }
}

class CollectBlockInstance extends StrategyExecutionInstance
{
    run(dependency: Dependency, cb: Callback): void
    {
        try
        {
            let position: Vec3;

            switch (dependency.name)
            {
                case 'collectBlock':
                    const collectBlock = <CollectBlock>dependency;
                    position = collectBlock.inputs.position;
                    break;

                case 'obtainItem':
                    const obtainItem = <ObtainItem>dependency;
                    position = this.bot.findBlock({
                        matching: b => b.type === obtainItem.inputs.itemType,
                        maxDistance: 32
                    })?.position;

                    if (!position)
                        throw new Error("Cannot find block!");

                    break;

                default:
                    throw new Error("Unsupported dependency!");
            }


            this.solveDependency(new MoveToInteract({
                position: position
            }), err =>
            {
                if (err)
                {
                    cb(err);
                    return;
                }

                this.solveDependency(new BreakBlock({
                    position: position
                }), err =>
                {
                    if (err)
                    {
                        cb(err);
                        return;
                    }

                    const waitForItemDrop = new WaitForItemDrop({
                        position: position,
                        maxDistance: 1,
                        maxTicks: 10,
                        groupItems: true
                    });

                    this.solveDependency(waitForItemDrop, err =>
                    {
                        if (err)
                        {
                            cb(err);
                            return;
                        }

                        const collectItemDrop = new CollectItemDrops({
                            items: waitForItemDrop.outputs.itemDrops
                        });

                        this.solveDependency(collectItemDrop, err =>
                        {
                            if (err)
                            {
                                cb(err);
                                return;
                            }

                            cb();
                        });
                    });
                })
            });
        }
        catch (err)
        {
            cb(err)
        }
    }
}