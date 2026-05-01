export function summarizeCommandFailure(stdout: string, stderr: string): string {
	const lines = (value: string): string[] =>
		value
			.split(/\r?\n/)
			.map((entry) => entry.trim())
			.filter((entry) => entry.length > 0);
	const tomlDecodeErrorLine = [...lines(stderr), ...lines(stdout)].find((entry) =>
		entry.includes("TOMLDecodeError"),
	);
	if (tomlDecodeErrorLine) {
		return tomlDecodeErrorLine;
	}
	return lines(stderr)[0] ?? lines(stdout)[0] ?? "unknown error";
}
