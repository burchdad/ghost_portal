# Permissions

Ghost Portal has three separate layers:

1. Role authorization: broad abilities such as `users:manage` or `reports:submit`.
2. Record-level authorization: explicit assignments such as `ClientAccess` and `LeadAccess`.
3. UI visibility: navigation and buttons are hidden when unavailable, but this is never the security boundary.

Founder bypasses normal record-level restrictions. Operations users need explicit assignments for clients and leads.

Server helpers:

- `requireUser`
- `requireRole`
- `requirePermission`
- `can`
- `canAccessClient`
- `canAccessLead`
- `canModifyTask`
- `minimizeClientForUser`
- `minimizeLeadForUser`
