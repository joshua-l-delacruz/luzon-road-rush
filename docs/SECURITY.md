# Security and privacy design

## Data boundary

Luzon Road Rush is a static browser game. It does not provide accounts, accept uploads, process payments, call an application API, or collect analytics. The only persistent data is a bounded top-five scoreboard stored locally for each map.

## Browser controls

- A restrictive Content Security Policy allows same-origin scripts, styles, images, fonts, connections, and workers.
- Plugins and framed content are disabled.
- Base URL and form destinations are restricted to the same origin.
- Referrer behavior is limited to `strict-origin-when-cross-origin`.
- External game assets, trackers, advertisements, and remote fonts are not used.

## Supply chain

- Dependencies are locked in `package-lock.json`.
- GitHub Actions installs dependencies with `npm ci`.
- Automated tests and the TypeScript production build must pass before deployment.
- Dependabot checks npm and GitHub Actions dependencies.
- The deployment workflow uses least-privilege repository permissions.

## Limitations

GitHub Pages controls the HTTP response headers. The repository therefore publishes a CSP in HTML for browser enforcement. DNS and TLS are managed by Cloudflare and GitHub Pages for the custom hostname.

For private vulnerability reports, follow the root [security policy](../SECURITY.md).
