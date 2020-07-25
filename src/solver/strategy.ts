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
export abstract class StrategyBase implements Strategy
{
  estimateExecutionTime(state: SolverState): number
  {
    return 10;
  }

  execute(targets: Targets, cb: (err?: Error) => void): boolean
  {
    // Do nothing by default

    cb()
    return true
  }

  modifyState(state: SolverState): void
  {
    // Do nothing by default
  }

  estimateHeuristic(state: SolverState, goal: Goal): number
  {
    let h = 0

    for (const flagName in goal)
    {
      const flagVal = goal[flagName]
      let flagH = 0

      switch (typeof flagVal)
      {
        case 'number':
          if (state[flagName] === undefined) flagH = (flagVal + 1) * 10
          else flagH = Math.abs(state[flagName] - flagVal) * 10
          break

        default:
          if (state[flagName] !== flagVal) flagH = 100
          break
      }

      if (!isNaN(flagH)) h += flagH
      else h += 100
    }

    return h
  }

  isValid(state: SolverState, goal: Goal): boolean
  {
    return true
  }
}
