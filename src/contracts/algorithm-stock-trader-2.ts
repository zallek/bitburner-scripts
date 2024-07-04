/**
 * Algorithmic Stock Trader II
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i:

178,137,138,26,159,194,82,173,112,15,191,183,35,104

Determine the maximum possible profit you can earn using as many transactions as you'd like. A transaction is defined as buying and then selling one share of the stock. Note that you cannot engage in multiple transactions at once. In other words, you must sell the stock before you buy it again.

If no profit can be made, then the answer should be 0

*/

import { NS } from "@ns";

export function algorithmStockTrader2(ns: NS, input: number[]): number {
  const prices = input;

  let profit = 0;
  let boughtPrice = null;
  for (let i = 0; i < prices.length; i++) {
    if (i == prices.length - 1 || prices[i] > prices[i + 1]) {
      if (boughtPrice == null) {
        continue;
      } else {
        ns.print("sell ", prices[i]);
        profit += prices[i] - boughtPrice;
        boughtPrice = null;
      }
    } else {
      if (boughtPrice == null) {
        ns.print("buy ", prices[i]);
        boughtPrice = prices[i];
      }
    }
  }
  return profit;
}
