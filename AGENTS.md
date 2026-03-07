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
- Manual validation notes: Manual browser and UI validation is required before moving the issue to `Ready to Deploy`.

## Linear and Status Semantics

- Linear is the source of truth for task state.
- `Todo`, `In Progress`, and `Rework` are active execution states unless the project says otherwise.
- `Human Review` means the coding phase is complete and waiting for human review.
- `Ready to Deploy` means human review is complete and release automation may take over.
- `Deploying` means the release runner is actively merging, verifying, or deploying.
- `Deployed` means the release finished successfully.

## State Transition Ownership

- Agents must not directly move issues into `Human Review`, `Ready to Deploy`, `Deploying`, or `Deployed`.
- The coding orchestrator owns the controlled handoff into `Human Review`.
- The release runner owns the transitions into `Ready to Deploy`, `Deploying`, and `Deployed`.

## Finish / Deploy Boundary

After an issue reaches `Ready to Deploy`, it should move into the separate finish/deploy stage.
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

- SSH target: `wxq`
- Target directory: `/www/wwwroot/laoshi.guopinleida.com`
- Healthcheck: `curl -fsS https://laoshi.guopinleida.com >/dev/null`
