import { EventEmitter } from 'events';
import { SolverNode } from './node';
import { SolverState } from './state';
import { Goal } from './goal';
import { Strategy } from './strategy';
import Heap from 'heap';

export class Solver extends EventEmitter
{
  readonly goal: Goal;
  readonly strategies: Strategy[];
  readonly openNodes: Heap<SolverNode>;
  readonly maxDepth: number;

  steps: number;

  constructor(initialState: SolverState, goal: Goal, strategies: Strategy[], maxDepth: number = 50)
  {
    super();

    this.goal = goal;
    this.strategies = strategies;
    this.openNodes = new Heap((a, b) => a.fScore - b.fScore);
    this.maxDepth = maxDepth;
    this.steps = 0;

    const initial = new SolverNode(initialState);
    this.openNodes.push(initial);
  }

  update(): void
  {
    if (this.openNodes.size() === 0)
    {
      this.emit('noSolutionAvailable', {
        steps: this.steps
      });

      return;
    }

    const node = this.openNodes.pop();
    this.steps++;

    if (this.isSolved(node))
    {
      this.emit('solutionFound', {
        taskList: this.buildTaskList(node),
        steps: this.steps
      });

      return;
    }

    if (node.depth >= this.maxDepth)
      return;

    for (const strat of this.strategies)
    {
      const child = node.createChild();
      child.task = strat;

      strat.modifyState(child.state);
      if (!strat.isValid(child.state, this.goal))
        continue;

      child.cost += strat.estimateExecutionTime(child.state);
      child.heuristic = strat.estimateHeuristic(child.state, this.goal);

      this.openNodes.push(child);
    }
  }

  private isSolved(node: SolverNode): boolean
  {
    for (const prop in this.goal)
    {
      if (node.state[prop] !== this.goal[prop])
        return false;
    }

    return true;
  }

  private buildTaskList(node: SolverNode): Strategy[]
  {
    let n: SolverNode | undefined = node;

    const list = [];
    while (n)
    {
      if (n.task)
        list.push(n.task);

      n = n.parent;
    }

    return list.reverse();
  }
}
