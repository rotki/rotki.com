---
slug: account-delegation
label: "Account Delegation (EIP-7702)"
type: protocol
image: "/img/integrations/account_delegation.svg"
tagline: "Account Delegation tracker - EIP-7702 set-code activity, decoded"
intro: "rotki decodes EIP-7702 account-delegation events - when an EOA delegates its code to a smart-contract implementation - so your wallet's set-code state and its consequences are visible in your event history. Processing is local; your addresses and delegations stay on your computer."
metaDescription: "rotki decodes EIP-7702 account-delegation events - when an EOA delegates its code to a smart-contract implementation - so your wallet's set-code state and its"
keywords: "eip-7702 tracker, account delegation tracker, set code authorization, smart eoa tracker"
features:
  - "EIP-7702 set-code (delegation) events decoded as protocol events."
  - "Delegation revocations recognised."
setup:
  - "In rotki, add your address under any EVM chain where you've authorised an EIP-7702 delegation (Ethereum and any other chain that supports type-4 transactions)."
  - "Open History → wait for the initial sync to complete. Delegation events appear once your transactions are decoded."
faq:
  - q: "What is EIP-7702?"
    a: "EIP-7702 lets a regular EOA (externally-owned account) authorise its address to behave like a smart contract for a single transaction. rotki decodes those authorisations so the resulting behaviour is interpretable."
  - q: "Do my delegations leave my machine?"
    a: "No. rotki reads activity from the EVM RPCs you configure directly from your computer."
screenshots: []
ctaPlan: free
---
