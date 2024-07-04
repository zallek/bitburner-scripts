/**
 * Subarray with Maximum Sum
You are attempting to solve a Coding Contract. You have 9 tries remaining, after which the contract will self-destruct.

Given the following integer array, find the contiguous subarray (containing at least one number) which has the largest sum and return that sum. 'Sum' refers to the sum of all the numbers in the subarray.
-6,4,0,6,1,0,7,2,-4,0,-5,-1,-1,-2,4,-8,-1,-8,6,7,7,-1,6,-5,-9,2,6,-4,8,-1,1,-3,10

*/

import { NS } from "@ns";

/** @param {NS} ns */
export function subarrayWithMaximumSum(ns: NS, input: number[]) {
  const array = input;

  let maxSum = -Infinity;
  let maxSumArray = null;
  for (let start = 0; start < array.length; start++) {
    for (let end = start; end < array.length; end++) {
      const subArray = array.slice(start, end + 1);
      const sum = subArray.reduce((acc, v) => acc + v, 0);
      if (sum > maxSum) {
        maxSum = sum;
        maxSumArray = subArray;
      }
    }
  }

  ns.print("maxSumArray");
  ns.print(maxSumArray);

  return maxSum;
}
