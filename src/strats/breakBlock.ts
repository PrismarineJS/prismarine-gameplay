import { Bot } from "mineflayer";
import { Strategy, Callback } from '../solver/strategy';
import { SolverState, Targets } from "../solver";

export class BreakBlockStrategy implements Strategy
{
  readonly bot: Bot;

  constructor(bot: Bot)
  {
    this.bot = bot
  }

  modifyState(state: SolverState): boolean
  {
    if (!state.targets.blockPosition)
      return false;

    if (state.getBlockAt(state.targets.blockPosition) === 'air')
      return false;

    state.modifiedBlocks.push({
      position: state.targets.blockPosition,
      type: "air"
    });

    return true;
  }

  estimateExecutionTime(state: SolverState): number
  {
    // TODO Calculate tools available
    return 20
  }

  execute(targets: Targets, cb: Callback): void
  {
    try
    {
      if (targets.blockPosition === undefined)
        throw new Error("Block position not defined in targets!");

      const block = this.bot.blockAt(targets.blockPosition);

      if (!block || block.name === 'air' || block.name === 'bedrock')
        throw new Error(`Cannot mine block type '${block?.name || 'air'}'!`);

      this.bot.dig(block, cb);
    }
    catch (err)
    {
      cb(err)
    }
  }
}
