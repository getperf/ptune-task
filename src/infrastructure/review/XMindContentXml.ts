import { randomUUID } from "crypto";
import { XMindOutlineNode } from "./XMindOutline";

const CONTENT_NS = "urn:xmind:xmap:xmlns:content:2.0";

export function renderXMindContentXml(
	contentXml: Buffer,
	centerTitle: string,
	outline: XMindOutlineNode[],
): Buffer {
	const source = contentXml.toString("utf8");
	const sheet = findElementRange(source, "sheet", 0);
	if (!sheet) {
		throw new Error("content.xml does not contain a sheet element");
	}

	const centralTopic = findElementRange(source, "topic", sheet.openEnd);
	if (!centralTopic || centralTopic.closeEnd > sheet.closeStart) {
		throw new Error("content.xml sheet does not contain a central topic");
	}

	const centralTopicXml = source.slice(centralTopic.openStart, centralTopic.closeEnd);
	const renderedCentralTopic = renderCentralTopic(
		centralTopicXml,
		centerTitle,
		outline,
	);
	const output =
		source.slice(0, centralTopic.openStart)
		+ renderedCentralTopic
		+ source.slice(centralTopic.closeEnd);

	return Buffer.from(output, "utf8");
}

function renderCentralTopic(
	centralTopicXml: string,
	centerTitle: string,
	outline: XMindOutlineNode[],
): string {
	const topic = findElementRange(centralTopicXml, "topic", 0);
	if (!topic) {
		throw new Error("central topic element is invalid");
	}

	const openTag = centralTopicXml.slice(topic.openStart, topic.openEnd);
	const closeTag = centralTopicXml.slice(topic.closeStart, topic.closeEnd);
	const prefix = getTagPrefix(openTag);
	const inner = centralTopicXml.slice(topic.openEnd, topic.closeStart);
	const withoutChildren = removeDirectChildrenElements(inner);
	const withTitle = replaceOrPrependTitle(withoutChildren, centerTitle, prefix);
	const childrenXml = renderTopicChildren(outline, prefix);
	return `${openTag}${withTitle}${childrenXml}${closeTag}`;
}

function removeDirectChildrenElements(innerXml: string): string {
	let cursor = 0;
	let output = "";

	while (cursor < innerXml.length) {
		const children = findNextElementRange(innerXml, "children", cursor);
		if (!children) {
			output += innerXml.slice(cursor);
			break;
		}
		output += innerXml.slice(cursor, children.openStart);
		cursor = children.closeEnd;
	}

	return output;
}

function replaceOrPrependTitle(
	innerXml: string,
	title: string,
	prefix: string,
): string {
	const titleRange = findElementRange(innerXml, "title", 0);
	const renderedTitle = element("title", prefix, escapeXmlText(title));
	if (!titleRange) {
		return `${renderedTitle}${innerXml}`;
	}

	return (
		innerXml.slice(0, titleRange.openStart)
		+ renderedTitle
		+ innerXml.slice(titleRange.closeEnd)
	);
}

function renderTopicChildren(nodes: XMindOutlineNode[], prefix: string): string {
	if (nodes.length === 0) {
		return "";
	}

	return [
		openElement("children", prefix),
		openElement("topics", prefix, ' type="attached"'),
		...nodes.map((node) => renderTopic(node, prefix)),
		closeElement("topics", prefix),
		closeElement("children", prefix),
	].join("");
}

function renderTopic(node: XMindOutlineNode, prefix: string): string {
	return [
		openElement("topic", prefix, ` id="${randomUUID().replace(/-/g, "")}"`),
		element("title", prefix, escapeXmlText(node.title)),
		renderTopicChildren(node.children, prefix),
		closeElement("topic", prefix),
	].join("");
}

type ElementRange = {
	openStart: number;
	openEnd: number;
	closeStart: number;
	closeEnd: number;
};

function findNextElementRange(
	xml: string,
	localName: string,
	from: number,
): ElementRange | null {
	let cursor = from;
	while (cursor < xml.length) {
		const range = findElementRange(xml, localName, cursor);
		if (!range) {
			return null;
		}
		return range;
	}
	return null;
}

function findElementRange(
	xml: string,
	localName: string,
	from: number,
): ElementRange | null {
	let openStart = findOpeningTag(xml, localName, from);
	while (openStart >= 0) {
		const openEnd = xml.indexOf(">", openStart);
		if (openEnd < 0) {
			return null;
		}

		if (xml[openEnd - 1] === "/") {
			openStart = findOpeningTag(xml, localName, openEnd + 1);
			continue;
		}

		let depth = 1;
		let cursor = openEnd + 1;
		while (cursor < xml.length) {
			const nextStart = xml.indexOf("<", cursor);
			if (nextStart < 0) {
				return null;
			}

			if (xml.startsWith("<!--", nextStart)) {
				const commentEnd = xml.indexOf("-->", nextStart + 4);
				cursor = commentEnd >= 0 ? commentEnd + 3 : xml.length;
				continue;
			}

			const tagEnd = xml.indexOf(">", nextStart);
			if (tagEnd < 0) {
				return null;
			}

			const tagText = xml.slice(nextStart, tagEnd + 1);
			if (isClosingTag(tagText, localName)) {
				depth -= 1;
				if (depth === 0) {
					return {
						openStart,
						openEnd: openEnd + 1,
						closeStart: nextStart,
						closeEnd: tagEnd + 1,
					};
				}
			} else if (isOpeningTag(tagText, localName) && !tagText.endsWith("/>")) {
				depth += 1;
			}

			cursor = tagEnd + 1;
		}

		return null;
	}

	return null;
}

function findOpeningTag(xml: string, localName: string, from: number): number {
	let cursor = from;
	while (cursor < xml.length) {
		const start = xml.indexOf("<", cursor);
		if (start < 0) {
			return -1;
		}
		const end = xml.indexOf(">", start);
		if (end < 0) {
			return -1;
		}
		const tagText = xml.slice(start, end + 1);
		if (isOpeningTag(tagText, localName)) {
			return start;
		}
		cursor = end + 1;
	}
	return -1;
}

function isOpeningTag(tagText: string, localName: string): boolean {
	if (!tagText.startsWith("<") || tagText.startsWith("</") || tagText.startsWith("<?") || tagText.startsWith("<!")) {
		return false;
	}
	return getTagLocalName(tagText) === localName;
}

function isClosingTag(tagText: string, localName: string): boolean {
	return tagText.startsWith("</") && getTagLocalName(tagText) === localName;
}

function getTagLocalName(tagText: string): string {
	const match = /^<\/?\s*([A-Za-z_][\w.-]*:)?([A-Za-z_][\w.-]*)/.exec(tagText);
	return match?.[2] ?? "";
}

function getTagPrefix(tagText: string): string {
	const match = /^<\/?\s*(([A-Za-z_][\w.-]*):)?[A-Za-z_][\w.-]*/.exec(tagText);
	return match?.[2] ? `${match[2]}:` : "";
}

function openElement(localName: string, prefix: string, attributes = ""): string {
	return `<${prefix}${localName}${attributes}>`;
}

function closeElement(localName: string, prefix: string): string {
	return `</${prefix}${localName}>`;
}

function element(localName: string, prefix: string, content: string): string {
	return `${openElement(localName, prefix)}${content}${closeElement(localName, prefix)}`;
}

function escapeXmlText(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

export function buildXMindContentXmlTemplate(centerTitle = "Central Topic"): Buffer {
	return Buffer.from(
		[
			'<?xml version="1.0" encoding="UTF-8"?>',
			`<xmap-content xmlns="${CONTENT_NS}" version="2.0">`,
			"<sheet>",
			"<topic>",
			`<title>${escapeXmlText(centerTitle)}</title>`,
			"</topic>",
			"</sheet>",
			"</xmap-content>",
		].join(""),
		"utf8",
	);
}
