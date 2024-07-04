import { NS } from "@ns";
import { markdownTable } from "/lib/markdown-table";
import { listTargets, listWorkers } from "/lib/servers";
import { listRunningProcesses } from "/lib/process";

export async function main(ns: NS): Promise<void> {
  while (true) {
    ns.disableLog("ALL");
    ns.clearLog();

    const targets = listTargets(ns);
    const workers = listWorkers(ns, 0);
    const runningProcesses = listRunningProcesses(ns, workers);

    const table = [
      [`targets ${targets.length}`, "depth", "$ / second", "security", "money", "hack", "weak", "grow"],
      ...targets.map((target) => [
        target.hostname,
        target.path.length,
        ns.formatNumber(target.hackAmountBySeconds, 0),
        ns.formatNumber(target.remainingDifficulty),
        ns.formatPercent(target.moneyAvailable / target.moneyMax, 2),
        formatRunningProcesses(target.hackReady, runningProcesses["scripts/hack.js"]?.[target.hostname]),
        formatRunningProcesses(target.weakenNeeded, runningProcesses["scripts/weaken.js"]?.[target.hostname]),
        formatRunningProcesses(target.growNeeded, runningProcesses["scripts/grow.js"]?.[target.hostname]),
      ]),
    ];
    ns.print(markdownTable(table, { align: ["l", "r", "r", "r"] }));

    await ns.sleep(1000);
  }
}

function formatRunningProcesses(condition: boolean, nbThreads: number) {
  let text = `${condition ? "■" : " "} `;
  if (nbThreads) {
    text += `${nbThreads}`;
  }
  return text;
}
