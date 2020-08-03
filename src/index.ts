import { Bot } from 'mineflayer';
import { Gameplay } from './gameplay';

export * from './gameplay';
export * from './strategy';
export * from './dependencies';
export * from './tree';

export function gameplay(bot: Bot): void
{
    const gameplay = new Gameplay(bot);

    // @ts-ignore
    bot.gameplay = gameplay;
}
