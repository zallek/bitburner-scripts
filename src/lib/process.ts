import { NS } from "@ns";
import { Worker } from "/lib/servers";

export const NO_TARGET = "#NO_TARGET";

type ScriptName = string;
type Target = string;
type RunningProcessByTarget = Record<ScriptName, Record<Target, number>>;

export function listRunningProcesses(ns: NS, workers: Worker[]): RunningProcessByTarget {
  const runningScripts: RunningProcessByTarget = {};

  for (const worker of workers) {
    const scripts = listRunningProcessesOnWorker(ns, worker);
    for (const [scriptName, runs] of Object.entries(scripts)) {
      for (const [target, nbThreads] of Object.entries(runs)) {
        if (!runningScripts[scriptName]) {
          runningScripts[scriptName] = {};
        }
        runningScripts[scriptName][target] = (runningScripts[scriptName][target] || 0) + nbThreads;
      }
    }
  }

  return runningScripts;
}

export function listRunningProcessesOnWorker(ns: NS, worker: Worker): RunningProcessByTarget {
  const runningScripts: RunningProcessByTarget = {};

  const processes = ns.ps(worker.hostname);
  for (const process of processes) {
    const scriptName = process.filename;
    const target = typeof process.args[0] === "string" ? process.args[0] : NO_TARGET;
    const nbThreads = process.threads;

    if (!runningScripts[scriptName]) {
      runningScripts[scriptName] = {};
    }
    runningScripts[scriptName][target] = (runningScripts[scriptName][target] || 0) + nbThreads;
  }

  return runningScripts;
}
