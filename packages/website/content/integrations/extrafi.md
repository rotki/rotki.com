---
slug: extrafi
label: "Extrafi"
type: protocol
image: "/img/integrations/extrafi.svg"
tagline: "Leveraged-yield farms and lending pools on Optimism and Base, decoded"
intro: "rotki decodes Extrafi activity on Optimism and Base: lending pool deposits and withdrawals, pool reward claims, and leveraged farm positions (where Extrafi borrows on your behalf to amplify the LP)."
keywords: "extrafi portfolio tracker, extrafi vault tracker, leveraged yield optimism, leveraged yield base, extrafi farm tracker"
features:
  - "Lending pool deposits and withdrawals tagged against the Extrafi counterparty with the pool surfaced in the notes."
  - "Pool reward claims (REWARD_PAID events) tagged as reward-subtype receives against Extrafi."
  - "Farm position openings decoded into separate borrow and deposit events when Extrafi takes leverage on your behalf, so the borrowed portion is visible in your history."
  - "Partial farm-position closes decoded with the farm pair (token0-token1) named in the notes."
  - "Extrafi balances (open lending-pool positions and farm positions) queried on demand and included in your portfolio."
limitations:
  - "Extrafi decoding currently ships on Optimism and Base only."
setup:
  - "In rotki, add the Optimism and/or Base address you use with Extrafi."
  - "In rotki, open History and let the initial sync run. Pool deposits, withdrawals, reward claims, and farm open/close events are decoded automatically."
faq:
  - q: "Are Extrafi reward claims tagged?"
    a: "Yes. REWARD_PAID events on Extrafi pools are tagged as reward-subtype receives against the Extrafi counterparty, so they don't appear as anonymous token receives."
  - q: "Are leveraged farm borrows visible?"
    a: "Yes. When you open a leveraged farm position, the borrowed amount is decoded as a separate borrow event in the same transaction as the deposit, so your borrowed exposure is visible."
  - q: "Does rotki read Extrafi activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
