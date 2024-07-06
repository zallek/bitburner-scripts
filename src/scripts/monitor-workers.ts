import { NS } from "@ns";
import { formatProgressBar } from "/lib/format";
import { markdownTable } from "/lib/markdown-table";
import { listRunningProcessesOnWorker } from "/lib/process";
import { listWorkers } from "/lib/servers";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  while (true) {
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
          formatProgressBar(worker.ramUsed / worker.maxRam, 25),
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
