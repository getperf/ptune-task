export const TASK_LINE_REGEX = /^\s*-\s+\[( |x|X)\]\s+/;
export const EMPTY_UNCHECKED_TASK_TEMPLATE_REGEX = /^\s*-\s+\[\s\]\s*@@$/;

export function isTaskLine(line: string): boolean {
  return TASK_LINE_REGEX.test(line);
}

export function isEmptyTaskTemplateTriggerLine(line: string): boolean {
  return EMPTY_UNCHECKED_TASK_TEMPLATE_REGEX.test(line);
}

export function getTaskBodyStart(line: string): number | null {
  const match = line.match(TASK_LINE_REGEX);

  return match ? match[0].length : null;
}

export function extractTaskTitle(line: string): string | null {
  const bodyStart = getTaskBodyStart(line);

  if (bodyStart === null) {
    return null;
  }

  return line.slice(bodyStart).trim();
}
