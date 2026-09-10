# Frontend security hardening

This branch hardens high-risk DOM rendering paths without changing backend APIs or authentication/session semantics.

## Included
- Sanitizes rendered Markdown before it reaches `innerHTML`.
- Rebuilds chat-session history with DOM APIs and `textContent` instead of interpolated HTML/inline handlers.
- Renders dynamic image-loading labels with `textContent`.
- Escapes dynamic backoffice user/team text before template rendering.

## Intentionally deferred
- Moving JWT/crypto material away from `localStorage` requires an authentication/session migration and backend coordination.
- Server-side file signature/MIME verification must be enforced by the upload endpoint.

Base commit: `8e3bdcc7c852bdd096cb2ff7f0c554d222c4d5b6`.
