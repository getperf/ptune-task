from __future__ import annotations

import sys
from pathlib import Path

from ptune_sync.uri.uri_parser import parse_uri
from ptune_sync.uri.cli_dispatcher import run_cli


def main() -> int:

    if len(sys.argv) < 2:
        print("missing uri", file=sys.stderr)
        return 1

    raw_uri = sys.argv[1]

    commands, query = parse_uri(raw_uri)

    home = Path(query.get("home", ""))

    status_file = home / "status.json"
    log_file = home / "events.log"

    result = run_cli(commands, query)

    status_file.parent.mkdir(parents=True, exist_ok=True)

    if result.stdout:
        status_file.write_text(result.stdout, encoding="utf-8")

    # events.log (always append)
    with open(log_file, "a", encoding="utf-8") as f:

        f.write("\n--- uri call ---\n")
        f.write(raw_uri + "\n")

        if result.stdout:
            f.write("\nstdout:\n")
            f.write(result.stdout)

        if result.stderr:
            f.write("\nstderr:\n")
            f.write(result.stderr)

    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())