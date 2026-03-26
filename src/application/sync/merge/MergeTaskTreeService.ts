import { TaskTreeNode } from "../../../infrastructure/conversion/task/tree/TaskTreeBuilder";
import { TaskKeyService } from "../../../infrastructure/conversion/task/tree/TaskKeyService";

type TreeIndex = {
  byId: Map<string, TaskTreeNode>;
  byKey: Map<string, TaskTreeNode>;
  keyByNode: Map<TaskTreeNode, string>;
};

export class MergeTaskTreeService {
  merge(local: TaskTreeNode[], google: TaskTreeNode[]): TaskTreeNode[] {
    const googleIndex = this.buildIndex(google);
    const localIndex = this.buildIndex(local);

    const result: TaskTreeNode[] = [];

    // ① Google順で処理
    for (const googleRoot of google) {
      const localMatch = this.findMatch(googleRoot, googleIndex, localIndex);

      if (localMatch) {
        result.push(
          this.mergeNode(localMatch, googleRoot, localIndex, googleIndex),
        );
      } else {
        result.push(googleRoot);
      }
    }

    // ② ローカルのみ存在する root を末尾に追加
    for (const localRoot of local) {
      if (!this.findMatch(localRoot, localIndex, googleIndex)) {
        result.push(localRoot);
      }
    }

    return result;
  }

  private mergeNode(
    localNode: TaskTreeNode,
    googleNode: TaskTreeNode,
    localIndex: TreeIndex,
    googleIndex: TreeIndex,
  ): TaskTreeNode {
    const mergedChildren: TaskTreeNode[] = [];

    // Google順で子を処理
    for (const googleChild of googleNode.children) {
      const localChild = this.findMatch(googleChild, googleIndex, localIndex);

      if (localChild) {
        mergedChildren.push(
          this.mergeNode(localChild, googleChild, localIndex, googleIndex),
        );
      } else {
        mergedChildren.push(googleChild);
      }
    }

    // ローカルのみ存在する子を追加
    for (const localChild of localNode.children) {
      const exists = this.findMatch(localChild, localIndex, googleIndex);

      if (!exists) {
        mergedChildren.push(localChild);
      }
    }

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
