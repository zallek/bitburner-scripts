import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  const target = ns.args[0] as string;
  const waitMs = ns.args[1] as number | undefined;

  if (waitMs) {
    ns.sleep(waitMs);
  }

  await ns.weaken(target);
}
