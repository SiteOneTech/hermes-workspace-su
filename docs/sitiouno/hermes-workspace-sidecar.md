# Hermes Workspace Sidecar for Zeus

Created: 20260510T174957Z
Host: hermes-agent-01
Parent fork: https://github.com/SiteOneTech/hermes-agent
Workspace upstream: https://github.com/outsourc-e/hermes-workspace
Maintained fork: https://github.com/SiteOneTech/hermes-workspace-su
Workspace upstream commit: 372b18a8e4e3fa7947ff3cf5651865560daca0a1
Runtime folder: /home/hermes/.hermes/hermes-workspace-su

## Purpose

This is a reversible, loopback-only UI sidecar for testing Hermes Workspace against the existing Zeus/Hermes runtime. It does not replace Hermes Agent and must not be treated as the source of truth for Zeus itself.

## What Changed

- Added a clean SiteOneTech/hermes-workspace-su checkout at /home/hermes/.hermes/hermes-workspace-su for the maintained UI fork.
- The original SiteOneTech/hermes-agent sidecar checkout remains as an installation history/rollback source.
- Built Hermes Workspace with HermesWorld navigation disabled by VITE_HERMESWORLD_ENABLED=0.
- Added /home/hermes/.config/hermes-workspace-sidecar.env for sidecar-only runtime settings.
- Updated /etc/systemd/system/hermes-workspace-sidecar.service to run the UI from /home/hermes/.hermes/hermes-workspace-su.
- Enabled the existing Hermes API server on 127.0.0.1:8642 by adding API_SERVER_ENABLED/API_SERVER_HOST/API_SERVER_PORT to /home/hermes/.hermes/.env.
- Added sidecar-only profile identity metadata so the default profile can display as Zeus and use a custom avatar without renaming the runtime profile id.



## SitioUno Fork Workflow

The maintained UI fork is `https://github.com/SiteOneTech/hermes-workspace-su`. The VM sidecar is kept in sync from the fork after local validation. UI customizations should land in that fork first, then be pulled or rebuilt on Zeus.

## Profile Identity

The default profile id remains `default` because Hermes Workspace reserves it for runtime compatibility. The sidecar adds visual identity metadata only:

- Default identity file: `/home/hermes/.hermes/.hermes-workspace-profile.json`
- Supported fields: `displayName` and `avatarDataUrl`
- Current default display name: `Zeus`
- This does not change Hermes memory, agent config, provider config, MCP settings, or the active profile id.
- In the UI, open Profiles and use the `Identity` button on the default profile card to edit the display name or avatar.

To revert the visual identity only:

```bash
rm -f /home/hermes/.hermes/.hermes-workspace-profile.json
sudo systemctl restart hermes-workspace-sidecar.service
```

## Network Boundary

- Workspace binds to 127.0.0.1:3002 and Tailscale 100.90.65.123:3002 on hermes-agent-01.
- Hermes API binds to 127.0.0.1:8642 only on hermes-agent-01.
- Access is available through the SSH/IAP local tunnel from the operator machine or through Tailscale VPN at http://100.90.65.123:3002.
- No Cloudflare public ingress or Tailscale Serve/Funnel is configured by this sidecar.
- HermesWorld is disabled with VITE_HERMESWORLD_ENABLED=0.
- HermesWorld routes/APIs/assets are blocked at server-entry.js when disabled.
- HermesWorld navigation entries are hidden when VITE_HERMESWORLD_ENABLED=0.
- HermesWorld React routes also render an internal 404 when VITE_HERMESWORLD_ENABLED=0, so client-side SPA navigation cannot open the game surface.
- The existing Hermes dashboard on 9119 was not changed by this sidecar.


## Memory And Knowledge Alignment

Hermes Workspace now resolves the default local Knowledge root to `/home/hermes/.hermes/knowledge` on Zeus. That folder is UI-facing metadata and links, not a replacement for runtime memory providers.

Current Zeus alignment:

- Memory tab reads `/home/hermes/.hermes/MEMORY.md`, `/home/hermes/.hermes/memory/`, and `/home/hermes/.hermes/memories/`.
- Knowledge tab reads `/home/hermes/.hermes/knowledge` through `/home/hermes/.hermes/knowledge-config.json`.
- `/home/hermes/.hermes/knowledge/MEMORY-MAP.md` indexes the visible local memory map.
- `/home/hermes/.hermes/knowledge/llm-wiki` points to `/home/hermes/.hermes/skills/research/llm-wiki`.
- `/home/hermes/.hermes/knowledge/honcho-plugin` points to the Honcho memory plugin documentation.
- `/home/hermes/.hermes/knowledge/honcho-skill` points to the Honcho autonomous-agent skill documentation.

Honcho live conversational memory remains provider-backed; it is not copied into markdown by this UI alignment.

## Runtime URLs

- HERMES_API_URL=http://127.0.0.1:8642
- HERMES_DASHBOARD_URL=http://127.0.0.1:9119
- UI via operator tunnel: http://127.0.0.1:3002
- UI via Tailscale VPN: http://100.90.65.123:3002

## Authentication

Tailscale access is protected by HERMES_PASSWORD in /home/hermes/.config/hermes-workspace-sidecar.env. COOKIE_SECURE=0 is set because this is plain HTTP over the private Tailscale network.

## Services

Remote VM:

```bash
sudo systemctl status hermes-workspace-sidecar.service
sudo journalctl -u hermes-workspace-sidecar.service -n 80 --no-pager
```

Operator workstation tunnel:

```bash
systemctl --user status hermes-workspace-3002-tunnel.service
```

The operator tunnel unit lives at:

```text
/home/jean/.config/systemd/user/hermes-workspace-3002-tunnel.service
```

## Health Checks

Remote VM:

```bash
curl -fsS http://127.0.0.1:8642/health
curl -fsS http://127.0.0.1:3002/ >/tmp/hermes-workspace.html
curl -fsS http://100.90.65.123:3002/ >/tmp/hermes-workspace-tailscale.html
curl -fsS http://100.90.65.123:3002/api/auth-check
curl -sS -o /tmp/hermesworld-disabled.txt -w '%{http_code}\n' http://127.0.0.1:3002/hermes-world
ss -tlnp | grep -E ':(3002|8642|9119) '
```

Operator workstation:

```bash
curl -fsS http://127.0.0.1:3002/ >/tmp/hermes-workspace-local.html
```

## Rollback

1. Stop the operator tunnel:

   ```bash
   systemctl --user disable --now hermes-workspace-3002-tunnel.service
   rm -f /home/jean/.config/systemd/user/hermes-workspace-3002-tunnel.service
   systemctl --user daemon-reload
   ```

2. To remove Tailscale browser access but keep the local sidecar, delete EXTRA_BIND_HOSTS, HERMES_PASSWORD, and COOKIE_SECURE from /home/hermes/.config/hermes-workspace-sidecar.env, then run sudo systemctl restart hermes-workspace-sidecar.service.

3. Stop the remote UI sidecar:

   ```bash
   sudo systemctl disable --now hermes-workspace-sidecar.service
   sudo rm -f /etc/systemd/system/hermes-workspace-sidecar.service
   sudo systemctl daemon-reload
   rm -f /home/hermes/.config/hermes-workspace-sidecar.env
   ```

4. Restore the Hermes env backup if you want to remove the loopback API server addition:

   ```bash
   cp /home/hermes/.hermes/backups/hermes-workspace-sidecar-20260510T174957Z/.env.before-api-server /home/hermes/.hermes/.env
   env XDG_RUNTIME_DIR=/run/user/1001 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1001/bus systemctl --user restart hermes-gateway.service
   ```

5. Remove the sidecar checkout if no longer needed:

   ```bash
   rm -rf /home/hermes/.hermes/hermes-workspace-su
   ```

6. Restore any other backups from:

   ```text
   /home/hermes/.hermes/backups/hermes-workspace-sidecar-20260510T174957Z
   ```

## Notes

Backups were taken before sidecar setup. Secrets are not copied into this documentation.
