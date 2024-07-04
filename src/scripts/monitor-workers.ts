import { NS } from "@ns";
import { listWorkers, Worker } from "/lib/servers";
import { markdownTable } from "/lib/markdown-table";
import { listRunningProcessesOnWorker } from "/lib/process";

export async function main(ns: NS): Promise<void> {
  while (true) {
    ns.disableLog("ALL");
    ns.clearLog();

    const workers = listWorkers(ns, 0);
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
          ns.formatRam(worker.maxRam),
          formatWorkerUsageBar(worker),
          Object.values(runningProcesses["scripts/hack.js"] || {}).reduce((acc, v) => acc + v, 0),
          Object.values(runningProcesses["scripts/weaken.js"] || {}).reduce((acc, v) => acc + v, 0),
          Object.values(runningProcesses["scripts/grow.js"] || {}).reduce((acc, v) => acc + v, 0),
          Object.values(runningProcesses["scripts/share.js"] || {}).reduce((acc, v) => acc + v, 0),
        ];
      }),
    ];
    ns.print(markdownTable(table, { align: ["l", "r"] }));

    await ns.sleep(1000);
  }
}

function formatWorkerUsageBar(worker: Worker) {
  const nbSegments = 25;
  let text = "";
  for (let i = 0; i < (worker.ramUsed / worker.maxRam) * nbSegments; i++) {
    text += "/";
  }
  return text;
}
