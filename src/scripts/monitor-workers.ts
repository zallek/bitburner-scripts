import { NS } from "@ns";
import { listWorkers, Worker } from "/lib/servers";
import { markdownTable } from "/lib/markdown-table";
import { listRunningProcessesOnWorker } from "/lib/process";

export async function main(ns: NS): Promise<void> {
  while (true) {
    ns.disableLog("ALL");
    ns.clearLog();

    const workers = listWorkers(ns);
    workers.sort((a, b) => {
      if (a.hostname == "home") return -1;
      if (b.hostname == "home") return 1;
      return b.maxRam - a.maxRam || a.hostname.localeCompare(b.hostname);
    });
    const table = [
      [`workers ${workers.length}`, "RAM", "usage", "hack", "weak", "grow", "share"],
      ...workers.map((worker) => {
        const runningProcesses = listRunningProcessesOnWorker(ns, worker);
        return [
          worker.hostname,
          ns.formatRam(worker.maxRam, 0),
          formatWorkerUsageBar(ns, worker),
          Object.values(runningProcesses["hack.js"] || {}).reduce((acc, v) => acc + v, 0) || "",
          Object.values(runningProcesses["weaken.js"] || {}).reduce((acc, v) => acc + v, 0) || "",
          Object.values(runningProcesses["grow.js"] || {}).reduce((acc, v) => acc + v, 0) || "",
          Object.values(runningProcesses["share.js"] || {}).reduce((acc, v) => acc + v, 0) || "",
        ];
      }),
    ];
    ns.print(markdownTable(table, { align: ["l", "r"] }));

    await ns.sleep(1000);
  }
}

function formatWorkerRam(ns: NS, worker: Worker): string {
  const usableRam = Math.max(worker.maxRam - worker.ramReserved, 0);
  let text = ns.formatRam(usableRam, 0);
  if (worker.ramReserved) {
    text += ` (+${ns.formatRam(Math.min(worker.ramReserved, worker.maxRam), 0)})`;
  }
  return text;
}

function formatWorkerUsageBar(ns: NS, worker: Worker): string {
  const nbSegments = 25;
  let text = "";
  for (let i = 0; i < (worker.ramUsed / worker.maxRam) * nbSegments; i++) {
    text += "/";
  }
  return text;
}
