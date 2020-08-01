import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { ObtainItems } from '../dependencies/obtainItems';
import { ObtainItem } from '../dependencies';

export class StratCollectResources extends StrategyBase
{
    readonly name: string = 'obtainItems';

    constructor(solver: Solver)
    {
        super(solver, CollectResourcesInstance);
    }

    estimateHeuristic(dependency: Dependency, depth: number): number
    {
        switch (dependency.name)
        {
            case 'obtainItems':
                const obtainItems = <ObtainItems>dependency;
                return this.quickHeuristicFor(new ObtainItem({
                    itemType: obtainItems.inputs.itemType
                }), depth) * obtainItems.inputs.count;

            default:
                return -1;
        }
    }
}

class CollectResourcesInstance extends StrategyExecutionInstance
{
    run(dependency: Dependency, cb: Callback): void
    {
        try
        {
            const obtainItems = <ObtainItems>dependency;
            let remaining = obtainItems.inputs.count;

            const collectAnother = () =>
            {
                if (remaining === 0)
                {
                    cb();
                    return;
                }

                remaining--;

                this.solveDependency(new ObtainItem({
                    itemType: obtainItems.inputs.itemType
                }), err =>
                {
                    if (err)
                    {
                        cb(err)
                        return;
                    }

                    collectAnother();
                });
            }

            collectAnother();

        }
        catch (err)
        {
            cb(err)
        }
    }
}
