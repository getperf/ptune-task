import { HabitService } from "../HabitService";

describe("HabitService", () => {
  test("collects only habits that still exist in markdown lines", () => {
    const lines = [
      "<!--",
      "comment",
      "-->",
      "",
      "- [ ] b",
      "- [ ] <夜>プール🚫",
      "- [ ] a",
    ];

    expect(
      HabitService.collectExistingHabits(lines, ["<朝>起床🚫", "<夜>プール🚫"]),
    ).toEqual(["<夜>プール🚫"]);
  });

  test("preserves configured habit order", () => {
    const lines = [
      "- [ ] <夜>プール🚫",
      "- [ ] <朝>起床🚫",
    ];

    expect(
      HabitService.collectExistingHabits(lines, ["<朝>起床🚫", "<夜>プール🚫"]),
    ).toEqual(["<朝>起床🚫", "<夜>プール🚫"]);
  });
});
