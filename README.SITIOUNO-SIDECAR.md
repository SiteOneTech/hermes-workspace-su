# SitioUno Zeus Sidecar Notes

This folder is a vendored copy of Hermes Workspace for local testing on Zeus.

- Source: https://github.com/outsourc-e/hermes-workspace
- Maintained fork: https://github.com/SiteOneTech/hermes-workspace-su
- Source commit: 372b18a8e4e3fa7947ff3cf5651865560daca0a1
- Installed as the active fork checkout at /home/hermes/.hermes/hermes-workspace-su.
- Remote bind targets: 127.0.0.1:3002 and Tailscale 100.90.65.123:3002
- API target: http://127.0.0.1:8642
- Dashboard fallback target: http://127.0.0.1:9119
- HermesWorld: disabled via VITE_HERMESWORLD_ENABLED=0 and blocked by server-entry.js route guard
- Remote service: hermes-workspace-sidecar.service, running from /home/hermes/.hermes/hermes-workspace-su
- VPN access: http://100.90.65.123:3002, protected by HERMES_PASSWORD in /home/hermes/.config/hermes-workspace-sidecar.env
- Operator tunnel service: hermes-workspace-3002-tunnel.service
- Default profile visual identity: stored in /home/hermes/.hermes/.hermes-workspace-profile.json; currently displays as Zeus while runtime id stays default

Do not store secrets in this folder. Local runtime configuration lives in /home/hermes/.config/hermes-workspace-sidecar.env.

Profile identity is UI metadata only. It does not rename the default runtime profile and does not change Hermes memory, agent behavior, provider settings, MCP routing, or infrastructure access.

Zeus UI customizations in this fork:

- Default profile can keep runtime id `default` while displaying as `Zeus` with editable avatar metadata.
- HermesWorld navigation is hidden when `VITE_HERMESWORLD_ENABLED=0` and the server route guard blocks the surface.
- Mobile hamburger navigation includes Kanban (`/tasks`) to match the desktop sidebar.
- Knowledge defaults to `/home/hermes/.hermes/knowledge`, where Zeus links LLM Wiki and Honcho documentation into the Knowledge tab.
