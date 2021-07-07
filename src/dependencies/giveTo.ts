import { Dependency, DependencyInputs, DependencyOutputs } from "../strategy";
import { Entity } from 'prismarine-entity';

export interface GiveToInputs extends DependencyInputs
{
    /**
     * The item type to give.
     */
    itemType: string;

    /**
     * The amount to give.
     */
    count: number;

    /**
     * The entity to give the items to.
     */
    entity: Entity;
}

export interface GiveToOutputs extends DependencyOutputs
{

}

export class GiveTo implements Dependency
{
    readonly name: string = 'giveTo';
    readonly outputs: GiveToOutputs = {};

    constructor(readonly inputs: GiveToInputs) { }
}