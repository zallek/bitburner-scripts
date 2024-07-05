import { NS } from "@ns";
import { markdownTable } from "/lib/markdown-table";
import { listRunningProcesses } from "/lib/process";
import { listTargets, listWorkers } from "/lib/servers";

export async function main(ns: NS): Promise<void> {
  while (true) {
    ns.disableLog("ALL");
    ns.clearLog();

    const targets = listTargets(ns);
    const workers = listWorkers(ns);
    const runningProcesses = listRunningProcesses(ns, workers);

    const table = [
      [`targets ${targets.length}`, "depth", "$/sec", "α", "security", "money", "hack", "weak", "grow"],
      ...targets.map((target) => [
        target.hostname,
        target.path.length,
        ns.formatNumber(target.hackAmountBySeconds, 0),
        ns.formatNumber(target.alpha, 1),
        ns.formatNumber(target.remainingDifficulty),
        ns.formatPercent(target.moneyAvailable / target.moneyMax, 2),
        formatRunningProcesses(target.hackReady, runningProcesses["hack.js"]?.[target.hostname], target.hackTime),
        formatRunningProcesses(
          target.weakenNeeded,
          runningProcesses["weaken.js"]?.[target.hostname],
          target.weakenTime
        ),
        formatRunningProcesses(target.growNeeded, runningProcesses["grow.js"]?.[target.hostname], target.growTime),
      ]),
    ];
    ns.print(markdownTable(table, { align: ["l", "r", "r", "r", "r", "r"] }));

    await ns.sleep(1000);
  }
}

function formatDuration(duration: number): string {
  const seconds = Math.floor(duration / 1000) % 60;
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor(duration / (1000 * 3600));

  let text = "";
  if (hours > 0) text += `${hours}h `;
  if (hours > 0 || minutes > 0) text += `${minutes}min `;
  if (hours > 0 || minutes > 0 || seconds > 0) text += `${seconds}s`;
  return text;
}

function formatRunningProcesses(condition: boolean, nbThreads: number, time: number) {
  let text = `${condition ? "■" : " "} `;
  if (nbThreads) {
    text += `${nbThreads} (${formatDuration(time)})`;
  }
  return text.padEnd(20, " ");
}
