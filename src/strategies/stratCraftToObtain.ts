import { StrategyBase, StrategyExecutionInstance, Dependency, Callback, Solver } from '../strategy';
import { DependencyResolver } from '../tree';
import { ObtainItem } from '../dependencies';
import { Craft } from '../dependencies/craft';

export class StratCraftToObtain extends StrategyBase
{
    readonly name: string = 'craftItem';

    constructor(solver: Solver)
    {
        super(solver, CraftToObtainInstance);
    }

    estimateHeuristic(dependency: Dependency): number
    {
        switch (dependency.name)
        {
            case 'obtainItem':
                return 1;

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

        const obtainItemTask = <ObtainItem>dependency;

        resolver(new Craft({
            itemType: obtainItemTask.inputs.itemType,
            count: 1
        }), cb);
    }
}