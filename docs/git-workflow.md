# NanoClaw Git Workflow

## Two-Repo Setup

| Repo | Path | Remote | Purpose |
|------|------|--------|---------|
| NanoClaw | `~/nanoclaw` | `https://github.com/qwibitai/nanoclaw` | Upstream source — pull only, never commit |
| Workspace | `~/gforce-nanoclaw-workspace` | `git@github.com:wientjes/gforce-nanoclaw-workspace.git` | Your files — memory, persona, bot code, scripts |

NanoClaw is treated as a clean upstream dependency. All personal files live in the workspace repo and are backed up independently.

## Shortcuts

Defined in `~/.bash_aliases`, loaded automatically in new shells.

| Command | What it does |
|---------|--------------|
| `nc-update` | Pull latest NanoClaw from upstream |
| `nc-status` | Show NanoClaw git status |
| `ws-save "msg"` | Commit all workspace changes and push to GitHub |
| `ws-status` | Show workspace git status |
| `ws-pull` | Pull workspace from GitHub |

## Standard Workflows

### Pull a NanoClaw update

```bash
nc-update
```

### Save workspace changes (memory, persona, bot files, docs)

```bash
ws-save "describe what changed"
```

### Check what's uncommitted in the workspace

```bash
ws-status
```

## What Lives in the Workspace Repo

| File/Folder | What it is |
|-------------|-----------|
| `groups/main/CLAUDE.md` | Agent persona and instructions |
| `groups/main/IDENTITY.md` / `MEMORY.md` / `SOUL.md` / `USER.md` | Agent memory files |
| `groups/main/docs/` | Documentation (including this file) |
| `groups/main/telegram-bot*.js` | Telegram bot source |
| `groups/main/ecosystem.config.js` | PM2 config (API keys redacted — stored in `.telegram/.env`) |
| `groups/main/package.json` | Telegram bot dependencies |
| `groups/global/CLAUDE.md` | Global memory for all groups |
| `scripts/watch-claude-md.sh` | File watcher for auto-committing CLAUDE.md |
| `scripts/nanoclaw-claude-sync.service` | Systemd service for the watcher |
| `.bash_aliases` | Shell shortcuts |
| `install.sh` | Restore script for fresh setup |

**Not tracked** (gitignored): `node_modules/`, `conversations/`, `logs/`, `.env`, API keys.

## Fresh Setup / Restore

```bash
git clone https://github.com/qwibitai/nanoclaw ~/nanoclaw
git clone git@github.com:wientjes/gforce-nanoclaw-workspace ~/gforce-nanoclaw-workspace
cd ~/gforce-nanoclaw-workspace && ./install.sh
cd ~/nanoclaw/groups/main && npm install
```

Then re-authenticate WhatsApp and Telegram.
