import { nsMock } from "../../tests/mocks";
import { mergeOverlappingIntervals } from "./merge-overlapping-intervals";

describe("mergeOverlappingIntervals", () => {
  test("case 1", () => {
    expect(
      mergeOverlappingIntervals(nsMock, [
        [15, 24],
        [16, 25],
        [3, 5],
        [5, 15],
        [11, 21],
        [13, 22],
        [19, 24],
        [25, 28],
        [4, 5],
        [11, 14],
      ])
    ).toStrictEqual([[3, 28]]);
  });
});
