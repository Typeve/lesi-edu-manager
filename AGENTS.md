# lesi-edu-manager Agent Rules

This file is for the Codex runtime that works inside the `lesi-edu-manager` project workspace.

## Required Skill Workflow

When taking over a Symphony issue, you must follow the superpowers workflow.

Required skills:

- `using-superpowers`
- `brainstorming`
- `using-git-worktrees`
- `verification-before-completion`

For implementation work, also use:

- `test-driven-development`

## Execution Rules

- Work only in the current project workspace.
- Do not edit directly on the `main` branch.
- Use a git worktree or issue branch workflow that keeps the main branch clean.
- Make the smallest effective change for the current issue.
- Do not make unrelated refactors.
- Prefer project checks with `pnpm`.
- Verify changes with the project validation commands before claiming completion.

## Project Validation

Primary commands:

- Check: `pnpm run check`
- Build: `pnpm run build`
- Test: `Not configured for this repository`

Environment notes:

- Database / external dependencies: No database dependency is expected for this frontend project.
- Manual validation notes: Manual browser and UI validation is required before marking the issue `Done`.

## Linear and Status Semantics

- Linear is the source of truth for task state.
- `Todo`, `In Progress`, and `Rework` are active execution states unless the project says otherwise.
- `Human Review` means the coding phase is complete and waiting for human review.
- `Done` means the issue is approved to enter finish/deploy.
- `Done` does not mean deployment is already complete.

## Finish / Deploy Boundary

After an issue reaches `Done`, it should move into a separate finish/deploy stage.
That stage should handle merge, post-merge verification, and deployment according to project rules.

Recommended finish/deploy sequence:

1. Confirm the issue worktree is clean.
2. Merge the issue branch into `main`.
3. Run post-merge verification commands on the main branch.
4. Deploy from the Symphony machine to the remote host over SSH.
5. Use `rsync --delete` to sync the contents of local `dist/` to the remote target directory.
6. Run an HTTP healthcheck after sync completes.
7. Treat unresolved deployment placeholders as blockers.

Deploy connection settings to fill before production use:

- Host: `82.157.154.116`
- User: `root`
- Target directory: `/www/wwwroot/laoshi.guopinleida.com`
- Healthcheck: `curl -fsS https://laoshi.guopinleida.com >/dev/null`
