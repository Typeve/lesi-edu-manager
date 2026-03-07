---
tracker:
  kind: linear
  api_key: $LINEAR_API_KEY
  project_slug: "老师前端-lesi-edu-manager-430f03029855"
  active_states:
    - Todo
    - In Progress
    - Rework
workspace:
  root: /root/project/lesi-edu-model/workspaces/lesi-edu-manager
hooks:
  after_create: |
    git clone git@github.com:Typeve/lesi-edu-manager.git .
    pnpm install
  before_run: |
    git fetch --all --prune
  after_run: |
    git status --short
agent:
  max_concurrent_agents: 2
  max_turns: 12
codex:
  command: codex app-server
  read_timeout_ms: 30000
release:
  enabled: true
  trigger_state: "Ready to Deploy"
  deploying_state: "Deploying"
  success_state: "Deployed"
  failure_state: "Deploy Failed"
  main_branch: "main"
  verify_commands:
    - pnpm install --frozen-lockfile
    - pnpm run check
    - pnpm run build
  deploy_commands:
    - ssh wxq 'mkdir -p /www/wwwroot/laoshi.guopinleida.com'
    - rsync -az --delete --filter='P .user.ini' --filter='P .htaccess' --filter='P .well-known/' dist/ wxq:/www/wwwroot/laoshi.guopinleida.com/
  healthcheck_commands:
    - curl -fsS https://laoshi.guopinleida.com >/dev/null
---

You are working on a Linear issue for the `lesi-edu-manager` repository.

Before doing any task work, read and follow the current project's `AGENTS.md`.
You must use the required superpowers workflow defined there.

Repository facts:
- Stack: Vue 3, Vite, TypeScript
- Validate with `pnpm run check` and `pnpm run build` whenever possible.
- There is no automated test command configured in this repository.
- Database / external dependency expectation: No database dependency is expected for this frontend project.

Execution rules:
- Linear is the source of truth for issue state.
- Make the smallest effective change that resolves the issue.
- Read the existing implementation before changing structure.
- Do not make unrelated refactors.
- If missing environment, ambiguous requirements, or external dependencies block progress, explain the blocker clearly.
- Leave the branch and workspace in a reviewable state.
- Prepare the work for Human Review when complete.
- Do not directly move the issue into `Human Review`, `Ready to Deploy`, `Deploying`, or `Deployed`; Symphony orchestrators and release runners own those state transitions.
- Treat `Ready to Deploy` as the approval state for the release runner, `Deploying` as the active release state, and `Deployed` as the successful terminal release state.

Finish / deploy plan for this project:
- Main branch: main
- Merge strategy: merge
- Post-merge verification commands:
  - pnpm install --frozen-lockfile
  - pnpm run check
  - pnpm run build
- Deploy SSH target: wxq
- Deploy target directory: /www/wwwroot/laoshi.guopinleida.com
- Upload mode: rsync over ssh
- Remote deploy commands:
  - ssh wxq 'mkdir -p /www/wwwroot/laoshi.guopinleida.com'
  - rsync -az --delete dist/ wxq:/www/wwwroot/laoshi.guopinleida.com/
- Healthcheck commands:
  - curl -fsS https://laoshi.guopinleida.com >/dev/null
- Success state after deploy: Deployed
- Failure state after deploy: Deploy Failed

Operator note:
- The YAML front matter above is consumed by Symphony runtime.
- The finish/deploy settings in this template body must be filled before real project use.
- Leave no deployment placeholder unresolved before enabling finish/deploy automation.

Issue:
- Identifier: {{ issue.identifier }}
- Title: {{ issue.title }}
- Body: {{ issue.description }}
