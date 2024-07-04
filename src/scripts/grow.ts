import { NS } from "@ns";
import { arg } from "/lib/arg";

export async function main(ns: NS): Promise<void> {
  const target: string = arg<string>(ns.args[0]);
  const waitMs = arg<number | undefined>(ns.args[1]);

  if (waitMs) {
    ns.sleep(waitMs);
  }

  await ns.grow(target);
}
