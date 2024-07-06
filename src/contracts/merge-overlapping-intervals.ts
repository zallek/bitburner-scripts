/*Merge Overlapping Intervals
You are attempting to solve a Coding Contract. You have 15 tries remaining, after which the contract will self-destruct.


Given the following array of arrays of numbers representing a list of intervals, merge all overlapping intervals.

[[16,24],[13,17],[2,5]]

Example:

[[1, 3], [8, 10], [2, 6], [10, 16]]

would merge into [[1, 6], [8, 16]].

The intervals must be returned in ASCENDING order. You can assume that in an interval, the first number will always be smaller than the second.
*/

import { NS } from "@ns";

export function mergeOverlappingIntervals(ns: NS, input: number[][]): number[][] {
  let intervals = input;
  const nbItervals = intervals.length;

  let merged;
  let nbIterations = 0;
  do {
    nbIterations++;
    merged = false;
    for (let i = 0; i < intervals.length; i++) {
      for (let j = 1; j < intervals.length; j++) {
        if (i === j) continue;
        if (areIntervalOverlapping(intervals[i], intervals[j])) {
          ns.print(`interval ${i} ${j} overlappings `, intervals[i], " ", intervals[j]);
          intervals = [
            ...intervals.reduce<number[][]>((acc, v, index) => ([i, j].includes(index) ? acc : [...acc, v]), []),
            mergeInterval(intervals[i], intervals[j]),
          ];
          merged = true;
          break;
        }
      }
      if (merged) {
        ns.print(intervals);
        break;
      }
    }
    if (nbIterations > nbItervals) {
      throw Error("Algo is buggy: Too many merges");
    }
  } while (merged === true);

  intervals.sort((a, b) => a[0] - b[0]);
  return intervals;
}

function areIntervalOverlapping(interval1: number[], interval2: number[]): boolean {
  return (
    (interval1[0] <= interval2[0] && interval1[1] >= interval2[0] && interval1[1] <= interval2[1]) || // [1, 3] [2, 4]
    (interval2[0] <= interval1[0] && interval2[1] >= interval1[0] && interval2[1] <= interval1[1]) || // [2, 4] [1, 3]
    (interval1[0] <= interval2[0] && interval2[1] >= interval2[0] && interval1[1] >= interval2[1]) || // [1, 4] [2, 3]
    (interval2[0] <= interval1[0] && interval1[1] >= interval2[0] && interval2[1] >= interval1[1]) || // [2, 3] [1, 4]
    (interval1[0] === interval2[0] && interval1[1] === interval2[1])
  );
}

function mergeInterval(interval1: number[], interval2: number[]): number[] {
  return [Math.min(interval1[0], interval2[0]), Math.max(interval1[1], interval2[1])];
}
