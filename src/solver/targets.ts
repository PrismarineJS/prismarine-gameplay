import { Vec3 } from "vec3";

export class Targets
{
  blockTypes: string[] = [];
  blockPosition?: Vec3;

  clone(): Targets
  {
    const targets = new Targets()

    targets.blockTypes = [...this.blockTypes];
    targets.blockPosition = this.blockPosition?.clone()

    return targets
  }
}
