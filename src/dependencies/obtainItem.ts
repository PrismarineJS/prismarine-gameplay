import { Dependency } from "../strategy";

export class ObtainItem implements Dependency
{
    readonly name: string = 'obtainItem';

    /**
     * The item ID to obtain.
     */
    readonly itemType: number;

    constructor(itemType: number)
    {
        this.itemType = itemType;
    }
}