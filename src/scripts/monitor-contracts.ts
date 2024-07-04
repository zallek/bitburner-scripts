import { NS } from "@ns";
import { markdownTable } from "/lib/markdown-table";
import { listServers } from "/lib/servers";
import { contractMapping } from "/scripts/contract";

export async function main(ns: NS): Promise<void> {
  while (true) {
    ns.disableLog("ALL");
    ns.clearLog();

    const servers = listServers(ns);

    const contracts = [];
    for (const server of servers) {
      for (const contractFile of ns.ls(server.hostname, ".cct")) {
        const type = ns.codingcontract.getContractType(contractFile, server.hostname);
        contracts.push({
          server: server,
          file: contractFile,
          type: type,
          solved: !!contractMapping[type],
        });
      }
    }

    contracts.sort(
      (a, b) => Number(b.solved) - Number(a.solved) || a.type.localeCompare(b.type) || a.file.localeCompare(b.file)
    );

    const table = [
      [`contract ${contracts.length}`, "type", "host", "solved"],
      ...contracts.map((contract) => {
        return [contract.file, contract.type, contract.server.hostname, contract.solved ? "Yes" : ""];
      }),
    ];
    ns.print(markdownTable(table, { align: ["l", "l"] }));

    await ns.sleep(5000);
  }
}
