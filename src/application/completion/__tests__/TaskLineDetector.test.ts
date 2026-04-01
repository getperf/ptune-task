import {
  extractTaskTitle,
  getTaskBodyStart,
  isTaskLine,
  isEmptyTaskTemplateTriggerLine,
} from "../TaskLineDetector";

describe("TaskLineDetector", () => {
  test("detects standard unchecked task lines", () => {
    expect(isTaskLine("- [ ] task")).toBe(true);
    expect(getTaskBodyStart("- [ ] task")).toBe(6);
    expect(extractTaskTitle("- [ ] task")).toBe("task");
  });

  test("detects task lines with extra spaces after bullet", () => {
    expect(isTaskLine("-   [ ] test3")).toBe(true);
    expect(extractTaskTitle("-   [ ] test3")).toBe("test3");
  });

  test("detects checked task lines with lowercase or uppercase marker", () => {
    expect(isTaskLine("- [x] done")).toBe(true);
    expect(isTaskLine("- [X] done")).toBe(true);
    expect(extractTaskTitle("- [X] done")).toBe("done");
  });

  test("rejects non-task lines", () => {
    expect(isTaskLine("plain text")).toBe(false);
    expect(extractTaskTitle("plain text")).toBeNull();
  });

  test("detects empty task template trigger line", () => {
    expect(isEmptyTaskTemplateTriggerLine("- [ ] @@")).toBe(true);
    expect(isEmptyTaskTemplateTriggerLine("-   [ ] @@")).toBe(true);
  });
});
