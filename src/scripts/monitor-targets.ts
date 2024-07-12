import { NS } from "@ns";
import { formatDuration, formatProgressBar } from "/lib/format";
import { markdownTable } from "/lib/markdown-table";
import { listRunningProcesses } from "/lib/process";
import { listTargets, listWorkers } from "/lib/servers";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  while (true) {
    ns.clearLog();

    const targets = listTargets(ns);
    const workers = listWorkers(ns);
    const runningProcesses = listRunningProcesses(ns, workers);
    targets.sort((a, b) => a.hostname.localeCompare(b.hostname));

    const table = [
      [`targets ${targets.length}`, "depth", "$/sec", "α", "security", "money", "hack", "weak", "grow"],
      ...targets.map((target) => [
        target.hostname,
        target.path.length,
        ns.formatNumber(target.hackAmountBySeconds, 0),
        ns.formatNumber(target.alpha, 1),
        formatProgressBar(1 - Math.min(target.remainingDifficulty, 50) / 50, 10) +
          " " +
          ns.formatNumber(target.remainingDifficulty),
        formatProgressBar(target.moneyAvailable / target.moneyMax, 10) +
          " " +
          ns.formatNumber(target.moneyAvailable / target.moneyMax),
        formatRunningProcesses(target.hackReady, runningProcesses["hack.js"]?.[target.hostname], target.hackTime),
        formatRunningProcesses(
          target.weakenNeeded,
          runningProcesses["weaken.js"]?.[target.hostname],
          target.weakenTime
        ),
        formatRunningProcesses(target.growNeeded, runningProcesses["grow.js"]?.[target.hostname], target.growTime),
      ]),
    ];
    ns.print(markdownTable(table, { align: ["l", "r", "r", "r"] }));

    await ns.sleep(1000);
  }
}

function formatRunningProcesses(condition: boolean, nbThreads: number, time: number) {
  let text = `${condition ? "■" : " "} `;
  if (nbThreads) {
    text += `${nbThreads} (${formatDuration(time)})`;
  }
  return text.padEnd(20, " ");
}
