# NanoClaw Git Workflow

## Repository Structure

| Remote | URL | Purpose |
|--------|-----|---------|
| `origin` | `https://github.com/qwibitai/nanoclaw` | Upstream NanoClaw (read-only, pull only) |
| `gforce` | `git@github.com:wientjes/gforce-nanoclaw.git` | Personal fork (config, customizations) |

**Branch:** `main` on both remotes.

## How It Works

Local `main` = upstream commits + your customization commits rebased on top.

```
origin/main:  A - B - C - D - E   (upstream)
local/main:   A - B - C - D - E - [your commits]
gforce/main:  A - B - C - D - E - [your commits]  (mirrors local)
```

When upstream gets new commits, rebase replays your customizations on top of them.

## Shortcuts

Load these by sourcing `~/.bash_aliases` (done automatically in new shells).

| Command | What it does |
|---------|--------------|
| `nc-pull` | Pull upstream changes, rebase local commits on top |
| `nc-push` | Force-push rebased history to personal fork |
| `nc-sync` | Both of the above in sequence |
| `nc-status` | Show what's ahead/behind on each remote |

## Standard Workflow

### Pulling upstream updates

```bash
nc-sync
```

This runs `git pull --rebase origin main` then `git push --force gforce main`.

The force push to `gforce` is always required after a rebase because rebasing rewrites commit hashes — this is expected and safe for a personal fork.

### Committing local changes

```bash
cd ~/nanoclaw
git add <files>
git commit -m "description"
nc-push       # save to personal fork
```

### Checking status

```bash
nc-status
```

## What Lives Where

**Commit to local + push to `gforce`:**
- `groups/*/CLAUDE.md` — per-group memory and context
- `groups/*/docs/` — documentation like this file
- Custom scripts (e.g., auto-sync watcher, systemd services)
- Any local integrations or channel additions

**Never commit:**
- `data/` — SQLite databases, runtime state
- `.wwebjs_auth/` — WhatsApp session credentials
- `.env` — API keys and secrets

## Recovery

If the rebase produces conflicts:

```bash
git -C ~/nanoclaw rebase --abort    # undo and get back to where you were
```

Then resolve by rebasing interactively or merging instead:

```bash
git -C ~/nanoclaw pull --no-rebase origin main   # merge instead of rebase
```
