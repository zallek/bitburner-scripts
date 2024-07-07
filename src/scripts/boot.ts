import { NS } from "@ns";

export const bootScripts = [
  "/scripts/scheduler.js",
  "/scripts/purchase-servers.js",
  "/scripts/monitor-targets.js",
  // "/scripts/monitor-workers.js",
  "/scripts/monitor-contracts.js",
  "/scripts/gang.js",
];

export async function main(ns: NS): Promise<void> {
  for (const script of bootScripts) {
    if (!ns.isRunning(script)) {
      ns.run(script);
    }
    ns.tail(script);
  }
}
