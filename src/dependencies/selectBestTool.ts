import { Dependency, DependencyInputs, DependencyOutputs } from "../strategy";
import { Block } from "prismarine-block";

export interface SelectBestToolInputs extends DependencyInputs
{
    /**
     * The block that will be mined.
     */
    block: Block;

    /**
     * The item name if a special item drop is desired. If not defined, the bot
     * has no preference.
     */
    requiredDrop?: string;

    /**
     * If true, the bot will attempt to craft a tool to collect this block if a
     * tool is not currently owned. Defaults to false.
     */
    craftIfNeeded?: boolean;
}

export interface SelectBestToolOutputs extends DependencyOutputs
{

}

export class SelectBestTool implements Dependency
{
    readonly name: string = 'selectBestTool';
    readonly outputs: SelectBestToolOutputs = {};

    constructor(readonly inputs: SelectBestToolInputs) { }
}