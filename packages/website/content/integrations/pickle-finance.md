---
slug: pickle-finance
label: "Pickle Finance"
type: protocol
image: "/img/integrations/pickle.svg"
tagline: "Pickle Finance jar deposits and withdrawals, decoded locally"
intro: "rotki decodes Pickle Finance jar deposits and withdrawals, and recognises the Cornichon hack-compensation airdrop claim. You choose which Ethereum RPC endpoint handles the queries."
keywords: "pickle finance portfolio tracker, pickle jar tracker, pickle defi tax"
features:
  - "Pickle jar deposits and withdrawals decoded as protocol events."
  - "Cornichon (CORN) hack-compensation airdrop claim recognised."
setup:
  - "In rotki, add your Ethereum address. Pickle activity is detected automatically."
  - "Open History and let the initial sync run. Pickle events are decoded automatically."
faq:
  - q: "Which Ethereum RPC does rotki use for Pickle activity?"
    a: "rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
