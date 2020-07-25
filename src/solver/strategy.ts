import { SolverState } from './state';
import { Targets } from './targets';
import { Goal } from './goal';

export interface Strategy
{
  modifyState(state: SolverState): void;
  isValid(state: SolverState, goal: Goal): boolean;
  estimateExecutionTime(state: SolverState): number;
  estimateHeuristic(state: SolverState, goal: Goal): number;
  execute(targets: Targets, cb: (err?: Error) => void): void;
}
