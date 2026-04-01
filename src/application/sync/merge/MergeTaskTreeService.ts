import { TaskTreeNode } from "../../../infrastructure/conversion/task/tree/TaskTreeBuilder";
import { TaskKeyService } from "../../../infrastructure/conversion/task/tree/TaskKeyService";

type TreeIndex = {
  byId: Map<string, TaskTreeNode>;
  byKey: Map<string, TaskTreeNode>;
  keyByNode: Map<TaskTreeNode, string>;
};

type MergeOrder = "remote-first" | "local-first";

type MergeOptions = {
  order?: MergeOrder;
};

export class MergeTaskTreeService {
  merge(
    local: TaskTreeNode[],
    google: TaskTreeNode[],
    options: MergeOptions = {},
  ): TaskTreeNode[] {
    const order = options.order ?? "remote-first";
    const googleIndex = this.buildIndex(google);
    const localIndex = this.buildIndex(local);

    return this.mergeOrdered(local, google, localIndex, googleIndex, order);
  }

  private mergeOrdered(
    local: TaskTreeNode[],
    google: TaskTreeNode[],
    localIndex: TreeIndex,
    googleIndex: TreeIndex,
    order: MergeOrder,
  ): TaskTreeNode[] {
    const primary = order === "local-first" ? local : google;
    const primaryIndex = order === "local-first" ? localIndex : googleIndex;
    const secondary = order === "local-first" ? google : local;
    const secondaryIndex = order === "local-first" ? googleIndex : localIndex;

    const result: TaskTreeNode[] = [];

    for (const primaryNode of primary) {
      const secondaryMatch = this.findMatch(primaryNode, primaryIndex, secondaryIndex);

      if (order === "local-first") {
        result.push(
          secondaryMatch
            ? this.mergeNode(primaryNode, secondaryMatch, localIndex, googleIndex, order)
            : primaryNode,
        );
      } else {
        result.push(
          secondaryMatch
            ? this.mergeNode(secondaryMatch, primaryNode, localIndex, googleIndex, order)
            : primaryNode,
        );
      }
    }

    for (const secondaryNode of secondary) {
      if (!this.findMatch(secondaryNode, secondaryIndex, primaryIndex)) {
        result.push(secondaryNode);
      }
    }

    return result;
  }

  private mergeNode(
    localNode: TaskTreeNode,
    googleNode: TaskTreeNode,
    localIndex: TreeIndex,
    googleIndex: TreeIndex,
    order: MergeOrder,
  ): TaskTreeNode {
    const mergedChildren = this.mergeOrdered(
      localNode.children,
      googleNode.children,
      localIndex,
      googleIndex,
      order,
    );

    return {
      entry: {
        ...googleNode.entry,
        pomodoroPlanned:
          localNode.entry.pomodoroPlanned ?? googleNode.entry.pomodoroPlanned,
        tags: localNode.entry.tags ?? googleNode.entry.tags,
        goal: localNode.entry.goal ?? googleNode.entry.goal,
      },
      children: mergedChildren,
    };
  }

  private findMatch(
    node: TaskTreeNode,
    source: TreeIndex,
    target: TreeIndex,
  ): TaskTreeNode | undefined {
    const key = source.keyByNode.get(node);

    return target.byId.get(node.entry.id) ?? (key ? target.byKey.get(key) : undefined);
  }

  private buildIndex(nodes: TaskTreeNode[]): TreeIndex {
    const byId = new Map<string, TaskTreeNode>();
    const byKey = new Map<string, TaskTreeNode>();
    const keyByNode = new Map<TaskTreeNode, string>();

    const visit = (node: TaskTreeNode, parentTitle: string | null) => {
      const key = parentTitle
        ? TaskKeyService.buildChildKey(parentTitle, node.entry.title)
        : TaskKeyService.buildRootKey(node.entry.title);

      byId.set(node.entry.id, node);
      byKey.set(key, node);
      keyByNode.set(node, key);

      for (const child of node.children) {
        visit(child, node.entry.title);
      }
    };

    for (const root of nodes) {
      visit(root, null);
    }

    return { byId, byKey, keyByNode };
  }
}
