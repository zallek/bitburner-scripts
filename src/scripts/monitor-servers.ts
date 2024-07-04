import { NS } from "@ns";
import { markdownTable } from "/lib/markdown-table";
import { listServers } from "/lib/servers";

export async function main(ns: NS): Promise<void> {
  while (true) {
    ns.disableLog("ALL");
    ns.clearLog();

    const servers = listServers(ns);
    // servers.sort((a, b) => a.host.join("-").localeCompare(b.path.join("-")));
    servers.sort((a, b) => a.hostname.localeCompare(b.hostname));
    const hackingLevel = ns.getHackingLevel();

    const table = [
      [
        `servers ${servers.length}`,
        `hackingLevel ${Math.max(...servers.map((s) => s.requiredHackingSkill || 0))}`,
        "depth",
        "hasAdminRights",
      ],
      ...servers.map((server) => {
        return [
          server.hostname,
          (server.requiredHackingSkill && hackingLevel >= server.requiredHackingSkill ? "■ " : "  ") +
            server.requiredHackingSkill,
          server.path.length,
          server.hasAdminRights ? "" : "No",
        ];
      }),
    ];
    ns.print(markdownTable(table, { align: ["l", "l"] }));

    await ns.sleep(1000);
  }
}
