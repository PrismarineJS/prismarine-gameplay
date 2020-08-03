import { Bot } from "mineflayer";

class Subscription
{
    constructor(readonly eventName: string,
        readonly callback: Function)
    {
    }
}

export class TemporarySubscriber
{
    private readonly subscriptions: Subscription[] = [];

    constructor(readonly bot: Bot)
    {
    }

    subscribeTo(event: string, callback: Function)
    {
        this.subscriptions.push(new Subscription(event, callback));

        // @ts-ignore
        this.bot.on(event, callback);
    }

    cleanup()
    {
        for (const sub of this.subscriptions)
            // @ts-ignore
            this.bot.removeListener(sub.eventName, sub.callback);
    }
}