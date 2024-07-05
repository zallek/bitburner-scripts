import { NS } from "@ns";
import { listRunningProcessesOnWorker } from "/lib/process";
import { listWorkers } from "/lib/servers";

export async function main(ns: NS): Promise<void> {
  const scriptName = ns.args[0] as string;

  const workers = listWorkers(ns);

  for (const worker of workers) {
    const scripts = listRunningProcessesOnWorker(ns, worker);
    for (const [runningScriptName, runs] of Object.entries(scripts)) {
      if (scriptName === runningScriptName) {
        for (const [target, _] of Object.entries(runs)) {
          ns.kill(scriptName, worker.hostname, target, 0);
        }
      }
    }
  }
}
