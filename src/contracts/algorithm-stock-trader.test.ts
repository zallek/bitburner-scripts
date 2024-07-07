import { nsMock } from "../../tests/mocks";
import { algorithmStockTrader } from "./algorithm-stock-trader";

describe("algorithmStockTrader", () => {
  test("case 1", () => {
    expect(
      algorithmStockTrader(
        nsMock,
        [80, 59, 17, 144, 62, 120, 111, 121, 40, 76, 168, 25, 133, 199, 54, 195, 187, 52, 112, 71, 107, 41]
      )
    ).toBe(182);
  });
});
