export const TASK_LINE_REGEX = /^\s*-\s\[( |x)\]\s+/;

export function isTaskLine(line: string): boolean {
  return TASK_LINE_REGEX.test(line);
}

export function endsWithTrigger(prefix: string, trigger: string): boolean {
  return prefix.endsWith(trigger);
}
