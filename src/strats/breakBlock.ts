import { Bot } from "mineflayer";
import { Strategy } from '../solver/strategy';
import { SolverState, Targets, Goal } from "../solver";

export class BreakBlockStrategy implements Strategy
{
  readonly bot: Bot;

  constructor(bot: Bot)
  {
    this.bot = bot
  }

  modifyState(state: SolverState): void
  {
    throw new Error("Method not implemented.");
  }

  isValid(state: SolverState, goal: Goal): boolean
  {
    throw new Error("Method not implemented.");
  }

  estimateExecutionTime(state: SolverState): number
  {
    return 20
  }

  estimateHeuristic(state: SolverState, goal: Goal): number
  {
    throw new Error("Method not implemented.");
  }

  execute(targets: Targets, cb: (err?: Error | undefined) => void): void
  {
    throw new Error("Method not implemented.");
  }
}
