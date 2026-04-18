# Event Hook Daemon Control Iteration Plan

## Context

- Current scope supports daemon ensure startup (`startup` / `event`) and status wait.
- UI has Event Hook settings, but no explicit daemon `stop` / `restart` controls yet.
- This item is deferred to a separate iteration.

## Goal

- Add daemon control actions in SettingTabs:
  - Stop daemon
  - Restart daemon
- Keep user-run architecture and avoid Windows service dependency.
- Treat graceful shutdown as the primary stop strategy.

## Control Policy

### 1) Stop

- Default behavior must be graceful stop.
- Do not use force-kill as first action.
- If graceful stop times out, allow optional fallback force stop with explicit user confirmation.

### 2) Restart

- Restart is defined as:
  1. graceful stop request
  2. wait for stop completion (lock stale + process not alive)
  3. start daemon with current Event Hook startup settings

### 3) Liveness

- Primary liveness signal: `runtime/locks/daemon.lock` freshness.
- Secondary signal: process existence check (when PID is available).
- Keep heuristic lightweight (same direction as current ensure policy).

## Proposed IPC Additions (for graceful stop)

Option A (recommended):
- Add daemon control request file under interop root:
  - `<interop_root>/interop/control/inbox/<request_id>.json`
- Control command example:
  - `command: "daemon-stop"`
- Python daemon handles command and writes status result to:
  - `<interop_root>/interop/control/status/<request_id>.json`

Rationale:
- Keeps file IPC style consistent with existing request/status pattern.
- Avoids direct OS kill as primary path.

## SettingTabs UX (next iteration)

- Add buttons in Event Hook section:
  - `Stop daemon`
  - `Restart daemon`
- Show current state label:
  - `running` / `stopping` / `stopped` / `unknown`
- Show last lock update timestamp for diagnosis.

## Safety Notes

- Avoid killing wrong process:
  - Verify PID + lock owner metadata when available.
- Prevent concurrent operations:
  - Singleflight guard for stop/restart actions.
- Notify clearly:
  - graceful timeout
  - fallback force-stop prompt
  - final result

## TODO

- [ ] Define control file schema (`daemon-stop`, future extensibility).
- [ ] Implement Python-side graceful stop handler.
- [ ] Implement ptune-task control client (write request + wait control status).
- [ ] Add SettingTabs buttons: stop / restart.
- [ ] Add UI state label + last lock updated timestamp.
- [ ] Add singleflight guard to avoid duplicate stop/restart.
- [ ] Add fallback force-stop flow with confirmation dialog.
- [ ] Add integration tests for:
  - graceful stop success
  - graceful stop timeout
  - restart success
  - restart failure and recovery notice

## Out of Scope (this iteration)

- Service mode migration.
- Full process supervisor features.
- Outbox-based async UX flows for daily review.
