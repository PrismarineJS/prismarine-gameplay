import { Dependency } from "../strategy";

export class ObtainItem implements Dependency
{
    readonly name: string = 'obtainItem';

    readonly itemType: number;

    constructor(itemType: number)
    {
        this.itemType = itemType;
    }
}