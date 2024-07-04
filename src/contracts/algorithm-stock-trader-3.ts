/**
 * Algorithmic Stock Trader III
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i:

117,130,8,86,82,122,163,90,88,61,143,95,137,173,46,194,174,122,6,166,159,26,90,96,94,99,74,45,180,107,107,109,58,70,62,27,34,86,150,56,180,64,190,67,35,182

Determine the maximum possible profit you can earn using at most two transactions. A transaction is defined as buying and then selling one share of the stock. Note that you cannot engage in multiple transactions at once. In other words, you must sell the stock before you buy it again.

If no profit can be made, then the answer should be 0

 */

import { NS } from "@ns";

export function algorithmStockTrader3(ns: NS, input: number[]): number {
  const prices = input;

  let boughtPrice = null;
  const downsAndUps = [];

  for (let i = 0; i < prices.length; i++) {
    if (i == prices.length - 1 || prices[i] > prices[i + 1]) {
      if (boughtPrice == null) {
        continue;
      } else {
        downsAndUps.push([boughtPrice, prices[i]]);
        boughtPrice = null;
      }
    } else {
      if (boughtPrice == null) {
        boughtPrice = prices[i];
      }
    }
  }

  ns.print("downsAndUps");
  ns.print(downsAndUps);

  let maxProfit = null;
  let maxProfitGroups = null;

  for (let start1 = 0; start1 < downsAndUps.length; start1++) {
    for (let end1 = start1; end1 < downsAndUps.length; end1++) {
      for (let start2 = end1 + 1; start2 < downsAndUps.length; start2++) {
        for (let end2 = start2; end2 < downsAndUps.length; end2++) {
          // ns.print([start1, end1], [start2, end2]);
          const group1 = [downsAndUps[start1][0], downsAndUps[end1][1]];
          const group2 = [downsAndUps[start2][0], downsAndUps[end2][1]];

          const profit = group1[1] - group1[0] + group2[1] - group2[0];
          if (maxProfit == null || profit > maxProfit) {
            maxProfit = profit;
            maxProfitGroups = [group1, group2];
          }
        }
      }
    }
  }
  ns.print("maxProfit");
  ns.print(maxProfit);
  ns.print("maxProfitGroups");
  ns.print(maxProfitGroups);

  return maxProfit && maxProfit > 0 ? maxProfit : 0;
}
