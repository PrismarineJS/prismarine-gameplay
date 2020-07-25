import { SolverState } from "./state";
import { Strategy } from "./strategy";

export class SolverNode
{
  readonly state: SolverState;

  cost: number = 0;
  heuristic: number = 0;
  depth: number;

  task?: Strategy;
  parent?: SolverNode;

  constructor(state: SolverState)
  {
    this.state = state;
    this.depth = 0;
  }

  get fScore(): number
  {
    return this.cost + this.heuristic;
  }

  createChild(): SolverNode
  {
    const node = new SolverNode(this.state.clone());
    node.cost = this.cost;
    node.heuristic = this.heuristic;
    node.parent = this;
    node.depth = this.depth + 1

    return node;
  }
}
