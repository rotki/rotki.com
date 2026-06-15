---
slug: locked-gno
label: "Locked GNO"
type: protocol
image: "/img/integrations/gnosis.svg"
tagline: "Locked GNO deposits and unlocks on Ethereum, decoded locally"
intro: "rotki decodes the GNO you deposit into the Ethereum locking contract used to run Gnosis Chain validators, plus the GNO you receive back when you unlock. You choose which Ethereum RPC endpoint handles the queries."
metaDescription: "rotki decodes the GNO you deposit into the Ethereum locking contract used to run Gnosis Chain validators, plus the GNO you receive back when you unlock."
keywords: "locked gno tracker, gno validator deposit, gnosis chain staking, gno locking"
features:
  - "GNO deposits into the locking contract decoded as protocol events."
  - "GNO returned from the locking contract (unlock) recognised."
setup:
  - "In rotki, add your Ethereum address (the locking contract is on Ethereum)."
  - "Open History and let the initial sync run. Locked GNO events are decoded automatically."
faq:
  - q: "Which Ethereum RPC does rotki use for Locked GNO activity?"
    a: "rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
