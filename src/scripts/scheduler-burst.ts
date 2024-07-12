import { NS } from "@ns";
import { formatProgressBar } from "/lib/format";
import { hasFormulas } from "/lib/formulas";
import { markdownTable } from "/lib/markdown-table";
import { listTargets, listWorkers, Target, Worker } from "/lib/servers";

const configFile = "/scheduler-burst-config.txt";

const weakenScriptName = "weaken.js";
const growScriptName = "grow.js";
const hackScriptName = "hack.js";
const shareScriptName = "share.js";

interface Config {
  threads: Record<string, Threads>;
}

interface Threads {
  weaken: number;
  grow: number;
  hack: number;
}

interface HistoryPoint {
  threads: Threads;
  target: Target;
}

type TargetHistory = HistoryPoint[];
type TargetsHistory = Record<string, TargetHistory>;

export async function main(ns: NS): Promise<void> {
  const reset = ns.args[0] === "-r";

  ns.disableLog("ALL");
  const emptyConfig: Config = { threads: {} };
  const initialConfig: Config = reset ? emptyConfig : readConfig(ns) ?? emptyConfig;
  const targetsHistory: TargetsHistory = {};

  let i = 0;
  while (true) {
    i++;
    ns.clearLog();

    const loopStartTime = Date.now();
    const workers = listWorkers(ns);
    const targets = listTargets(ns);

    for (const target of targets) {
      const targetHistory = targetsHistory[target.hostname] || [];
      const threads =
        !targetHistory.length && initialConfig && initialConfig.threads[target.hostname]
          ? initialConfig.threads[target.hostname]
          : computeJobsThreads(ns, targetHistory);

      const nbNewWeakenThreads = weakenTarget(ns, threads.weaken, workers, target);
      const nbNewGrowThreads = growTarget(ns, threads.grow, workers, target);
      const nbNewHackThreads = hackTarget(ns, threads.hack, workers, target);

      targetsHistory[target.hostname] = updateTargetHistory(targetHistory, target, {
        weaken:
          nbNewWeakenThreads < threads.weaken && targetHistory.length > 0
            ? targetHistory[targetHistory.length - 1].threads.weaken
            : threads.weaken,
        grow:
          nbNewGrowThreads < threads.grow && targetHistory.length > 0
            ? targetHistory[targetHistory.length - 1].threads.grow
            : threads.grow,
        hack:
          nbNewHackThreads < threads.hack && targetHistory.length > 0
            ? targetHistory[targetHistory.length - 1].threads.hack
            : threads.hack,
      });
    }

    // Fill with share scripts
    const shareScriptRam = ns.getScriptRam(shareScriptName);
    for (const worker of workers) {
      const nbShareThreads = Math.floor((worker.ramFree * 0.95) / shareScriptRam);
      if (nbShareThreads > 0) {
        execOnWorker(ns, "SHARE", shareScriptName, nbShareThreads, worker);
      }
    }

    if (i % 60 === 0) {
      writeConfig(ns, buildConfig(targetsHistory));
      i = 0;
    }

    printStats(ns, targetsHistory);

    const loopEndTime = Date.now();
    await ns.sleep(1000 - (loopEndTime - loopStartTime));
  }
}

function printStats(ns: NS, targetsHistory: TargetsHistory) {
  const targets = Object.entries(targetsHistory).map(([target, history]) => ({
    hostname: target,
    history,
    hack: computeThreadsStats(history, "hack"),
    weaken: computeThreadsStats(history, "weaken"),
    grow: computeThreadsStats(history, "grow"),
  }));
  targets.sort((a, b) => a.hostname.localeCompare(b.hostname));

  ns.print(
    markdownTable([
      ["target", "hack", "weaken", "grow", "calibrated"],
      ...targets.map((target) => {
        const calibrated = avg(target.hack.calibrated, target.weaken.calibrated, target.grow.calibrated);
        return [
          target.hostname,
          formatThreadsStats(target.hack),
          formatThreadsStats(target.weaken),
          formatThreadsStats(target.grow),
          calibrated !== null ? formatProgressBar(calibrated, 10) : "",
        ];
      }),
    ])
  );
}

function avg(...values: (number | null)[]): number | null {
  const nonNullValues = values.filter((v) => v !== null);
  return nonNullValues.length > 0 ? nonNullValues.reduce((acc, v) => acc + v, 0) / nonNullValues.length : null;
}

function computeThreadsStats(history: TargetHistory, threadType: keyof Threads) {
  const nbThreads = history[history.length - 1].threads[threadType];
  const nbThreadsOneMinuteAgo = history[history.length - 61]?.threads[threadType];
  const trend = nbThreadsOneMinuteAgo !== undefined ? nbThreads - nbThreadsOneMinuteAgo : null;
  const calibrated =
    trend === null ? null : nbThreads === 0 ? 0 : 1 - Math.abs(trend) / (threadType === "grow" ? 120 : 60);

  return {
    nbThreads,
    nbThreadsOneMinuteAgo,
    trend,
    calibrated,
  };
}

function formatThreadsStats(stats: ReturnType<typeof computeThreadsStats>): string {
  const nbThreadsText = String(stats.nbThreads).padStart(5);
  const trendText = stats.trend !== null ? ` (${stats.trend > 0 ? "+" : ""}${stats.trend})`.padStart(8) : "";
  return `${nbThreadsText}${trendText}`;
}

function readConfig(ns: NS): Config | null {
  const configText = ns.read(configFile);
  return configText ? (JSON.parse(configText) as Config) : null;
}

function writeConfig(ns: NS, config: Config) {
  ns.write(configFile, JSON.stringify(config), "w");
}

function buildConfig(targetsHistory: TargetsHistory): Config {
  const threads = Object.fromEntries(
    Object.entries(targetsHistory).map(([target, history]) => [target, history[history.length - 1].threads])
  );
  return {
    threads: threads,
  };
}

function updateTargetHistory(history: TargetHistory, target: Target, threads: Threads): TargetHistory {
  const maxHistoryPoints = 60; // 1min
  const newHistoryPoint: HistoryPoint = {
    threads: threads,
    target: target,
  };
  return [...history.slice(-maxHistoryPoints), newHistoryPoint];
}

function computeJobsThreads(ns: NS, history: TargetHistory): Threads {
  if (history.length < 1) return { weaken: 0, grow: 0, hack: 0 };

  const lastPoint = history[history.length - 1];
  const player = ns.getPlayer();

  const maxHackThreads = hasFormulas(ns)
    ? Math.ceil(
        1 /
          (ns.formulas.hacking.hackPercent(lastPoint.target, player) *
            ns.formulas.hacking.hackChance(lastPoint.target, player))
      )
    : Infinity;

  return {
    weaken:
      lastPoint.target.remainingDifficulty > 0.1
        ? lastPoint.threads.weaken + 1
        : lastPoint.target.remainingDifficulty < 0.05
        ? Math.max(lastPoint.threads.weaken - 1, 0)
        : lastPoint.threads.weaken,
    grow:
      lastPoint.target.moneyRatio < 0.99 && lastPoint.target.remainingDifficulty < 5
        ? lastPoint.threads.grow + 2
        : lastPoint.target.moneyRatio > 0.995
        ? Math.max(lastPoint.threads.grow - 1, 0)
        : lastPoint.threads.grow,
    hack:
      lastPoint.target.moneyRatio < 0.7
        ? Math.max(lastPoint.threads.hack - 1, 0)
        : lastPoint.target.moneyRatio > 0.9 && lastPoint.target.remainingDifficulty < 5
        ? Math.min(lastPoint.threads.hack + 1, maxHackThreads)
        : lastPoint.threads.hack,
  };
}

function weakenTarget(ns: NS, nbThreads: number, workers: Worker[], target: Target) {
  const weakenNbNewThreads = execOnAllWorkers(ns, `WEAKEN`, weakenScriptName, nbThreads, workers, target);
  return weakenNbNewThreads;
}

function growTarget(ns: NS, nbThreads: number, workers: Worker[], target: Target) {
  const growNbNewThreads = execOnAllWorkers(ns, `GROW`, growScriptName, nbThreads, workers, target);
  return growNbNewThreads;
}

function hackTarget(ns: NS, nbThreads: number, workers: Worker[], target: Target) {
  const hackNbNewThreads = execOnAllWorkers(ns, `HACK`, hackScriptName, nbThreads, workers, target);
  return hackNbNewThreads;
}

function execOnAllWorkers(
  ns: NS,
  label: string,
  scriptName: string,
  nbThreads: number,
  workers: Worker[],
  target: Target,
  waitMs: number | null = null
) {
  const scriptRam = ns.getScriptRam(scriptName);
  let nbNewThreadsTotal = 0;

  for (const worker of workers) {
    const nbNewThreads = Math.min(Math.floor(worker.ramFree / scriptRam), nbThreads - nbNewThreadsTotal);
    if (nbNewThreads > 0) {
      ns.scp(scriptName, worker.hostname);
      ns.exec(scriptName, worker.hostname, nbNewThreads, target.hostname, waitMs || 0);
      worker.ramFree = worker.ramFree - scriptRam * nbNewThreads;
      nbNewThreadsTotal = nbNewThreadsTotal + nbNewThreads;
    }
  }

  if (nbNewThreadsTotal > 0) {
    const counter = `${nbNewThreadsTotal}/${nbThreads}`;
    log(ns, label, `${target.hostname} (${counter}) (wait ${waitMs})`);
  }
  return nbNewThreadsTotal;
}

function execOnWorker(ns: NS, label: string, scriptName: string, nbThreads: number, worker: Worker) {
  const scriptRam = ns.getScriptRam(scriptName);

  const nbNewThreads = Math.min(Math.floor(worker.ramFree / scriptRam), nbThreads);
  if (nbNewThreads > 0) {
    ns.scp(scriptName, worker.hostname);
    ns.exec(scriptName, worker.hostname, nbNewThreads);
    worker.ramFree = worker.ramFree - scriptRam * nbNewThreads;
  }

  if (nbNewThreads > 0) {
    const counter = `${nbNewThreads}/${nbThreads}`;
    log(ns, label, `${worker.hostname} (${counter})`);
  }
  return nbNewThreads;
}

function log(ns: NS, label: string, msg: string) {
  if (label.includes("DELAY")) return;

  // ns.print(`${label} ${msg}`);
}
