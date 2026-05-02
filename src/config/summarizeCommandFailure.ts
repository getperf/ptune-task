export function summarizeCommandFailure(stdout: string, stderr: string): string {
	const lines = (value: string): string[] =>
		value
			.split(/\r?\n/)
			.map((entry) => entry.trim())
			.filter((entry) => entry.length > 0);
	const stderrLines = lines(stderr);
	const stdoutLines = lines(stdout);
	const pythonErrorLine =
		findPythonErrorLine(stderrLines) ?? findPythonErrorLine(stdoutLines);
	if (pythonErrorLine) {
		return pythonErrorLine;
	}
	return stderrLines[0] ?? stdoutLines[0] ?? "unknown error";
}

function findPythonErrorLine(lines: string[]): string | null {
	const pythonErrorLinePattern =
		/^(?:[A-Za-z_]\w*\.)*[A-Z][A-Za-z0-9_]*(?:Error|Exception|Warning|Interrupt|Exit):(?:\s|$)/;
	for (let index = lines.length - 1; index >= 0; index -= 1) {
		const line = lines[index];
		if (line && pythonErrorLinePattern.test(line)) {
			return line;
		}
	}
	return null;
}
