---
slug: gearbox
label: "Gearbox"
type: protocol
image: "/img/integrations/gearbox.svg"
tagline: "Gearbox passive pools and rewards on Ethereum, Arbitrum, and Optimism"
intro: "rotki decodes the passive side of Gearbox: pool deposits and withdrawals (with the matching pool/farming token recognised as the wrapped position) and Gearbox reward claims."
metaDescription: "rotki decodes the passive side of Gearbox: pool deposits and withdrawals (with the matching pool/farming token recognised as the wrapped position) and Gearbox"
keywords: "gearbox portfolio tracker, gearbox passive pool, gearbox rewards, gearbox arbitrum, gearbox optimism"
features:
  - "Pool deposits decoded as deposit-for-wrapped events with the matching pool LP or farming token tagged as the received wrapped position."
  - "Pool withdrawals decoded as redeem-wrapped events, including pools where there is no separate farming token (just the pool token and the underlying asset)."
  - "Reward claims from Gearbox farming/staking contracts tagged as reward receive events against the Gearbox counterparty."
  - "Decoded on every chain Gearbox currently runs on: Ethereum, Arbitrum One, and Optimism."
  - "Gearbox balances (open passive pool and farming positions) queried on demand and included in your portfolio."
limitations:
  - "Gearbox decoding covers the passive side (pool deposits/withdrawals and rewards). Credit account / leveraged-credit-line interactions are not decoded as Gearbox-counterparty events."
setup:
  - "In rotki, add the addresses you use with Gearbox on Ethereum, Arbitrum One, and/or Optimism."
  - "In rotki, open History and let the initial sync run. Gearbox pool deposits, withdrawals, and reward claims are decoded automatically."
  - "If you've just opened a brand-new Gearbox position, you can refresh the Gearbox cache via Settings → Manage Data → Refresh protocol data (select Gearbox)."
faq:
  - q: "Are Gearbox reward claims tagged?"
    a: "Yes. Reward claims via Gearbox farming/staking contracts are tagged as reward receives against the Gearbox counterparty on every supported chain."
  - q: "Are Gearbox credit accounts decoded?"
    a: "Not currently. Only the passive side (pool deposits, withdrawals, and rewards) is decoded as Gearbox-counterparty activity; credit-account interactions appear as ordinary token movements."
  - q: "Does rotki read Gearbox activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
