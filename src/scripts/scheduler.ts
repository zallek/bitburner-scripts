import { NS } from "@ns";
import { listRunningProcesses, listRunningProcessesOnWorker, NO_TARGET } from "/lib/process";
import { listTargets, listWorkers, Target, Worker } from "/lib/servers";

const weakenScriptName = "weaken.js";
const growScriptName = "grow.js";
const hackScriptName = "hack.js";
const shareScriptName = "share.js";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  while (true) {
    const shareScriptRam = ns.getScriptRam(shareScriptName);

    const workers = listWorkers(ns);
    const targets = listTargets(ns);

    let clusterFull = false;
    for (const target of targets) {
      if (target.hackReady) {
        const hackNbThreads = Math.floor((target.moneyAvailable / 2 / target.hackAmount) * target.hackChance);
        const [_, hackNbRunningsThreads] = hackTarget(ns, hackNbThreads, hackNbThreads, workers, target);
        if (hackNbRunningsThreads < hackNbThreads) {
          clusterFull = true;
          break;
        }
      }
    }

    if (!clusterFull) {
      for (const target of targets) {
        if (target.weakenNeeded) {
          // TODO compute according to numbers of cores - weakenAnalyze
          const weakenNbThreads = Math.floor((target.hackDifficulty - target.minDifficulty) / 0.05);
          const [_, weakenNbRunningsThreads] = weakenTarget(ns, weakenNbThreads, weakenNbThreads, workers, target);
          if (weakenNbRunningsThreads < weakenNbThreads) {
            clusterFull = true;
            break;
          }
        }

        if (target.growNeeded) {
          // TODO compute according to number of cores
          const growNbThreads = Math.floor(
            ns.growthAnalyze(target.hostname, target.moneyAvailable ? target.moneyMax / target.moneyAvailable : 10)
          );
          const [_, growNbRunningsThreads] = growTarget(ns, growNbThreads, growNbThreads, workers, target);
          if (growNbRunningsThreads < growNbThreads) {
            clusterFull = true;
            break;
          }
        }
      }
    }

    if (!clusterFull) {
      // Fill remaining workers with hacks
      for (const target of targets) {
        const fillHackNbThreads = Math.floor((target.moneyAvailable / 5 / target.hackAmount) * target.hackChance);
        hackTarget(ns, fillHackNbThreads, fillHackNbThreads, workers, target, null, "FILL-");
      }

      for (const worker of workers) {
        const nbShareThreads = Math.floor(worker.ramFree / shareScriptRam);
        if (nbShareThreads > 0) {
          execOnWorker(ns, "SHARE", shareScriptName, nbShareThreads, nbShareThreads, worker);
        }
      }
    }

    await ns.sleep(1000);
  }
}

function weakenTarget(
  ns: NS,
  nbThreads: number,
  maxNbThreads: number | null,
  workers: Worker[],
  target: Target,
  waitMs: number | null = null,
  parent = ""
) {
  const [weakenNbNewThreads, weakenNbRunningsThreads] = execOnAllWorkers(
    ns,
    `${parent}WEAKEN`,
    weakenScriptName,
    nbThreads,
    maxNbThreads,
    workers,
    target,
    waitMs
  );
  return [weakenNbNewThreads, weakenNbRunningsThreads];
}

function growTarget(
  ns: NS,
  nbThreads: number,
  maxNbThreads: number | null,
  workers: Worker[],
  target: Target,
  waitMs: number | null = null,
  parent = ""
) {
  const [growNbNewThreads, growNbRunningsThreads] = execOnAllWorkers(
    ns,
    `${parent}GROW`,
    growScriptName,
    nbThreads,
    maxNbThreads,
    workers,
    target,
    waitMs
  );

  if (growNbNewThreads > 0) {
    const securityIncrease = ns.growthAnalyzeSecurity(growNbNewThreads, target.hostname);
    const weakenNbThreads = Math.floor(securityIncrease / 0.05);
    const weakenWaitMs = target.growTime - target.weakenTime;
    log(ns, "GROW-WEAKEN-DELAY", `${weakenWaitMs}`);
    weakenTarget(ns, weakenNbThreads, null, workers, target, Math.max(weakenWaitMs, 0), "GROW-");
  }

  return [growNbNewThreads, growNbRunningsThreads];
}

function hackTarget(
  ns: NS,
  nbThreads: number,
  maxNbThreads: number | null,
  workers: Worker[],
  target: Target,
  waitMs: number | null = null,
  parent = ""
) {
  const [hackNbNewThreads, hackNbRunningsThreads] = execOnAllWorkers(
    ns,
    `${parent}HACK`,
    hackScriptName,
    nbThreads,
    maxNbThreads,
    workers,
    target,
    waitMs
  );

  if (hackNbNewThreads > 0) {
    const securityIncrease = ns.hackAnalyzeSecurity(hackNbNewThreads, target.hostname);
    const weakenNbThreads = Math.floor(securityIncrease / 0.05);
    const weakenWaitMs = target.hackTime - target.weakenTime;
    log(ns, "HACK-WEAKEN-DELAY", `${weakenWaitMs}`);
    weakenTarget(ns, weakenNbThreads, null, workers, target, Math.max(weakenWaitMs, 0), "HACK-");

    const moneyStolen = hackNbNewThreads * target.hackAmount * target.hackChance;
    const growNbThreads = Math.floor(
      ns.growthAnalyze(target.hostname, target.moneyAvailable / (target.moneyAvailable - moneyStolen))
    );
    const growWaitMs = target.hackTime - target.growTime;
    log(ns, "HACK-GROW-DELAY", `${growWaitMs}`);
    growTarget(ns, growNbThreads, null, workers, target, Math.max(growWaitMs, 0), "HACK-");
  }

  return [hackNbNewThreads, hackNbRunningsThreads];
}

function execOnAllWorkers(
  ns: NS,
  label: string,
  scriptName: string,
  nbThreads: number,
  maxNbThreads: number | null,
  workers: Worker[],
  target: Target,
  waitMs: number | null
) {
  const scriptRam = ns.getScriptRam(scriptName);

  let nbNewThreadsTotal = 0;
  const runningProcesses = listRunningProcesses(ns, workers);
  let nbRunningsThreads = runningProcesses[scriptName]?.[target.hostname] || 0;

  for (const worker of workers) {
    let nbNewThreads = Math.min(Math.floor(worker.ramFree / scriptRam), nbThreads - nbNewThreadsTotal);
    if (maxNbThreads != null) {
      nbNewThreads = Math.min(nbNewThreads, maxNbThreads - nbRunningsThreads);
    }

    if (nbNewThreads > 0) {
      ns.scp(scriptName, worker.hostname);
      ns.exec(scriptName, worker.hostname, nbNewThreads, target.hostname, waitMs || 0);
      worker.ramFree = worker.ramFree - scriptRam * nbNewThreads;
      nbNewThreadsTotal = nbNewThreadsTotal + nbNewThreads;
      nbRunningsThreads = nbRunningsThreads + nbNewThreads;
    }
  }

  if (nbNewThreadsTotal > 0) {
    const counter =
      maxNbThreads !== null ? `${nbRunningsThreads}/${maxNbThreads}` : `${nbNewThreadsTotal}/${nbThreads}`;
    log(ns, label, `${target.hostname} (${counter}) (wait ${waitMs})`);
  }
  return [nbNewThreadsTotal, nbRunningsThreads];
}

function execOnWorker(
  ns: NS,
  label: string,
  scriptName: string,
  nbThreads: number,
  maxNbThreads: number | null,
  worker: Worker
) {
  const scriptRam = ns.getScriptRam(scriptName);

  const runningProcesses = listRunningProcessesOnWorker(ns, worker);
  let nbRunningsThreads = runningProcesses[scriptName]?.[NO_TARGET] || 0;

  let nbNewThreads = Math.min(Math.floor(worker.ramFree / scriptRam), nbThreads);
  if (maxNbThreads != null) {
    nbNewThreads = Math.min(nbNewThreads, maxNbThreads - nbRunningsThreads);
  }

  if (nbNewThreads > 0) {
    ns.scp(scriptName, worker.hostname);
    ns.exec(scriptName, worker.hostname, nbNewThreads);
    worker.ramFree = worker.ramFree - scriptRam * nbNewThreads;
    nbRunningsThreads = nbRunningsThreads + nbNewThreads;
  }

  if (nbNewThreads > 0) {
    const counter = maxNbThreads !== null ? `${nbRunningsThreads}/${maxNbThreads}` : `${nbNewThreads}/${nbThreads}`;
    log(ns, label, `${worker.hostname} (${counter})`);
  }
  return [nbNewThreads, nbRunningsThreads];
}

function log(ns: NS, label: string, msg: string) {
  if (label.includes("DELAY")) return;

  ns.print(`${label} ${msg}`);
}
