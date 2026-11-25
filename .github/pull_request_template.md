Closes #(issue_number)

## What changed

## How it was checked

<!-- Pages opened, screen widths, backend used (none, local rotki-web, staging), and anything not checked. -->

## Checklist

- [ ] `pnpm lint` and `pnpm typecheck` pass (CI does not run typecheck)
- [ ] `pnpm test` passes
- [ ] Changed pages checked in the browser at 375, 768 and 1280 px, console clean
- [ ] For routing, data loading or config changes: `pnpm build`, `pnpm check:routes` and `pnpm test:e2e` pass
- [ ] No page path or query parameter used in e-mails changed (see README)
