export class Targets
{
  [property: string]: any;

  clone(): Targets
  {
    const targets = new Targets()
    for (const prop in this) targets[prop] = this[prop]

    return targets
  }
}
