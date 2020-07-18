import { Bot } from "mineflayer";

export class Gameplay
{
    bot: Bot;
    constructor(bot: Bot);
    addStrategy(strategy: Strategy): void;
    getStrategy(name: string): Strategy;
    runStrategy(name: string, options: any, cb: (err?: Error) => void): void;
}

export class Strategy
{
    name: string;
    bot: Bot;
    constructor(name: string, bot: Bot);
    run(options: any, cb: (err?: Error) => void): void;
    exit(): void;
}
