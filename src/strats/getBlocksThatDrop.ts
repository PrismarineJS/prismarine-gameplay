import { SolverState, Targets, Strategy, Callback } from '../solver';
import { Bot } from 'mineflayer';

function getBlockTypesByDrops(mcData: any, blockType: string): string[]
{
  const targetId = mcData.blocksByName[blockType].id;
  const blocks = [];

  for (const block of mcData.blocksArray)
  {
    for (const drop of block.drops)
    {
      if (drop === targetId)
      {
        blocks.push(block.name);
        break;
      }
    }
  }

  return blocks;
}

export class GetBlocksThatDropStrategy implements Strategy
{
  private mcData?: any;

  readonly bot: Bot;

  constructor(bot: Bot)
  {
    this.bot = bot
  }

  modifyState(state: SolverState): boolean
  {
    try 
    {
      this.findBlocks(state.targets);
      return true;
    }
    catch (err)
    {
      return false;
    }
  }

  estimateExecutionTime(): number
  {
    return 1;
  }

  execute(targets: Targets, cb: Callback): void
  {
    try
    {
      this.findBlocks(targets)
      cb()
    }
    catch (err)
    {
      cb(err)
    }
  }

  private findBlocks(targets: Targets): void
  {
    if (targets.blockTypes === undefined)
      throw new Error("Block types not defined in targets!");

    if (this.mcData === undefined)
      this.mcData = require('minecraft-data')(this.bot.version);

    const blockTypes = [];
    for (const type of targets.blockTypes)
    {
      blockTypes.push(...getBlockTypesByDrops(this.mcData, type))
    }

    if (blockTypes.length === 0)
      throw new Error("No block types available!");

    targets.blockTypes = blockTypes
  }
}
