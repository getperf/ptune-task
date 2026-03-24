import { ProjectFolder } from "../../../domain/project/ProjectFolder";

export class ProjectIndexBasesTemplateBuilder {
  build(folder: ProjectFolder): string {
    return [
      "```base",
      "views:",
      "  - type: list",
      "    name: NoteSummaries",
      "    filters:",
      "      and:",
      `        - file.inFolder("${folder.path}")`,
      '        - file.hasProperty("dailynote")',
      "    groupBy:",
      "      property: dailynote",
      "      direction: DESC",
      "    order:",
      "      - file.name",
      "      - summary",
      "      - tags",
      "    sort:",
      "      - property: file.name",
      "        direction: DESC",
      "```",
    ].join("\n");
  }
}
