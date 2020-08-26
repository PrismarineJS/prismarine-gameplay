import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { DependencyResolver, HeuristicResolver } from '../tree';
import { Craft, ObtainItem } from '../dependencies';

export class StratCraftToObtain extends StrategyBase
{
    readonly name: string = 'craftItem';

    constructor(solver: Solver)
    {
        super(solver, CraftToObtainInstance);
    }

    estimateHeuristic(dependency: Dependency, resolver: HeuristicResolver): number
    {
        switch (dependency.name)
        {
            case 'obtainItem':
                const obtainTask = <ObtainItem>dependency;
                return resolver(new Craft({
                    itemType: obtainTask.inputs.itemType,
                    count: 1
                }));

            default:
                return -1;
        }
    }
}

class CraftToObtainInstance extends StrategyExecutionInstance
{
    handle(dependency: Dependency, resolver: DependencyResolver, cb: Callback): void
    {
        if (dependency.name !== 'obtainItem')
            throw new Error("Unsupported dependency!");

        const obtainTask = <ObtainItem>dependency;

        resolver(new Craft({
            itemType: obtainTask.inputs.itemType,
            count: 1
        }), cb);
    }
}