/*
Total Ways to Sum II
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


How many different distinct ways can the number 38 be written as a sum of integers contained in the set:

[1,3,6,7,10,11,12,14,15,16,19,20]?

You may use each integer in the set zero or more times.

*/

import { NS } from "@ns";

export async function totalWaysToSum2(ns: NS, input: [number, number[]]) {
  /* TODO current implementation is really not opti */
  const target = input[0];
  const candidates = input[1];
  const distinctsWays = new Set<string>();

  let attempts = 0;

  async function solver(summers: number[]) {
    for (const candidate of candidates) {
      const newSummers = [...summers, candidate];
      const sum = newSummers.reduce((acc, v) => acc + v, 0);
      if (sum == target) {
        newSummers.sort((a, b) => b - a);
        distinctsWays.add(newSummers.join("-"));
      } else if (sum < target) {
        await solver(newSummers);
      }

      attempts++;
      if (attempts % 1000000 == 0) {
        await ns.sleep(500);
        ns.print("temp result: ", distinctsWays.size);
      }
    }
  }

  await solver([]);

  return distinctsWays.size;
}
