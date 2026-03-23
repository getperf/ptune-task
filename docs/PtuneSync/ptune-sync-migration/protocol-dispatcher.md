# Ptune Sync Protocol Dispatcher

## Overview

This document describes the recommended responsibilities and state handling for
`ProtocolDispatcher` in the WinUI-based PtuneSync implementation.

The dispatcher is the WinUI-side entry point that receives URI activation,
resolves the request file, and ensures that duplicate URI activations do not
cause duplicate command execution.

## Responsibilities

`ProtocolDispatcher` SHOULD be responsible for:

- receiving URI activation
- recognizing reserved OAuth redirect paths
- parsing `request_id` and `request_file`
- loading `request.json`
- validating the request envelope
- deciding whether the request is new or already in progress
- updating `status.json` to `accepted`
- dispatching the internal command runner
- preventing duplicate execution for the same `request_id`

`ProtocolDispatcher` SHOULD NOT be responsible for:

- Google Tasks business logic
- token refresh implementation
- task JSON transformations
- retry scheduling on the caller side

## Recommended Flow

```text
Protocol activation
  -> if path == /oauth2redirect: forward to OAuth redirect signal and return
  -> parse URI
  -> resolve request.json
  -> validate request_id
  -> locate run directory
  -> read existing status.json if present
  -> decide whether request is new / running / completed
  -> if new: write accepted
  -> invoke internal command runner
```

## URI Input

Recommended URI forms:

```text
net.getperf.ptune.googleoauth:/run/push?request_id=<id>&request_file=<path>
```

Reserved redirect form:

```text
net.getperf.ptune.googleoauth:/oauth2redirect?code=...
```

Rules:

- `/oauth2redirect` MUST bypass run-command dispatch
- `/run/...` MUST be treated as command activation
- old flat paths such as `/auth` or `/export` MAY remain only as temporary compatibility aliases during migration

Recommended normalization:

- `namespace = "run"`
- `command = "push" | "pull" | "diff" | "review" | "auth/login" | "auth/status"`
- `raw_path = "run/push"` for logging

## Request Validation Rules

The dispatcher SHOULD reject the request when:

- `request_file` is missing
- `request.json` cannot be read
- `request_id` is missing
- `request_id` in URI and `request.json` do not match
- `command` is unsupported
- `workspace.status_file` is missing

Validation failure SHOULD result in writing an error `status.json` when possible.

## Path Routing Rules

Recommended path handling order:

1. `/oauth2redirect`
   - do not create or read `request.json`
   - forward to OAuth redirect handling only
2. `/run/...`
   - treat as a run command
   - validate `request_id` and `request_file`
   - dispatch through the request/status contract
3. legacy flat paths
   - only if compatibility mode is still enabled
   - normalize internally to the equivalent `/run/...` command

This keeps Google OAuth redirect handling isolated from general command execution.

## Idempotency Rules

The dispatcher MUST treat `request_id` as the logical execution key.

Recommended behavior:

### Case 1. No existing `status.json`

- treat request as new
- write `accepted`
- start execution

### Case 2. Existing `status.json` is `accepted` or `running`

- do not start a second execution
- keep the current run alive
- optionally refresh timestamp / heartbeat if needed

### Case 3. Existing `status.json` is `completed`

- do not re-run
- keep existing final result

This rule is required because the caller may relaunch the same URI during
startup retry.

## Recommended Status Transition

```text
caller writes request.json
  -> dispatcher writes accepted/running
  -> command runner writes running updates
  -> command runner writes completed/success or completed/error
```

The dispatcher SHOULD write the first accepted state as early as possible.

## Accepted State

Recommended minimum accepted write:

```json
{
  "schema_version": 1,
  "request_id": "20260322T080000Z-a1b2c3",
  "command": "push",
  "phase": "accepted",
  "status": "running",
  "timestamp": "2026-03-22T08:00:01Z",
  "message": "dispatcher accepted request",
  "retry_count": 0,
  "instance_id": "main",
  "data": null,
  "error": null
}
```

This write is the handshake that allows the caller to stop startup retry.

## Recommended Internal Components

Suggested split:

- `ProtocolDispatcher`
  - activation entry, path routing, and idempotency
- `RequestReader`
  - reads and validates `request.json`
- `StatusWriter`
  - atomic write of `status.json`
- `CommandDispatcher`
  - maps command name to use case runner
- `RunRegistry`
  - optional in-memory or file-based view of active requests

A file-based implementation may work without a separate registry if
`status.json` is treated as the source of truth.

## Error Handling

If request parsing fails before `status.json` is known:
- log locally
- return without crash if possible

If `status.json` path is known:
- write `completed/error`
- include `CONTRACT_ERROR` or `SYSTEM_ERROR`

## Threading / Activation Notes

The dispatcher SHOULD accept protocol activation as early as possible in app
startup.

Redirection or activation handling SHOULD avoid blocking the UI thread longer
than necessary.

A later implementation document should define the exact WinUI activation hook.

## Non-Goals

This document does not yet define:

- exact WinUI class names
- packaged vs unpackaged app differences
- how legacy flat paths are removed after migration
