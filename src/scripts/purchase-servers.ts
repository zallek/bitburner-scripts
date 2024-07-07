import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");
  let allUpgraded = false;

  while (!allUpgraded) {
    allUpgraded = purchaseOrUpgradeServers(ns);

    await ns.sleep(1000);
  }

  ns.print("Servers are all upgraded");
}

function purchaseOrUpgradeServers(ns: NS): boolean {
  const servers = ns.getPurchasedServers();
  const homeMoney = ns.getServerMoneyAvailable("home");

  if (servers.length < ns.getPurchasedServerLimit()) {
    // Check if we have enough money to purchase a server
    if (homeMoney > ns.getPurchasedServerCost(2)) {
      const server = "pserv-" + String(servers.length).padStart(3, "0");
      if (ns.purchaseServer(server, 2)) {
        ns.print(`Purchased server ${server} 2GB`);
        return false;
      }
    }
    return false;
  }

  const serversWithRam: [string, number][] = servers.map((s) => [s, ns.getServerMaxRam(s)]);
  serversWithRam.sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));

  for (const [server, maxRam] of serversWithRam) {
    if (homeMoney > ns.getPurchasedServerUpgradeCost(server, maxRam * 2)) {
      if (ns.upgradePurchasedServer(server, maxRam * 2)) {
        ns.print(`Upgraded server ${server} ${ns.formatRam(maxRam * 2)}`);
      }
    }
  }

  const serverMaxRam = ns.getPurchasedServerMaxRam();
  return serversWithRam.reduce((acc, s) => acc && s[1] === serverMaxRam, true);
}
