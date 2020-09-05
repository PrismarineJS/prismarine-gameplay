import { Dependency, StrategyBase } from ".";
import { Heuristics } from "./strategy";

const UNLIKELY_TO_RESOLVE_COST = 1000000;

/**
 * Preforms a search over all available strategies to determine what strategies can be used to solve
 * the given task, sorted by how effcient the tasks are as well as how likely the tasks are to succeed.
 * 
 * Technical note: strategies which are estimated to fail after several steps will return exetremely high
 * values, (>= 1,000,000), but are still maintained in the list as the world state may change, causing
 * previously uncompletelable tasks to become completable. (I.e. an item only dropping after a block is mined.)
 * Tasks that are expected to immediately fail are removed from the list.
 * 
 * @param task - The task to solve for.
 * @param strategies - The list of all available strategies which can be used.
 * @param maxDepth - The maximum number of steps to look ahead. Defaults to 8. Higher values may offer
 *                   more accurate estimates in some situations but will significantly increase execution
 *                   time.
 * 
 * @returns {[StrategyBase, number][]} - A list of all available strategies as well as the estimated heuristic cost.
 *                                       This list is sorted from lowest cost to highest cost.
 */
export function findSolutions(task: Dependency, strategies: StrategyBase[], maxDepth: number = 8): [StrategyBase, number][]
{
    const nodes: [StrategyBase, number][] = [];

    for (const strat of strategies)
    {
        try
        {
            const h = strat.estimateHeuristic(task);

            if (!h)
                continue;
            
            const cost = resolveCostFor(task, strategies, maxDepth);
            nodes.push([strat, cost]);
        }
        catch(err)
        {
            continue;
        }
    }

    nodes.sort((a, b) => a[1] - b[1]);
    return nodes;
}

function heuristicToValue(h: Heuristics): number
{
    // As more properties are added, this equation should be updated.
    // Quick and dirty assertion for checking if the object definition has changed.
    if (Object.keys(h).length !== 2)
        throw new Error("Heuristic definition has changed!");

    return h.time;
}

function resolveCostFor(task: Dependency, strategies: StrategyBase[], maxDepth: number): number
{
    let cost = UNLIKELY_TO_RESOLVE_COST

    for (const strat of strategies)
    {
        try
        {
            const h = strat.estimateHeuristic(task);

            if (!h)
                continue;

            let childCost = heuristicToValue(h);

            if (maxDepth > 1)
            {
                for (const childTask of h.childTasks)
                    childCost += resolveCostFor(childTask, strategies, maxDepth - 1);
            }

            cost = Math.min(cost, childCost);
        }
        catch(err)
        {
            continue;
        }
    }

    return cost;
}
