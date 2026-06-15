---
slug: merkl
label: "Merkl"
type: protocol
image: "/img/integrations/merkl_light.svg"
tagline: "Merkl incentive reward claims, decoded locally"
intro: "rotki decodes the reward claims you make from the Merkl distributor, including rewards routed through Merkl by other protocols such as Morpho. You choose which RPC endpoint handles the queries."
metaDescription: "rotki decodes the reward claims you make from the Merkl distributor, including rewards routed through Merkl by other protocols such as Morpho."
keywords: "merkl portfolio tracker, merkl rewards, angle merkl, morpho merkl rewards, defi incentive rewards"
features:
  - "Merkl reward claims decoded as income events with the Merkl counterparty."
  - "Because any claim from the Merkl distributor is decoded, rewards routed through Merkl by other protocols (for example Morpho) are captured too."
  - "Works on rotki's supported EVM chains where the Merkl distributor is used."
setup:
  - "In rotki, add the address(es) you use to claim Merkl rewards."
  - "Open History and let the initial sync run. Merkl claims are decoded automatically."
faq:
  - q: "Which RPC does rotki use for Merkl activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Are rewards from third-party protocols (for example Morpho) distributed via Merkl captured?"
    a: "Yes. rotki decodes any claim from the Merkl distributor, so rewards routed through Merkl are recognised as Merkl reward income."
screenshots: []
ctaPlan: free
---
