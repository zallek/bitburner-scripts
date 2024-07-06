import { GangGenInfo, GangMemberInfo, GangTaskStats, NS } from "@ns";
import { markdownTable } from "/lib/markdown-table";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  while (true) {
    ns.clearLog();

    if (!ns.gang.inGang()) continue;

    const homeMoney = ns.getServerMoneyAvailable("home");
    const gangInfo = ns.gang.getGangInformation();
    const membersNames = ns.gang.getMemberNames();
    const tasks = ns.gang.getTaskNames().map(ns.gang.getTaskStats);
    tasks.sort((a, b) => b.hackWeight / b.difficulty - a.hackWeight / a.difficulty);
    const equipments = ns.gang.getEquipmentNames().map((name) => ({
      name: name,
      cost: ns.gang.getEquipmentCost(name),
      ...ns.gang.getEquipmentStats(name),
    }));
    equipments.sort((a, b) => a.cost - b.cost);

    ns.print("wantedPenalty ", gangInfo.wantedPenalty, "\n\n");

    for (const memberName of membersNames) {
      const memberInfo = ns.gang.getMemberInformation(memberName);

      const ascensionResult = ns.gang.getAscensionResult(memberName);
      if (ascensionResult && ascensionResult.hack > 2) {
        ns.gang.ascendMember(memberName);
      }

      const task = chooseTask(ns, gangInfo, memberInfo, tasks);
      if (memberInfo.task !== task.name) {
        ns.gang.setMemberTask(memberName, task.name);
      }

      for (const equipment of equipments) {
        if (
          homeMoney > equipment.cost &&
          (equipment.hack || (task.chaWeight > 0 && equipment.cha)) &&
          ![...memberInfo.upgrades, memberInfo.augmentations].includes(equipment.name)
        ) {
          ns.gang.purchaseEquipment(memberName, equipment.name);
        }
      }
    }

    if (ns.gang.canRecruitMember()) {
      ns.gang.recruitMember(`member-${membersNames.length}`);
    }

    ns.print(
      markdownTable([
        ["job name", "baseMoney", "baseRespect", "baseWanted", "hackWeight", "chaWeight", "difficulty"],
        ...tasks
          .filter((task) => task.isHacking)
          .map((task) => [
            task.name,
            task.baseMoney,
            task.baseRespect,
            task.baseWanted,
            task.hackWeight,
            task.chaWeight,
            task.difficulty,
          ]),
      ])
    );

    await ns.gang.nextUpdate();
  }
}

function chooseTask(ns: NS, gangInfo: GangGenInfo, memberInfo: GangMemberInfo, tasks: GangTaskStats[]): GangTaskStats {
  const availableTasks = tasks.filter((task) => {
    return task.isHacking && task.baseMoney > 0 && (task.difficulty == 1 || memberInfo.hack >= task.difficulty * 100);
  });
  const tasksLoweringWanted = availableTasks.filter((task) => task.baseWanted < 0);
  const tasksIncreasingRespect = availableTasks.filter((task) => task.baseRespect > 0);

  let task: GangTaskStats | undefined;
  if (gangInfo.wantedPenalty < 0.95) {
    // Need to reduce penality, hopefully we shoudl never need it
    task = tasksLoweringWanted[0];
  } else if (gangInfo.wantedPenalty > 0.99) {
    // Full burst
    task = tasksIncreasingRespect[tasksIncreasingRespect.length - 1];
  } else if (gangInfo.wantedPenalty > 0.98 && tasksIncreasingRespect.length > 1) {
    // Medium burst
    task = tasksIncreasingRespect[tasksIncreasingRespect.length - 2];
  } else {
    // Low burst
    task = tasksIncreasingRespect[0];
  }
  return task;
}
