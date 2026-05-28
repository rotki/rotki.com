---
slug: digixdao
label: "DigixDAO"
type: protocol
image: "/img/integrations/digixdao.jpg"
tagline: "DGD-for-ETH refund events from the 2020 DigixDAO wind-down, decoded"
intro: "DigixDAO voted to dissolve in 2020 and refunded its treasury to DGD holders. rotki decodes the DGD burn and the paired ETH refund from the dissolution contract so the wind-down shows up cleanly in your history."
keywords: "digixdao historical records, dgd refund, digixdao dissolution, dgd tax"
features:
  - "DGD sent to the DigixDAO refund contract is tagged as a burn against the DigixDAO counterparty."
  - "ETH received from the refund contract is tagged as a refund against the DigixDAO counterparty."
  - "The burn and the refund are linked in your history so the wind-down reads as a single event pair."
limitations:
  - "DigixDAO is dissolved; rotki supports it for historical accounting of the refund only. No new DigixDAO events exist."
setup:
  - "In rotki, add the Ethereum address that held DGD when you redeemed against the refund contract."
  - "In rotki, open History and let the initial sync run. The DGD burn and ETH refund pair is decoded automatically."
faq:
  - q: "Is DigixDAO still active?"
    a: "No. The DAO voted to dissolve in 2020 and DGD holders were refunded in ETH. rotki supports it for historical accounting only."
  - q: "Does rotki read DigixDAO activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
