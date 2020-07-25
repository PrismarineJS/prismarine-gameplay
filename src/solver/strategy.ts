import { SolverState } from './state';
import { Targets } from './targets';

export type Callback = (err?: Error) => void;

export interface Strategy
{
  modifyState(state: SolverState): boolean;
  estimateExecutionTime(state: SolverState): number;
  execute(targets: Targets, cb: Callback): void;
}
