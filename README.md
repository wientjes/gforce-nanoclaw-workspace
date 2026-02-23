# GForceDawn — Personal NanoClaw Workspace

This is the personal workspace for **GForceDawn**, a self-hosted Claude assistant running on [NanoClaw](https://github.com/qwibitai/nanoclaw).

It contains the agent's memory and persona, Telegram bot code, setup scripts, and documentation needed to restore a full install from scratch.

---

## What is NanoClaw?

> My personal Claude assistant that runs securely in containers. Lightweight and built to be understood and customized for your own needs.

NanoClaw gives you a personal AI assistant in a codebase small enough to understand in 8 minutes. One process, a handful of files. Agents run in actual Linux containers with filesystem isolation — not behind permission checks.

```
WhatsApp (baileys) --> SQLite --> Polling loop --> Container (Claude Agent SDK) --> Response
```

**Why not just use an existing assistant platform?**
Most are 50+ modules, 8 config management files, 45+ dependencies — software you can't actually understand, with access to your life. NanoClaw is the same core functionality without the bloat. Security through OS isolation, not allowlists.

**Key properties:**
- Small enough to understand — have Claude Code walk you through it
- Agents sandboxed in Linux containers (Docker or Apple Container)
- Built for one user — fork it and make it yours
- AI-native — no install wizard, no dashboard, just ask Claude
- Skills over features — capabilities are added via `/skill` commands, not PRs

See the [NanoClaw README](https://github.com/qwibitai/nanoclaw) for full documentation, architecture details, and FAQ.

---

## This Repo

| Path | Contents |
|------|----------|
| `docs/` | Setup and workflow documentation |
| `groups/main/` | GForceDawn persona, memory, and Telegram bot code |
| `groups/global/` | Global memory shared across all groups |
| `scripts/` | Auto-sync watcher and systemd service |
| `.bash_aliases` | Shell shortcuts (`nc-update`, `ws-save`, etc.) |
| `install.sh` | Restore everything on a fresh machine |

Changes to this repo are automatically committed and pushed by a background watcher service (`nanoclaw-workspace-sync`).

---

## Docs

- [Git workflow & two-repo setup](docs/git-workflow.md)

---

## Fresh Setup

```bash
git clone https://github.com/qwibitai/nanoclaw ~/nanoclaw
git clone git@github.com:wientjes/gforce-nanoclaw-workspace ~/gforce-nanoclaw-workspace
cd ~/gforce-nanoclaw-workspace && ./install.sh
cd ~/nanoclaw/groups/main && npm install
```

Then re-authenticate WhatsApp and Telegram, and add API keys to `~/nanoclaw/groups/main/.telegram/.env`.
