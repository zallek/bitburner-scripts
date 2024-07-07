import { AutocompleteData, CodingContractData, NS, ScriptArg } from "@ns";
import { algorithmStockTrader } from "/contracts/algorithm-stock-trader";
import { algorithmStockTrader2 } from "/contracts/algorithm-stock-trader-2";
import { algorithmStockTrader3 } from "/contracts/algorithm-stock-trader-3";
import { mergeOverlappingIntervals } from "/contracts/merge-overlapping-intervals";
import { proper2coloringOfAGraph } from "/contracts/proper-2-coloring-of-a-graph";
import { subarrayWithMaximumSum } from "/contracts/subarray-with-maximum-sum";
import { totalWaysToSum } from "/contracts/total-ways-to-sum";
import { totalWaysToSum2 } from "/contracts/total-ways-to-sum-2";
import { listServers } from "/lib/servers";

type CodingContractAnswer = any;
type CodingContractFunc = (ns: NS, input: CodingContractData) => CodingContractAnswer | Promise<CodingContractAnswer>;

export const contractMapping: Record<string, CodingContractFunc> = {
  "Algorithmic Stock Trader I": algorithmStockTrader,
  "Algorithmic Stock Trader II": algorithmStockTrader2,
  "Algorithmic Stock Trader III": algorithmStockTrader3,
  "Proper 2-Coloring of a Graph": proper2coloringOfAGraph,
  "Subarray with Maximum Sum": subarrayWithMaximumSum,
  "Total Ways to Sum": totalWaysToSum,
  "Merge Overlapping Intervals": mergeOverlappingIntervals,
};

export const contractMappingNotSolved: Record<string, CodingContractFunc> = {
  "Total Ways to Sum II": totalWaysToSum2,
};

export async function main(ns: NS): Promise<void> {
  ns.tail();

  if (ns.args[0] === "-a") {
    await attemptAllSolvedContracts(ns);
  } else {
    const hostname = ns.args[0] as string;
    const confirmToSend = ns.args[1] === "-c";
    const answer = ns.args[2];
    await attemptAContractOn(ns, hostname, confirmToSend, answer);
  }
}

export function autocomplete(data: AutocompleteData, args: ScriptArg[]) {
  return [...data.servers];
}

async function attemptAllSolvedContracts(ns: NS) {
  const servers = listServers(ns);

  for (const server of servers) {
    const contractFiles = ns.ls(server.hostname, ".cct");
    for (const contractFile of contractFiles) {
      await attemptContract(ns, server.hostname, contractFile, false);
    }
  }
}

async function attemptAContractOn(ns: NS, hostname: string, confirmToSend: boolean, answer: any = null) {
  const contractFiles = ns.ls(hostname, ".cct");
  if (contractFiles.length == 0) {
    ns.print(`No contract file`);
    return;
  }
  let contractFile = null;
  if (contractFiles.length > 1) {
    contractFile = (await ns.prompt("Select contract", {
      type: "select",
      choices: contractFiles,
    })) as string;
  } else {
    contractFile = contractFiles[0];
  }

  if (answer) {
    ns.codingcontract.attempt(answer, contractFile, hostname);
  } else {
    await attemptContract(ns, hostname, contractFile, confirmToSend);
  }
}

async function attemptContract(ns: NS, hostname: string, contractFile: string, confirmToSend: boolean) {
  const type = ns.codingcontract.getContractType(contractFile, hostname);
  const func = contractMapping[type] || contractMappingNotSolved[type];
  const isNotSolved = !!contractMappingNotSolved[type];

  if (!func) {
    ns.print(`No solution known for ${type}`);
    return;
  }

  const input = ns.codingcontract.getData(contractFile, hostname);
  ns.print("-- input --");
  ns.print(input);

  ns.print("\n-- algo --");
  const result = await func(ns, input);

  ns.print("\n-- answer --");
  ns.print(result);

  if (isNotSolved) {
    return;
  }
  if (confirmToSend && !(await ns.prompt("Send answer?", { type: "boolean" }))) {
    return;
  }

  return ns.codingcontract.attempt(result, contractFile, hostname);
}
