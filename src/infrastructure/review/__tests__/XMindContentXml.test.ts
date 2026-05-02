import {
	buildXMindContentXmlTemplate,
	renderXMindContentXml,
} from "../XMindContentXml";

describe("renderXMindContentXml", () => {
	test("replaces central topic title and children", () => {
		const result = renderXMindContentXml(
			buildXMindContentXmlTemplate("old"),
			"2026-05-02",
			[
				{
					title: "Fact",
					children: [
						{
							title: "note",
							children: [{ title: "summary & detail", children: [] }],
						},
					],
				},
				{ title: "KPT", children: [{ title: "Keep", children: [] }] },
			],
		).toString("utf8");

		expect(result).toContain("<title>2026-05-02</title>");
		expect(result).toContain("<title>Fact</title>");
		expect(result).toContain("<title>summary &amp; detail</title>");
		expect(result).toContain("<title>KPT</title>");
		expect(result).toContain("<title>Keep</title>");
	});
});
