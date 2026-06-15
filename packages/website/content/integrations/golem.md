---
slug: golem
label: "Golem"
type: protocol
image: "/img/integrations/golem.svg"
tagline: "GNT to GLM token migration, decoded"
intro: "rotki decodes the legacy Golem GNT → GLM migration on Ethereum. The migration contract doesn't emit a GNT transfer event, so rotki synthesises the GNT spend, links it to the GLM receive, and tags both as a single migrate pair against the Golem counterparty."
metaDescription: "rotki decodes the legacy Golem GNT → GLM migration on Ethereum."
keywords: "golem portfolio tracker, glm token, gnt to glm migration, golem network"
features:
  - "GNT → GLM migrations are decoded into a paired event: the synthesised GNT spend (event type MIGRATE/SPEND) and the matching GLM receive (event type MIGRATE/RECEIVE), both tagged against the Golem counterparty."
  - "Because the migration contract emits no GNT transfer event, the GNT spend wouldn't otherwise show up in your history; rotki adds it so the swap is visible and not just a one-sided GLM receive."
limitations:
  - "Golem-specific decoding is limited to the GNT → GLM migration. Other GLM activity (transfers, payments to providers/requestors on Golem Network, etc.) appears as ordinary ERC-20 events."
setup:
  - "In rotki, add the Ethereum address that performed the migration (or holds GLM)."
  - "In rotki, open History and let the initial sync run. The GNT → GLM migration pair is decoded automatically; ordinary GLM transfers appear as standard ERC-20 events."
faq:
  - q: "Are GNT → GLM migrations decoded?"
    a: "Yes. Both legs (GNT spend and GLM receive) are linked and tagged as a migrate pair against the Golem counterparty."
  - q: "Does rotki read Golem activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
