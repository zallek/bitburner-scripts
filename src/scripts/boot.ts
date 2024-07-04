import { NS } from "@ns";

export const bootScripts = [
  "/scripts/scheduler.js",
  "/scripts/purchase-servers.js",
  "/scripts/monitor-targets.js",
  "/scripts/monitor-workers.js",
  "/scripts/monitor-contracts.js",
];

export async function main(ns: NS): Promise<void> {
  bootScripts.forEach((script) => {
    if (!ns.isRunning(script)) {
      ns.run(script);
    }
    ns.tail(script);
  });
}
