import { NS } from "@ns";
import { arg } from "/lib/arg";

interface Stage {
  execute: (ns: NS) => Promise<void>;
  isAvailable: (ns: NS) => boolean;
  isCompleted: (ns: NS) => boolean;
}

const stages: Stage[] = [
  purchaseTorState(200000),
  purchaseProgramStage("AutoLink.exe", 25, 1000000),
  purchaseProgramStage("BruteSSH.exe", 50, 500000),
  installBackdoorStage("CSEC"),
  purchaseProgramStage("DeepscanV1.exe", 75, 500000),
  purchaseProgramStage("ServerProfiler.exe", 75, 500000),
  purchaseProgramStage("FTPCrack.exe", 100, 1500000),
  installBackdoorStage("avmnite-02h"),
  purchaseProgramStage("relaySMTP.exe", 250, 5000000),
  installBackdoorStage("I.I.I.I"),
  purchaseProgramStage("DeepscanV2.exe", 400, 25000000),
  purchaseProgramStage("HTTPWorm.exe", 500, 30000000),
  purchaseProgramStage("SQLInject.exe", 750, 250000000),
  installBackdoorStage("run4theh111z"),
];

export async function main(ns: NS): Promise<void> {
  const factionName = arg<string>(ns.args[0]);
  let nextStage = 0;

  while (true) {
    for (let i = nextStage; i < stages.length; i++) {
      if (stages[i].isCompleted(ns)) {
        nextStage = i + 1;
        continue;
      }
      if (stages[i].isAvailable(ns)) {
        await stages[i].execute(ns);
        nextStage = i + 1;
        continue;
      }
      break;
    }

    if (factionName) {
      ns.singularity.workForFaction(factionName, "hacking", false);
    }

    await ns.sleep(1000);
  }
}

function purchaseProgramStage(name: string, requiredSkill: number, requiredMoney: number): Stage {
  return {
    execute: async (ns) => {
      ns.singularity.purchaseProgram(name);
    },
    isAvailable: (ns) => ns.getServerMoneyAvailable("home") >= requiredMoney, // ns.getHackingLevel() >= requiredSkill &&
    isCompleted: (ns) => ns.fileExists(name),
  };
}

function purchaseTorState(requiredMoney: number): Stage {
  return {
    execute: async (ns) => {
      ns.singularity.purchaseTor();
    },
    isAvailable: (ns) => ns.getServerMoneyAvailable("home") >= requiredMoney,
    isCompleted: (ns) => false,
  };
}

function installBackdoorStage(target: string): Stage {
  return {
    execute: async (ns) => {
      ns.singularity.connect(target);
      await ns.singularity.installBackdoor();
    },
    isAvailable: (ns) => true,
    isCompleted: (ns) => false,
  };
}
