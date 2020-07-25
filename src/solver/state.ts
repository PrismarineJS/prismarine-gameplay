import { Targets } from './targets';
import { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';

export interface ModifiedBlock
{
  position: Vec3;
  type: string;
}

export class SolverState
{
  readonly bot: Bot;
  readonly targets: Targets;

  modifiedBlocks: ModifiedBlock[] = [];

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

    state.modifiedBlocks = [...this.modifiedBlocks];

    return state;
  }

  getBlockAt(position: Vec3): string
  {
    for (const blockType of this.modifiedBlocks)
    {
      if (blockType.position.equals(position))
        return blockType.type;
    }

    return this.bot.blockAt(position)?.name || "air";
  }
}
