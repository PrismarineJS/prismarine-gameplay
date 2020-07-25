import { Targets } from './targets';
import { Bot } from 'mineflayer';
import { FlagContainer } from './flag';

export class SolverState
{
  readonly bot: Bot;
  readonly targets: Targets;
  readonly flags: FlagContainer;

  constructor(bot: Bot, targets: Targets, flags: FlagContainer)
  {
    this.bot = bot
    this.targets = targets
    this.flags = flags;
  }

  clone(): SolverState
  {
    return new SolverState(this.bot, this.targets.clone(), this.flags.clone());
  }
}
