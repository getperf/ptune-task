export class DailyNotePathResolver {
  constructor(private readonly baseDir: string) {}

  resolve(date: string): string {
    return this.baseDir ? `${this.baseDir}/${date}.md` : `${date}.md`;
  }
}
