import { NS, Server as NSServer } from "@ns";
import { openAllServerPorts } from "/lib/ports";

const MAX_DEPTH = 20;

export interface Server extends NSServer {
  path: string[];
}

export function listServers(ns: NS): Server[] {
  const root = ns.getHostname();
  const servers: Server[] = [
    {
      ...ns.getServer(root),
      path: [],
    },
  ];
  const serversIdxToScan = [0];

  while (serversIdxToScan.length > 0) {
    const serverIdxToScan = serversIdxToScan.shift() as number;
    const serverToScan = servers[serverIdxToScan];

    for (const hostname of ns.scan(serverToScan.hostname)) {
      if (!servers.map((s) => s.hostname).includes(hostname)) {
        const server = {
          ...ns.getServer(hostname),
          path: [...serverToScan.path, serverToScan.hostname],
        };

        if (!server.hasAdminRights) {
          const allPortsOpen = openAllServerPorts(ns, server);
          if (allPortsOpen) {
            ns.nuke(server.hostname);
          }
          continue;
        }

        servers.push(server);
        if (serverToScan.path.length + 1 < MAX_DEPTH) {
          serversIdxToScan.push(servers.length - 1);
        }
      }
    }
  }

  return servers;
}

export interface Worker extends Server {
  ramReserved: number;
  ramFree: number;
}

export function listWorkers(ns: NS, homeReservedRam: number): Worker[] {
  const workers: Worker[] = [];
  const servers = listServers(ns);

  for (const server of servers) {
    if (!server.hasAdminRights) {
      continue;
    }

    if (server.maxRam == 0) {
      continue;
    }

    const ramReserved = server.hostname == "home" ? homeReservedRam : 0;
    const ramFree = server.maxRam - Math.max(server.ramUsed, ramReserved);

    workers.push({
      ...server,
      ramReserved: ramReserved,
      ramFree: ramFree,
    });
  }

  return workers;
}

export interface Target extends Server {
  minDifficulty: number;
  hackDifficulty: number;
  remainingDifficulty: number;
  weakenTime: number;
  weakenNeeded: boolean;
  moneyMax: number;
  moneyAvailable: number;
  growTime: number;
  growNeeded: boolean;
  hackTime: number;
  hackAmount: number;
  hackChance: number;
  hackAmountBySeconds: number;
  hackReady: boolean;
}

export function listTargets(ns: NS): Target[] {
  const targets: Target[] = [];
  const servers = listServers(ns);
  const homeMoney = ns.getServerMoneyAvailable("home");
  const hackingSkill = ns.getHackingLevel();

  for (const server of servers) {
    if (server.hostname == "home") {
      continue;
    }

    if (!server.hasAdminRights) {
      continue;
    }

    if (server.requiredHackingSkill && server.requiredHackingSkill > hackingSkill) {
      continue;
    }

    if (
      server.minDifficulty === undefined ||
      server.hackDifficulty === undefined ||
      server.moneyMax === undefined ||
      !server.moneyAvailable
    ) {
      continue;
    }

    const remainingDifficulty = server.hackDifficulty - server.minDifficulty;
    const weakenTime = ns.getWeakenTime(server.hostname);
    const weakenNeeded = remainingDifficulty > 0.1;

    const growTime = ns.getGrowTime(server.hostname);
    const growNeeded = server.moneyAvailable < server.moneyMax * 0.99;

    const hackTime = ns.getHackTime(server.hostname);
    const hackPct = ns.hackAnalyze(server.hostname);
    const hackChance = ns.hackAnalyzeChance(server.hostname);
    const hackAmount = hackPct * server.moneyAvailable;
    const hackAmountBySeconds = (hackAmount * hackChance) / (hackTime / 1000);
    const hackReady =
      (remainingDifficulty < 2 && server.moneyAvailable > server.moneyMax * 0.8) ||
      hackAmountBySeconds / homeMoney > 0.001;

    targets.push({
      ...server,
      minDifficulty: server.minDifficulty,
      hackDifficulty: server.hackDifficulty,
      remainingDifficulty: remainingDifficulty,
      weakenTime: weakenTime,
      weakenNeeded: weakenNeeded,
      moneyMax: server.moneyMax,
      moneyAvailable: server.moneyAvailable,
      growTime: growTime,
      growNeeded: growNeeded,
      hackTime: hackTime,
      hackAmount: hackAmount,
      hackChance: hackChance,
      hackAmountBySeconds: hackAmountBySeconds,
      hackReady: hackReady,
    });
  }

  targets.sort((a, b) => (b.hackAmountBySeconds ?? 0) - (a.hackAmountBySeconds ?? 0));
  return targets;
}
