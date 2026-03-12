import { TaskTreeNode } from "../../../infrastructure/conversion/task/tree/TaskTreeBuilder";

export class MergeTaskTreeService {
  merge(local: TaskTreeNode[], google: TaskTreeNode[]): TaskTreeNode[] {
    const googleById = new Map<string, TaskTreeNode>();
    const localById = new Map<string, TaskTreeNode>();

    for (const g of this.flatten(google)) {
      googleById.set(g.entry.id, g);
    }

    for (const l of this.flatten(local)) {
      localById.set(l.entry.id, l);
    }

    const result: TaskTreeNode[] = [];

    // ① ローカル順で処理
    for (const localRoot of local) {
      const googleMatch = googleById.get(localRoot.entry.id);

      if (googleMatch) {
        result.push(this.mergeNode(localRoot, googleMatch, googleById));
      } else {
        // 未登録ローカル
        result.push(localRoot);
      }
    }

    // ② Googleにのみ存在する root を末尾に追加
    for (const googleRoot of google) {
      if (!localById.has(googleRoot.entry.id)) {
        result.push(googleRoot);
      }
    }

    return result;
  }

  private mergeNode(
    localNode: TaskTreeNode,
    googleNode: TaskTreeNode,
    googleById: Map<string, TaskTreeNode>,
  ): TaskTreeNode {
    const mergedChildren: TaskTreeNode[] = [];

    // ローカル順で子を処理
    for (const localChild of localNode.children) {
      const googleChild = googleById.get(localChild.entry.id);

      if (googleChild) {
        mergedChildren.push(
          this.mergeNode(localChild, googleChild, googleById),
        );
      } else {
        mergedChildren.push(localChild);
      }
    }

    // Googleのみ存在する子を追加
    for (const googleChild of googleNode.children) {
      const exists = localNode.children.find(
        (c) => c.entry.id === googleChild.entry.id,
      );

      if (!exists) {
        mergedChildren.push(googleChild);
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

  private flatten(nodes: TaskTreeNode[]): TaskTreeNode[] {
    const result: TaskTreeNode[] = [];
    const stack = [...nodes];

    while (stack.length) {
      const node = stack.pop()!;
      result.push(node);
      stack.push(...node.children);
    }

    return result;
  }
}
