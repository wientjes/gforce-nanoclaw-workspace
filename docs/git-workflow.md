# NanoClaw Git Workflow

## Two-Repo Setup

| Repo | Path | Remote | Purpose |
|------|------|--------|---------|
| NanoClaw | `~/nanoclaw` | `https://github.com/qwibitai/nanoclaw` | Upstream source — pull only, never commit |
| Workspace | `~/gforce-nanoclaw-workspace` | `git@github.com:wientjes/gforce-nanoclaw-workspace.git` | Your files — memory, persona, bot code, scripts, docs |

NanoClaw is treated as a clean upstream dependency. All personal files live in the workspace repo and are backed up independently.

## Auto-Sync

The workspace is watched by a systemd service (`nanoclaw-workspace-sync`) that automatically commits and pushes any changes to GitHub after 30 seconds of inactivity. No manual action needed for routine changes.

```bash
systemctl --user status nanoclaw-workspace-sync   # check it's running
systemctl --user restart nanoclaw-workspace-sync  # restart if needed
```

## Shortcuts

Defined in `~/.bash_aliases`, loaded automatically in new shells.

| Command | What it does |
|---------|--------------|
| `nc-update` | Pull latest NanoClaw from upstream |
| `nc-status` | Show NanoClaw git status |
| `ws-save "msg"` | Manually commit all workspace changes with a message and push |
| `ws-status` | Show workspace git status |
| `ws-pull` | Pull workspace from GitHub |

`ws-save` is for intentional saves with a meaningful commit message. The auto-sync watcher handles everything else.

## Standard Workflows

### Pull a NanoClaw update

```bash
nc-update
```

### Manually save workspace changes

```bash
ws-save "describe what changed"
```

### Check what's uncommitted in the workspace

```bash
ws-status
```

## Workspace Repo Structure

```
gforce-nanoclaw-workspace/
├── docs/                              ← setup and workflow documentation
│   └── git-workflow.md
├── groups/
│   ├── main/                          ← GForceDawn agent files
│   │   ├── CLAUDE.md                  ← persona and instructions
│   │   ├── IDENTITY.md
│   │   ├── MEMORY.md
│   │   ├── SOUL.md
│   │   ├── USER.md
│   │   ├── ecosystem.config.js        ← PM2 config (API keys redacted)
│   │   ├── package.json
│   │   ├── send-telegram.js
│   │   ├── telegram-bot*.js
│   │   └── telegram-processor.js
│   └── global/
│       └── CLAUDE.md                  ← global memory for all groups
├── scripts/
│   ├── watch-workspace.sh             ← file watcher (auto-commit on change)
│   └── nanoclaw-workspace-sync.service ← systemd service for the watcher
├── .bash_aliases                      ← shell shortcuts
├── .gitignore
└── install.sh                         ← restore script for fresh setup
```

**Not tracked** (gitignored): `node_modules/`, `conversations/`, `logs/`, `.env`, API keys.

## Fresh Setup / Restore

```bash
git clone https://github.com/qwibitai/nanoclaw ~/nanoclaw
git clone git@github.com:wientjes/gforce-nanoclaw-workspace ~/gforce-nanoclaw-workspace
cd ~/gforce-nanoclaw-workspace && ./install.sh
cd ~/nanoclaw/groups/main && npm install
```

`install.sh` restores all files and enables the auto-sync service.

Then re-authenticate WhatsApp and Telegram, and add API keys to `~/nanoclaw/groups/main/.telegram/.env`.
