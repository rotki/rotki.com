---
slug: octant
label: "Octant"
type: protocol
image: "/img/integrations/octant.svg"
tagline: "Octant GLM locking and epoch rewards, decoded locally"
intro: "rotki decodes Octant GLM locking and unlocking, and your Octant epoch reward claims. You choose which Ethereum RPC endpoint handles the queries."
keywords: "octant portfolio tracker, glm staking tracker, octant epoch rewards, public goods funding"
features:
  - "GLM locking and unlocking in Octant decoded as protocol events."
  - "Octant epoch reward claims (paid in ETH) decoded as income."
setup:
  - "In rotki, add your Ethereum address."
  - "Open History and let the initial sync run. Octant events are decoded automatically."
faq:
  - q: "Which Ethereum RPC does rotki use for Octant activity?"
    a: "rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Are Octant rewards taxable income?"
    a: "rotki decodes your epoch reward claims as income events. Talk to a tax professional about your specific jurisdiction."
screenshots: []
ctaPlan: free
---
