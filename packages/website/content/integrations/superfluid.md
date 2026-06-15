---
slug: superfluid
label: "Superfluid"
type: protocol
image: "/img/integrations/superfluid.svg"
tagline: "Superfluid streams and super tokens, decoded locally"
intro: "rotki decodes Superfluid money streams and super-token wrapping on rotki's supported EVM chains. You choose which RPC endpoint handles the queries."
metaDescription: "rotki decodes Superfluid money streams and super-token wrapping on rotki's supported EVM chains. You choose which RPC endpoint handles the queries."
keywords: "superfluid portfolio tracker, superfluid streaming, super token tracker, superfluid defi tax"
features:
  - "Superfluid streams decoded: start and stop events labelled with the monthly flow rate, sender, and receiver."
  - "Super-token upgrades (wrapping) and downgrades (unwrapping) decoded."
setup:
  - "In rotki, add your address under a chain where you use Superfluid."
  - "Open History and let the initial sync run. Superfluid events are decoded automatically."
faq:
  - q: "Which RPC does rotki use for Superfluid activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
