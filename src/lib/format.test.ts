import { formatProgressBar } from "./format";

describe("formatProgressBar", () => {
  test("0%", () => {
    expect(formatProgressBar(0, 10)).toBe("          ");
  });

  test("100%", () => {
    expect(formatProgressBar(1, 10)).toBe("||||||||||");
  });

  test("50%", () => {
    expect(formatProgressBar(0.5, 10)).toBe("|||||     ");
  });
});
