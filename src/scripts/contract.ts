import { AutocompleteData, CodingContractData, NS, ScriptArg } from "@ns";
import { algorithmStockTrader2 } from "/contracts/algorithm-stock-trader-2";
import { algorithmStockTrader3 } from "/contracts/algorithm-stock-trader-3";
import { proper2coloringOfAGraph } from "/contracts/proper-2-coloring-of-a-graph";
import { subarrayWithMaximumSum } from "/contracts/subarray-with-maximum-sum";
import { totalWaysToSum } from "/contracts/total-ways-to-sum";
import { totalWaysToSum2 } from "/contracts/total-ways-to-sum-2";
import { mergeOverlappingIntervals } from "/contracts/merge-overlapping-intervals";

type CodingContractAnswer = any;
type CodingContractFunc = (ns: NS, input: CodingContractData) => CodingContractAnswer | Promise<CodingContractAnswer>;

export const contractMapping: Record<string, CodingContractFunc> = {
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

  const hostname = ns.args[0] as string;
  const confirmToSend = ns.args[1] === "-c";

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

  ns.codingcontract.attempt(result, contractFile, hostname);
}

export function autocomplete(data: AutocompleteData, args: ScriptArg[]) {
  return [...data.servers];
}
