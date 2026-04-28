# Repository Guidelines

## Project Structure & Module Organization

`PVE-Tools.sh` is the main Bash entry point for Proxmox VE 9.x operations. `Tools/` contains standalone maintenance scripts for host setup, LXC cleanup, monitoring, kernel handling, and backups. `Modules/` contains plugin-market modules and bundled binary assets such as `Modules/VGPU/*.so`; do not edit binary files unless the change is intentional and documented. `Web/` is the VitePress documentation site, with pages in Markdown and static assets under `Web/public/` and `Web/assets/`. `Docs/` stores supplemental guides, `images/` stores README and site screenshots, and `.github/` contains issue templates and CI/release workflows.

## Build, Test, and Development Commands

Run Bash checks from the repository root:

```bash
bash -n PVE-Tools.sh
shellcheck -f gcc PVE-Tools.sh
```

For the documentation site:

```bash
cd Web
bun install
bun run dev
bun run build
bun run preview
```

`bun run build` copies `VERSION`, `UPDATE`, and `PVE-Tools.sh` into the generated site output.

## Coding Style & Naming Conventions

Bash scripts use `#!/bin/bash`, 4-space indentation, and `snake_case` function names. Use `UPPER_SNAKE` for constants and global configuration, and `lower_case` for local variables. Prefer existing helpers in `PVE-Tools.sh`, especially logging, confirmation, backup, UI, and idempotent configuration functions. Web components should follow VitePress/Vue 3 conventions with `<script setup>` and scoped CSS where applicable.

## Testing Guidelines

There is no full automated end-to-end test suite. At minimum, run `bash -n PVE-Tools.sh` and `shellcheck -f gcc PVE-Tools.sh` for script changes. Keep `CURRENT_VERSION` in `PVE-Tools.sh` synchronized with `VERSION` when releasing. High-risk workflows must be manually verified on an appropriate Proxmox VE 9.x environment with backups and a rollback plan.

## Commit & Pull Request Guidelines

Follow the existing Conventional Commit style: `feat:`, `fix(scope):`, `docs:`, and `chore:`. Keep commits focused and describe operational risk when touching networking, firewall, storage, GRUB, passthrough, or VM lifecycle logic. Pull requests should include a clear summary, linked issue when relevant, validation commands, screenshots for documentation or UI changes, and notes about manual PVE testing.

## Security & Configuration Tips

Avoid introducing `eval` or unreviewed `source` usage. Back up host configuration before modifying production-facing behavior. Treat network, firewall, storage, kernel, and passthrough changes as high risk.
