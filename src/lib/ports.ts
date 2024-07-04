import { NS } from "@ns";
import { Server } from "/lib/servers";

function portHacks(ns: NS) {
  return [
    { program: "BruteSSH.exe", func: ns.brutessh },
    { program: "FTPCrack.exe", func: ns.ftpcrack },
    { program: "relaySMTP.exe", func: ns.relaysmtp },
    { program: "HTTPWorm.exe", func: ns.httpworm },
    { program: "SQLInject.exe", func: ns.sqlinject },
  ];
}

function getNbPortsSupported(ns: NS) {
  let nbPortsSupported = 0;
  for (const portHack of portHacks(ns)) {
    if (ns.fileExists(portHack.program)) {
      nbPortsSupported++;
    }
  }
  return nbPortsSupported;
}

export function openAllServerPorts(ns: NS, server: Server): boolean {
  if (!server.numOpenPortsRequired) return true;

  const nbPortsSupported = getNbPortsSupported(ns);
  if (server.numOpenPortsRequired > nbPortsSupported) {
    return false;
  }

  for (let i = 0; i < server.numOpenPortsRequired; i++) {
    portHacks(ns)[i].func(server.hostname);
  }
  return true;
}
