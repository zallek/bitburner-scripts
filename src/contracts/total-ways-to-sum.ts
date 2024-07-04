/**
 * Total Ways to Sum
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


It is possible write four as a sum in exactly four different ways:

    7 -> 14    

    6 + 1             1->1  
    5 + 2             2->2
    5 + 1 + 1      
    4 + 3             3->3
    4 + 2 + 1
    4 + 1 + 1 
    3 + 3 + 1         4->4    
    3 + 2 + 2
    3 + 2 + 1 + 1
    3 + 1 + 1 + 1 + 1
    2 + 2 + 2 + 1         5->3
    2 + 2 + 1 + 1 + 1
    2 + 1 + 1 + 1 + 1 + 1
    1 + 1 + 1 + 1 + 1 + 1 + 1    1->1

    6 -> 10   

    5 + 1
    4 + 2      +1*1
    4 + 1 + 1
    3 + 3      +1*2
    3 + 2 + 1 
    3 + 1 + 1 + 1
    2 + 2 + 2  +2*1
    2 + 2 + 1 + 1
    2 + 1 + 1 + 1 + 1
    1 + 1 + 1 + 1 + 1 + 1

    5 -> 6 

    4 + 1
    3 + 2
    3 + 1 + 1
    2 + 2 + 1
    2 + 1 + 1 + 1
    1 + 1 + 1 + 1 + 1
 
    4 -> 4 

    3 + 1
    2 + 2
    2 + 1 + 1
    1 + 1 + 1 + 1

    3 -> 2   2 

    2 + 1
    1 + 1 + 1

    2 -> 1    1

    1 + 1


How many different distinct ways can the number 28 be written as a sum of at least two positive integers?


  28 -> 3717
  91 -> 64112358

*/

import { NS } from "@ns";

export function totalWaysToSum(ns: NS, input: number) {
  return totalWaysToSumInner(ns, input, null);
}

function totalWaysToSumInner(ns: NS, target: number, maxStart: number | null = null, depth = 0) {
  let nbWays = 0;

  if (maxStart == null) {
    maxStart = target - 1;
  }
  maxStart = Math.min(target, maxStart);

  if (target <= 1) {
    nbWays = 0;
  } else if (maxStart == 1) {
    nbWays = 1;
  } else {
    for (let start = 1; start < maxStart + 1; start++) {
      const rest = target - start;
      if (rest <= 1) {
        nbWays++;
      } else {
        nbWays += totalWaysToSumInner(ns, rest, start, depth + 1);
      }
    }
  }

  return nbWays;
}
