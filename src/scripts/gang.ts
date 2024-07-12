import { GangGenInfo, GangMemberInfo, GangTaskStats, NS } from "@ns";
import { markdownTable } from "/lib/markdown-table";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  while (true) {
    ns.clearLog();

    if (!ns.gang.inGang()) continue;

    const homeMoney = ns.getServerMoneyAvailable("home");

    const gangInfo = ns.gang.getGangInformation();

    const equipments = ns.gang
      .getEquipmentNames()
      .map((name) => ({
        name: name,
        cost: ns.gang.getEquipmentCost(name),
        ...ns.gang.getEquipmentStats(name),
      }))
      .filter((e) => e.hack || e.cha);
    equipments.sort((a, b) => a.cost - b.cost);
    const equipmentsByName = equipments.reduce((v, e) => ({ ...v, [e.name]: e }), {});

    const members = ns.gang.getMemberNames().map((name) => {
      const memberInfo = ns.gang.getMemberInformation(name);
      const equipments = [...memberInfo.upgrades, ...memberInfo.augmentations];
      return {
        ...memberInfo,
        equipments: equipments,
        // @ts-ignore
        hackEquipements: equipments.filter((e) => equipmentsByName[e].hack),
        // @ts-ignore
        chaEquipements: equipments.filter((e) => equipmentsByName[e].cha),
      };
    });
    const membersAllFullyEquiped = false; // members.every((m) => m.equipments.length === equipments.length);
    members.sort((a, b) => a.equipments.length - b.equipments.length);

    const tasks = ns.gang
      .getTaskNames()
      .map(ns.gang.getTaskStats)
      .filter((t) => t.isHacking && (t.baseMoney > 0 || (membersAllFullyEquiped && t.baseRespect > 0)));
    tasks.sort((a, b) => b.hackWeight / b.difficulty - a.hackWeight / a.difficulty);

    ns.print("wantedPenalty ", gangInfo.wantedPenalty);
    ns.print("\n");

    ns.print(
      markdownTable([
        ["", ...members.map((m) => m.name)],
        ["hack", ...members.map((m) => m.hackEquipements.length)],
        ["cha", ...members.map((m) => m.chaEquipements.length)],
      ])
    );
    ns.print("\n");

    for (const member of members) {
      const ascensionResult = ns.gang.getAscensionResult(member.name);
      if (ascensionResult && ascensionResult.hack > 2) {
        ns.gang.ascendMember(member.name);
      }

      const task = chooseTask(ns, gangInfo, member, tasks);
      if (member.task !== task.name) {
        ns.gang.setMemberTask(member.name, task.name);
      }

      for (const equipment of equipments) {
        if (
          homeMoney > equipment.cost &&
          (equipment.hack || (task.chaWeight > 0 && equipment.cha)) &&
          !member.equipments.includes(equipment.name)
        ) {
          ns.gang.purchaseEquipment(member.name, equipment.name);
        }
      }
    }

    if (ns.gang.canRecruitMember()) {
      ns.gang.recruitMember(`member-${members.length + 1}`);
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
    return task.difficulty == 1 || memberInfo.hack >= task.difficulty * 100;
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
