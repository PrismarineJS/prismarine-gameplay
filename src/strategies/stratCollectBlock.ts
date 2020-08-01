import { StrategyBase, StrategyExecutionInstance, Dependency, Solver, Callback } from "../strategy";
import { CollectBlock, MoveToInteract, BreakBlock, WaitForItemDrop } from "../dependencies";
import { CollectItemDrops } from "../dependencies/collectItemDrop";

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
            default:
                return -1;
        }
    }

}

class CollectBlockInstance extends StrategyExecutionInstance
{
    run(dependency: Dependency, cb: Callback): void
    {
        try
        {
            if (dependency.name !== 'collectBlock')
                throw new Error("Unsupported dependency!");

            const collectBlock = <CollectBlock>dependency;

            this.solveDependency(new MoveToInteract({
                position: collectBlock.inputs.position
            }), err =>
            {
                if (err)
                {
                    cb(err);
                    return;
                }

                this.solveDependency(new BreakBlock({
                    position: collectBlock.inputs.position
                }), err =>
                {
                    if (err)
                    {
                        cb(err);
                        return;
                    }

                    const waitForItemDrop = new WaitForItemDrop({
                        position: collectBlock.inputs.position,
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