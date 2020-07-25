import { Vec3 } from "vec3";

export class Targets
{
  blockTypes: string[] = [];
  blockPositions: Vec3[] = [];

  clone(): Targets
  {
    const targets = new Targets()

    targets.blockTypes = [...this.blockTypes];
    targets.blockPositions = [...this.blockPositions].map(v => v.clone());

    return targets
  }
}
