---
slug: makerdao
label: "MakerDAO"
type: protocol
image: "/img/integrations/makerdao.svg"
tagline: "MakerDAO vaults, DSR, and the Sky migration, decoded locally"
intro: "rotki decodes MakerDAO vaults (CDPs), DAI Savings Rate (DSR) deposits, and the MKR-to-SKY and DAI-to-USDS migrations into the Sky protocol. You choose which Ethereum RPC endpoint handles the queries."
metaDescription: "rotki decodes MakerDAO vaults (CDPs), DAI Savings Rate (DSR) deposits, and the MKR-to-SKY and DAI-to-USDS migrations into the Sky protocol."
keywords: "makerdao portfolio tracker, dai vault tracker, maker cdp tracker, dsr tracker, sky migration tracker, mkr to sky"
features:
  - "Vault (CDP) collateral deposits, withdrawals, and debt payback decoded as protocol events."
  - "Collateral types read generically from each vault's ilk, so new collaterals are picked up as long as the vault ABI is unchanged."
  - "DAI Savings Rate (DSR) deposits and withdrawals tracked."
  - "Vault collateralization ratio computed from your locked collateral and outstanding debt."
  - "Sky migration transactions (MKR to SKY, DAI to USDS) decoded under the Sky counterparty."
  - "Vault debt shown as a liability in dashboard balances."
setup:
  - "In rotki, add your Ethereum address. MakerDAO positions are detected automatically."
  - "Optional: refresh MakerDAO data under Settings → Manage Data → Refresh protocol data."
  - "Open History and let the initial sync run. MakerDAO events are decoded automatically."
faq:
  - q: "Which Ethereum RPC does rotki use for MakerDAO activity?"
    a: "rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Is the Sky migration supported?"
    a: "Yes. MKR-to-SKY and DAI-to-USDS migrations are decoded so your balances reconcile across the rebrand."
  - q: "Are new collateral types tracked?"
    a: "Yes. rotki reads the collateral type from each vault's ilk, so new collaterals are picked up as long as the vault ABI is unchanged."
screenshots: []
ctaPlan: free
---
