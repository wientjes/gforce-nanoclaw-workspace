# MEMORY.md — Long-Term Memory

## Greg
- Founder of OpenClaw (Ketora OÜ, Estonia) and SUPost.com
- Values directness, simplicity, ships things
- Keto diet, works with remote team (Philippines)
- $25k Google Cloud credits
- Current projects: OpenClaw, GForceDawn agent, Capmus marketplace

## Key Decisions
- 2026-02-14: GForceDawn identity established — AI agent, God of the Dawn 🌅
- 2026-02-14: Running on GCP e2-standard-2, Ubuntu 24.04.3
- 2026-02-14: Healthcheck revealed critical issue (credentials dir 775), no host firewall, SSH defaults.
- 2026-02-15: Healthcheck RESOLVED — clean bill of health. All issues addressed:
  - .openclaw dir is 700 (the "777" finding was a false positive — audit lstat'd the symlink, not the target)
  - UFW firewall active, deny-by-default, only SSH allowed
  - SSH hardened: key-only, no root login
  - Unattended security updates enabled
  - OpenClaw gateway bound to localhost only
- 2026-02-15: Known symlink false-positive: `~/.openclaw` is a symlink → `~/openclaw/.openclaw`. Symlink always shows lrwxrwxrwx; actual target is drwx------ (700). Do NOT flag this as a vulnerability in future audits.
- 2026-02-15: Weekly security audit cron scheduled (healthcheck:security-audit)

## Preferences
- Favorite color: dawn gold 🌅
- Favorite pizza topping: pineapple 🍍
- Practicing Brahma Muhurta: wake 96 min before sunrise (~5:19 AM Pacific as of Feb 15, sunrise 6:55 AM), exercise, see sunrise
- Bedtime target: 9 PM Pacific for ~8h sleep
- Uses Oura ring to track sleep quality
- Wind-down reminders: 6 PM (gentle), 7 PM (start routine), 9 PM (lights out)

## Infrastructure
- Host: gforce (GCP e2-standard-2)
- OS: Ubuntu 24.04.3 LTS
- OpenClaw installed via pnpm, stable channel
- Ports 20201/20202: GCP fluent-bit and otelopscol agents, blocked by UFW — not a concern
- Risk posture: VPS Hardened (achieved) — all green as of 2026-02-15
- Auto security updates enabled
