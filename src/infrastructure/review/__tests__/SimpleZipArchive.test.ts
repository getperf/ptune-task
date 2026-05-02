import { SimpleZipArchive } from "../SimpleZipArchive";

describe("SimpleZipArchive", () => {
	test("writes and reads deflated zip entries", () => {
		const archive = new SimpleZipArchive([
			{ filename: "content.xml", data: Buffer.from("<old />", "utf8") },
			{ filename: "metadata.json", data: Buffer.from("{}", "utf8") },
		]);

		const roundTrip = SimpleZipArchive
			.fromArrayBuffer(archive.toArrayBuffer())
			.replace("content.xml", Buffer.from("<new />", "utf8"));
		const reread = SimpleZipArchive.fromArrayBuffer(roundTrip.toArrayBuffer());

		expect(reread.read("content.xml").toString("utf8")).toBe("<new />");
		expect(reread.read("metadata.json").toString("utf8")).toBe("{}");
	});
});
