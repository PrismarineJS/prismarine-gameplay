import { Dependency } from "../strategy";

export class ObtainItem implements Dependency
{
    readonly name: string = 'obtainItem';

    readonly itemType: number;
    readonly count: number;

    constructor(itemType: number, count: number)
    {
        this.itemType = itemType;
        this.count = count;
    }
}