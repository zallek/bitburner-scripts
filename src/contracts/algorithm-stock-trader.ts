import { NS } from "@ns";

/**
 * Algorithmic Stock Trader I
You are attempting to solve a Coding Contract. You have 5 tries remaining, after which the contract will self-destruct.


You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i:

80,59,17,144,62,120,111,121,40,76,168,25,133,199,54,195,187,52,112,71,107,41

Determine the maximum possible profit you can earn using at most one transaction (i.e. you can only buy and sell the stock once). If no profit can be made then the answer should be 0. Note that you have to buy the stock before you can sell it.

 */

export function algorithmStockTrader(ns: NS, input: number[]): number {
  const prices = input;

  let maxProfit = 0;
  for (let i = 0; i < prices.length; i++) {
    for (let j = 1; j < prices.length; j++) {
      const profit = prices[j] - prices[i];
      if (profit > maxProfit) {
        maxProfit = profit;
      }
    }
  }

  return maxProfit;
}
