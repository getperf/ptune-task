# Obsidian Store Submission Draft

## Short Description

`ptune-task` is an Obsidian Desktop plugin for daily task planning, Google Tasks synchronization through PtuneSync, and end-of-day review around Daily Notes.

## Detailed Description

`ptune-task` is a workflow-focused plugin for users who manage daily work inside Obsidian Daily Notes.

Core capabilities:

- pull unfinished tasks into today's daily note
- edit and organize today's planned tasks in Markdown
- push task changes to Google Tasks through the external PtuneSync app
- rebuild daily task sections after synchronization
- generate daily review sections from task data
- optionally generate note summaries and reflection points

The plugin is intended for desktop use and keeps the main workflow centered in the vault. It also includes a setup check UI to help users verify required items such as Daily Notes and PtuneSync.

## Disclosures

- Sync depends on the external companion app `PtuneSync`
- Google Tasks sync requires a Google account
- Sync and optional LLM features use external network services
- LLM-based note summary and reflection features are optional and user-configured
- An external event hook for `ptune-log` integration exists, but it is disabled by default
- No telemetry is included

## Reviewer Notes

- `isDesktopOnly` is intentionally `true`
- The main supported workflow is Windows desktop because PtuneSync-based sync relies on a desktop URI launch flow
- Non-sync parts of the plugin are still organized around Obsidian Daily Notes and in-vault Markdown editing
- Setup and detailed user documentation are published on the official site:
  - https://ptune.getperf.net/
  - https://ptune.getperf.net/en/

## Suggested PR Message

This PR adds `ptune-task`, an Obsidian Desktop plugin for daily task planning, Google Tasks synchronization through PtuneSync, and daily review workflows around Daily Notes.

Key points:

- desktop-only plugin
- Windows-supported sync workflow through PtuneSync
- Daily Notes-centered task planning and review
- explicit disclosures added for external app dependency, Google account requirement, network use, optional LLM integration, and optional ptune-log event hook
