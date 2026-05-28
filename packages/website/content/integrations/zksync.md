---
slug: zksync
label: "ZKSync Bridge"
type: protocol
image: "/img/integrations/zksync.jpg"
tagline: "ZKSync bridge transfers, decoded locally"
intro: "rotki decodes ZKSync bridge deposits and ZKSync Lite batch withdrawals on the Ethereum side. For ZKSync Lite balances see the [ZKSync Lite](/integrations/zksync-lite) blockchain integration. You choose which RPC endpoint handles the queries."
keywords: "zksync bridge tracker, zksync lite withdrawal, l1 l2 zksync transfer"
features:
  - "ZKSync bridge deposits decoded on the Ethereum side."
  - "ZKSync Lite batch withdrawals decoded on the Ethereum side."
  - "Source and destination legs linked across L1 and L2."
setup:
  - "In rotki, add your address on Ethereum and ZKSync Lite."
  - "Open History and let the initial sync run. Bridge events are decoded automatically."
faq:
  - q: "Does this integration cover both ZKSync Lite and ZKSync Era?"
    a: "This page covers bridge events. For ZKSync Lite balance tracking, see the dedicated ZKSync Lite integration."
  - q: "Which RPC does rotki use for these events?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
