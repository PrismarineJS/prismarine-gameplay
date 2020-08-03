import { Dependency, DependencyInputs, DependencyOutputs } from "../strategy";
import { Block } from "prismarine-block";

export interface SelectBestToolInputs extends DependencyInputs
{
    block: Block;
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