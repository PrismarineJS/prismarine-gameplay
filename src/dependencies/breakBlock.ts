import { Dependency } from "../strategy";

export class BreakBlock implements Dependency
{
    readonly name: string = 'breakBlock';
    readonly x: number;
    readonly y: number;
    readonly z: number;

    constructor(x: number, y: number, z: number)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}