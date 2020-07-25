import { Targets } from './targets';
import { Bot } from 'mineflayer';

export class SolverState
{
  readonly bot: Bot;
  readonly targets: Targets;

  [property: string]: any;

  constructor(bot: Bot, targets?: Targets)
  {
    if (targets === undefined)
      targets = new Targets();

    this.bot = bot
    this.targets = targets
  }

  clone(): SolverState
  {
    const state = new SolverState(this.bot, this.targets.clone());

    for (const prop in this)
      if (state[prop] === undefined)
        state[prop] = this[prop];

    return state;
  }
}
