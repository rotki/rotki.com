---
slug: gnosisdao
label: "GnosisDAO"
type: protocol
image: "/img/integrations/gnosis.svg"
tagline: "GnosisDAO treasury redemption, decoded"
intro: "rotki decodes the GIP-151 GnosisDAO treasury redemption on Gnosis chain, turning your GNO deposit and the pro-rata claim you received back into a matched pair of readable events."
metaDescription: "rotki decodes the GIP-151 GnosisDAO treasury redemption on Gnosis chain into matched deposit and claim events."
keywords: "GnosisDAO portfolio tracker, GIP-151 redemption, GNO redemption tracker, GnosisDAO accounting, GnosisDAO tax"
features:
  - "Deposits into the GIP-151 redemption contract decoded as a deposit tagged with GnosisDAO."
  - "The pro-rata payout from the redemption distributor decoded as a claim, so it is not left as an unexplained incoming transfer."
  - "Both sides priced and carried into the profit and loss report with the rest of your Gnosis chain history."
limitations:
  - "This integration covers the one-time GIP-151 pro-rata treasury redemption. Other GnosisDAO governance activity, such as voting, is not decoded as a GnosisDAO-counterparty event."
setup:
  - "In rotki, open Blockchain Balances → Gnosis and add the address that took part in the redemption."
  - "Open History and let the transaction sync run. The deposit and the claim are decoded automatically."
faq:
  - q: "What exactly is decoded here?"
    a: "The GIP-151 one-time pro-rata treasury redemption: the GNO you deposited into the redemption contract and the payout you claimed from the distributor."
  - q: "Is GnosisDAO voting tracked?"
    a: "No. Governance votes are not decoded as GnosisDAO events. If a vote cost gas, the transaction still appears with its fee."
  - q: "Do I need anything beyond a Gnosis address?"
    a: "No. Add the address under Blockchain Balances → Gnosis and rotki reads the redemption transactions from the chain through the RPC endpoint you configure."
screenshots: []
ctaPlan: free
---
