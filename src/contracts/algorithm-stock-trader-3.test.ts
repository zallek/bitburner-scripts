import { nsMock } from "../../tests/mocks";
import { algorithmStockTrader3 } from "./algorithm-stock-trader-3";

describe("algorithmStockTrader3", () => {
  test("case 1", () => {
    expect(algorithmStockTrader3(nsMock, [135, 113, 99, 112])).toBe(13);
  });
});
