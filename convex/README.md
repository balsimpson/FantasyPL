# Convex backend

This Nuxt app uses Convex for article drafts, research and writing jobs, homepage recommendation snapshots, manager share counters, and scheduler history and background submissions. Nuxt server handlers call the functions using server-side credentials; authorization must be checked for each private route.

- [Blog and article workflow](../BLOG_GROWTH_PLAN.md) covers storage, research, publishing, and its verification status.
- [Homepage plan](../HOMEPAGE_UX_PLAN.md) covers the daily recommendation job and its rules-based fallback.
- [Scheduler guide](../docs/instascheduler/AGENTS.md) covers scheduler history, Buffer integration, and safety boundaries.
- [Project agent guide](../AGENTS.md) covers the runtime, deployment rules, and document ownership.

Local schema and functions do not prove a deployment has them. Confirm the intended target and obtain explicit authorization before using commands that change a Convex deployment or its configuration. Keep service and provider credentials server-only.
