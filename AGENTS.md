# Repository Guidelines

## Project Structure & Module Organization
`PVE-Tools.sh` is the single entrypoint and must stay aligned with the `CURRENT_VERSION`, `VERSION`, and `UPDATE` trio whenever you ship changes. Keep common helpers clustered near the top, then append new menu handlers in numeric order so options remain discoverable. Vendored utilities live in `Tools/` (see `Tools/README.md`); treat them as upstream copies and document every local tweak inline plus in that README. Documentation resides in `docs/` (`README-EN.md`, `future-guide.md`) and visual assets belong in `images/`.

## Build, Test, and Development Commands
- `bash PVE-Tools.sh --debug` — bypasses PVE checks for workstation testing.
- `sudo ./PVE-Tools.sh` — authoritative Proxmox VE 9 run; verify menus here.
- `shellcheck PVE-Tools.sh Tools/*.sh` — lint for quoting and portability.
- `bash -n PVE-Tools.sh` — quick syntax gate before submitting.

## Coding Style & Naming Conventions
Use Bash 4 syntax, four-space indentation, lowercase snake_case for functions, and uppercase constants for colors, URLs, and menu tokens. Maintain the emoji-forward prompt style already present in the UI. Reference the predefined mirror constants instead of hard-coding URLs, and keep translations or bilingual copy side by side. Any ShellCheck suppression needs a trailing justification comment.

## Testing Guidelines
There is no CI, so complete a manual smoke test per feature. Always cover option 7 (one-click config), storage/Swap operations, Ceph add/remove, kernel manager, and menu 14 (third-party toolkit download + refresh). Attach snippets from `/var/log/pve-tools.log` or terminal transcripts to PRs, showing both `--debug` output and a real-node confirmation when the change mutates system state. When touching files inside `Tools/`, rerun option 14 → `r` and directly execute the affected script once.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`) as seen in `git log`; keep subjects user-facing and under 72 characters. Each PR should include context or linked issue, list of touched menu items, commands/tests executed, screenshots for UI shifts, and confirmation that `VERSION` plus the script’s `CURRENT_VERSION` moved together when required. Separate functional changes from documentation-only edits to simplify review.

## Security & Configuration Tips
Run everything as root on a writable Proxmox host; the tooling assumes it can touch `/etc/apt`, GRUB, and Ceph configs. Rely on the existing backup helpers that write to `/etc/pve-tools-backup` before destructive steps, and expand mirror constants rather than inlining region-specific URLs to keep auditability high.
