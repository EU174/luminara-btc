# Luminara Claude router

The canonical AI-development map is [`docs/ai/README.md`](docs/ai/README.md).

Before editing:

1. Read that map completely.
2. Read the nearest `CONTEXT.md` for each affected directory.
3. Follow the linked security, testing, deployment, content, and workflow contracts.
4. Preserve unrelated dirty-tree changes; do not replace whole files when a narrow patch is sufficient.

GitHub Issues/Project are the source of truth for task status. `docs/ai/` is the source of truth for durable engineering contracts. `deliverables/` contains temporary transfer packages and must not override the current repository state.

After a verified task, use the [AI knowledge loop](docs/ai/KNOWLEDGE-LOOP.md) to preserve only reusable decisions, playbooks, and important regression lessons for later agents.

Never include secrets, tokens, private keys, database URLs, or raw personal identifiers in output packages or documentation.
