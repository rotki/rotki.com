---
slug: kittenswap
label: "KittenSwap"
type: protocol
image: "/img/integrations/kittenswap.png"
tagline: "KittenSwap swaps on Hyperliquid, decoded"
intro: "rotki turns your KittenSwap activity on Hyperliquid into readable swap events, validating each pool against the KittenSwap factory so only genuine KittenSwap trades get tagged."
metaDescription: "rotki decodes KittenSwap swaps on Hyperliquid into readable trade events, validating each pool against the KittenSwap factory."
keywords: "KittenSwap portfolio tracker, Hyperliquid DEX tracker, KittenSwap accounting, KittenSwap tax"
features:
  - "KittenSwap swaps on Hyperliquid decoded as paired spend/receive trades rather than two loose token transfers."
  - "Pools are verified against the KittenSwap factory on first sight, so a look-alike pool emitting the same event is not mislabelled as KittenSwap."
  - "New pools are picked up automatically - there is no fixed pool list to wait on between releases."
limitations:
  - "Only swaps are decoded. Providing liquidity to KittenSwap is not decoded as a KittenSwap-counterparty event and no KittenSwap LP balance is queried."
  - "Verifying a pool requires an on-chain call to the factory the first time rotki sees it, so it depends on your Hyperliquid RPC endpoint being reachable."
setup:
  - "In rotki, open Blockchain Balances → Hyperliquid → Add address."
  - "Open History and let the transaction sync run. KittenSwap swaps are decoded automatically."
faq:
  - q: "Do I need to add new KittenSwap pools manually?"
    a: "No. rotki checks unknown pools against the KittenSwap factory the first time it sees them, so pools created after the release still decode correctly."
  - q: "Are my KittenSwap LP positions valued?"
    a: "Not currently. The integration covers swaps; liquidity provision is not decoded as a KittenSwap event, and LP token movements appear as ordinary transfers."
  - q: "Where do the Hyperliquid queries go?"
    a: "rotki runs locally and talks directly to the Hyperliquid RPC endpoint you configure - the public default, a third-party provider, or your own node. Nothing passes through a rotki-operated server."
screenshots: []
ctaPlan: free
---
