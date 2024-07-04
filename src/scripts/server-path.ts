import { AutocompleteData, NS, ScriptArg } from "@ns";
import { listServers } from "/lib/servers";

export async function main(ns: NS): Promise<void> {
  const hostname = ns.args[0];

  const servers = listServers(ns);

  const server = servers.find((s) => s.hostname === hostname);

  if (server) {
    const fullPath = [...server.path, hostname].map((hostname) =>
      servers.find((s) => s.hostname == hostname)?.backdoorInstalled ? `[${hostname}]` : hostname
    );
    ns.tprint(fullPath.join(" "));
  } else {
    ns.tprint("not found");
  }
}

export function autocomplete(data: AutocompleteData, args: ScriptArg[]) {
  return [...data.servers];
}
