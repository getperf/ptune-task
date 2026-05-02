export type XMindOutlineNode = {
	title: string;
	children: XMindOutlineNode[];
};

export function parseTabbedXMindOutline(text: string): XMindOutlineNode[] {
	const root: XMindOutlineNode = { title: "ROOT", children: [] };
	const stack: Array<{ level: number; node: XMindOutlineNode }> = [
		{ level: -1, node: root },
	];

	for (const rawLine of stripHtmlComments(text).split(/\r?\n/)) {
		if (!rawLine.trim()) {
			continue;
		}

		let level = 0;
		while (rawLine[level] === "\t") {
			level += 1;
		}

		const title = rawLine.slice(level).trim();
		if (!title || title.startsWith("#")) {
			continue;
		}

		while (stack.length > 0 && stack[stack.length - 1].level >= level) {
			stack.pop();
		}

		const parent = stack[stack.length - 1]?.node ?? root;
		const node: XMindOutlineNode = { title, children: [] };
		parent.children.push(node);
		stack.push({ level, node });
	}

	return root.children.filter((node) => node.title !== "Fact");
}

function stripHtmlComments(text: string): string {
	return text.replace(/<!--[\s\S]*?-->/g, "");
}
