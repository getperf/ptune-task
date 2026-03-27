import { TaskEntry } from "../../../../domain/task/TaskEntry";
import { TaskTreeNode } from "../../../../infrastructure/conversion/task/tree/TaskTreeBuilder";
import { MergeTaskTreeService } from "../MergeTaskTreeService";

function entry(
  id: string,
  title: string,
  parentId: string | null = null,
): TaskEntry {
  return {
    id,
    title,
    parentId,
    parentKey: null,
    pomodoroPlanned: null,
    tags: [],
    goal: null,
  };
}

function node(
  taskEntry: TaskEntry,
  children: TaskTreeNode[] = [],
): TaskTreeNode {
  return {
    entry: taskEntry,
    children,
  };
}

describe("MergeTaskTreeService", () => {
  test("matches newly created tasks by semantic key when ids differ", () => {
    const service = new MergeTaskTreeService();

    const local = [
      node(entry("a-id", "a"), [
        node(entry("a__a1", "a1", "a-id")),
        node(entry("a__a2", "a2", "a-id")),
        node(entry("a__a3", "a3", "a-id")),
      ]),
      node(entry("b", "b"), [
        node(entry("b__b1", "b1", "b")),
        node(entry("b__b2", "b2", "b")),
      ]),
    ];

    const remote = [
      node(entry("a-id", "a"), [
        node(entry("ga1", "a1", "a-id")),
        node(entry("ga2", "a2", "a-id")),
        node(entry("ga3", "a3", "a-id")),
      ]),
      node(entry("gb", "b"), [
        node(entry("gb1", "b1", "gb")),
        node(entry("gb2", "b2", "gb")),
      ]),
    ];

    const merged = service.merge(local, remote);

    expect(merged).toHaveLength(2);
    expect(merged[0]?.entry.title).toBe("a");
    expect(merged[0]?.children.map((child) => child.entry.title)).toEqual([
      "a1",
      "a2",
      "a3",
    ]);
    expect(merged[1]?.entry.title).toBe("b");
    expect(merged[1]?.children.map((child) => child.entry.title)).toEqual([
      "b1",
      "b2",
    ]);
    expect(merged[1]?.entry.id).toBe("gb");
    expect(merged[0]?.children[2]?.entry.id).toBe("ga3");
  });

  test("prefers remote order for matched tasks during pull merge", () => {
    const service = new MergeTaskTreeService();

    const local = [
      node(entry("task2-id", "task2"), [
        node(entry("task2__test1", "test1", "task2-id")),
      ]),
      node(entry("task1-id", "task1"), [
        node(entry("task1__test1", "test1", "task1-id")),
      ]),
    ];

    const remote = [
      node(entry("g-task1", "task1"), [
        node(entry("g-task1-test1", "test1", "g-task1")),
      ]),
      node(entry("g-task2", "task2"), [
        node(entry("g-task2-test1", "test1", "g-task2")),
      ]),
    ];

    const merged = service.merge(local, remote);

    expect(merged.map((root) => root.entry.title)).toEqual(["task1", "task2"]);
    expect(merged[0]?.children.map((child) => child.entry.title)).toEqual(["test1"]);
    expect(merged[1]?.children.map((child) => child.entry.title)).toEqual(["test1"]);
    expect(merged[0]?.entry.id).toBe("g-task1");
    expect(merged[1]?.entry.id).toBe("g-task2");
  });

  test("can preserve local order for post-push rebuild", () => {
    const service = new MergeTaskTreeService();

    const local = [
      node(entry("habit-morning", "<朝>くすり🚫")),
      node(entry("g-task3", "test3"), [
        node(entry("g-task3-child", "Task1", "g-task3")),
      ]),
      node(entry("g-task4", "test4"), [
        node(entry("g-task4-child", "Task1", "g-task4")),
      ]),
      node(entry("g-task5", "test5"), [
        node(entry("g-task5-child1", "Task1", "g-task5")),
        node(entry("g-task5-child2", "Task2", "g-task5")),
      ]),
      node(entry("habit-evening", "<夜>プール🚫")),
    ];

    const remote = [
      node(entry("g-task4", "test4"), [
        node(entry("g-task4-child", "Task1", "g-task4")),
      ]),
      node(entry("g-task5", "test5"), [
        node(entry("g-task5-child1", "Task1", "g-task5")),
        node(entry("g-task5-child2", "Task2", "g-task5")),
      ]),
      node(entry("habit-evening-remote", "<夜>プール🚫")),
      node(entry("g-task3", "test3"), [
        node(entry("g-task3-child", "Task1", "g-task3")),
      ]),
      node(entry("habit-morning-remote", "<朝>くすり🚫")),
    ];

    const merged = service.merge(local, remote, { order: "local-first" });

    expect(merged.map((root) => root.entry.title)).toEqual([
      "<朝>くすり🚫",
      "test3",
      "test4",
      "test5",
      "<夜>プール🚫",
    ]);
    expect(merged[0]?.entry.id).toBe("habit-morning-remote");
    expect(merged[4]?.entry.id).toBe("habit-evening-remote");
  });
});
