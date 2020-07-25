export class Targets
{
  blockTypes?: string[];

  clone(): Targets
  {
    const targets = new Targets()

    targets.blockTypes = this.blockTypes;

    return targets
  }
}
