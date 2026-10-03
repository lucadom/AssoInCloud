import { describe, expect, it } from "vitest";
import { allocateBanknotes, banknoteFields, roundCashShare, suggestBanknoteExchange } from "./closing-cash";

function inventory(...counts: number[]) {
  return counts.map(BigInt);
}

describe("roundCashShare", () => {
  it.each([
    [10249, 10000], [10250, 10500], [10251, 10500],
    [10000, 10000], [249, 0], [250, 500], [0, 0],
    [-10249, -10000], [-10250, -10500],
  ])("rounds %i cents to %i cents", (input, expected) => {
    expect(roundCashShare(BigInt(input))).toBe(BigInt(expected));
  });

  describe("suggestBanknoteExchange", () => {
    it("splits an available note without losing value and composes the payout", () => {
      const available = inventory(1, 0, 0, 0, 0, 0, 0);
      const exchange = suggestBanknoteExchange(BigInt(13000), available);
      expect(exchange).not.toBeNull();
      expect(exchange?.sourceIndex).toBe(0);
      expect(exchange?.received).toEqual(inventory(0, 1, 2, 1, 2, 1, 0));
      expect(exchange?.allocation).toEqual(inventory(0, 0, 1, 0, 1, 1, 0));
      expect(available).toEqual(inventory(1, 0, 0, 0, 0, 0, 0));
    });

    it.each([5, 10, 20, 50, 100, 200, 500])("preserves the total and finds an exact payout with an available €%i note", (value) => {
      const sourceIndex = banknoteFields.findIndex((field) => field.value === value);
      for (let target = 5; target < value; target += 5) {
        const available = inventory(0, 0, 0, 0, 0, 0, 0);
        available[sourceIndex] = BigInt(1);
        const exchange = suggestBanknoteExchange(BigInt(target * 100), available);
        expect(exchange).not.toBeNull();
        if (exchange === null) throw new Error("Missing exchange");
        const total = (counts: readonly bigint[]) => counts.reduce(
          (sum, count, index) => sum + count * BigInt(banknoteFields[index].value),
          BigInt(0)
        );
        expect(total(exchange.received)).toBe(BigInt(value));
        expect(total(exchange.allocation)).toBe(BigInt(target));
        expect(exchange.received.slice(0, sourceIndex + 1).every((count) => count === BigInt(0))).toBe(true);
      }
    });

    it("reuses existing notes as well as the change", () => {
      const exchange = suggestBanknoteExchange(BigInt(60500), inventory(2, 0, 1, 0, 0, 0, 0));
      expect(exchange?.allocation).toEqual(inventory(1, 0, 1, 0, 0, 0, 1));
    });

    it("keeps post-exchange counts within the updated inventory", () => {
      const available = inventory(0, 2, 0, 1, 0, 1, 0);
      const target = BigInt(30500);
      const exchange = suggestBanknoteExchange(target, available);
      expect(exchange).not.toBeNull();
      if (exchange === null) throw new Error("Missing exchange");
      expect(allocateBanknotes(target, available)).toBeNull();
      const updated = available.map((count, index) =>
        count - (index === exchange.sourceIndex ? BigInt(1) : BigInt(0)) + exchange.received[index]
      );
      expect(exchange.allocation.every((count, index) => count >= BigInt(0) && count <= updated[index])).toBe(true);
      expect(allocateBanknotes(target, updated)).toEqual(exchange.allocation);
    });

    it("does not suggest an unnecessary exchange or one that cannot fix insufficient funds", () => {
      expect(suggestBanknoteExchange(BigInt(10000), inventory(0, 0, 1, 0, 0, 0, 0))).toBeNull();
      expect(suggestBanknoteExchange(BigInt(50500), inventory(1, 0, 0, 0, 0, 0, 0))).toBeNull();
      expect(suggestBanknoteExchange(BigInt(-500), inventory(1, 0, 0, 0, 0, 0, 0))).toBeNull();
      expect(suggestBanknoteExchange(BigInt(501), inventory(1, 0, 0, 0, 0, 0, 0))).toBeNull();
    });
  });
});

describe("allocateBanknotes", () => {
  it("prefers larger available banknotes and never exceeds the inventory", () => {
    expect(allocateBanknotes(BigInt(78500), inventory(1, 2, 2, 2, 4, 3, 2)))
      .toEqual(inventory(1, 1, 0, 1, 1, 1, 1));
  });

  it("uses smaller notes when a greedy choice would prevent an exact allocation", () => {
    expect(allocateBanknotes(BigInt(6000), inventory(0, 0, 0, 1, 3, 0, 0)))
      .toEqual(inventory(0, 0, 0, 0, 3, 0, 0));
  });

  it("reports an uncomposable target even when there is enough money", () => {
    expect(allocateBanknotes(BigInt(10500), inventory(0, 0, 2, 0, 0, 0, 0))).toBeNull();
  });

  it("reports insufficient banknotes", () => {
    expect(allocateBanknotes(BigInt(10000), inventory(0, 0, 0, 1, 0, 0, 0))).toBeNull();
  });

  it("rejects impossible small-denomination remainders with very large inventories", () => {
    const count = BigInt("1000000000000000000");
    expect(allocateBanknotes(count * BigInt(10000) + BigInt(500), [count, count, count, count, BigInt(0), BigInt(0), BigInt(0)]))
      .toBeNull();
  });

  it("allocates zero without requiring banknotes", () => {
    expect(allocateBanknotes(BigInt(0), inventory(0, 0, 0, 0, 0, 0, 0)))
      .toEqual(inventory(0, 0, 0, 0, 0, 0, 0));
  });

  it("rejects negative or non-rounded targets", () => {
    expect(allocateBanknotes(BigInt(-500), inventory(1, 1, 1, 1, 1, 1, 1))).toBeNull();
    expect(allocateBanknotes(BigInt(501), inventory(1, 1, 1, 1, 1, 1, 1))).toBeNull();
  });

  it("rejects invalid inventories", () => {
    expect(() => allocateBanknotes(BigInt(500), inventory(1))).toThrow("Invalid banknote inventory");
    expect(() => allocateBanknotes(BigInt(500), inventory(-1, 0, 0, 0, 0, 0, 0)))
      .toThrow("Invalid banknote inventory");
  });
});
