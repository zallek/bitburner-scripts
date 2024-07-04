import { NS } from "@ns";

export const bootScripts = [
  "/scripts/monitor-contracts.js",
  "/scripts/monitor-workers.js",
  "/scripts/monitor-targets.js",
  "/scripts/purchase-servers.js",
  "/scripts/search-contracts.js",
  "/scripts/scheduler.js",
];

export async function main(ns: NS): Promise<void> {
  bootScripts.forEach((script) => {
    if (!ns.isRunning(script)) {
      ns.run(script);
    }
    ns.tail(script);
  });
}
