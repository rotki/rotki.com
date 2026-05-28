---
slug: ftx
label: "FTX"
type: exchange
image: "/img/integrations/ftx.svg"
tagline: "FTX recognised as a historical location only"
intro: "FTX collapsed in November 2022 and rotki no longer ships an FTX API connector or a dedicated FTX CSV importer. FTX is still recognised as a historical location enum, so events can be tagged against it, but you need to bring those events into rotki yourself."
keywords: "ftx historical records, ftx tax report, ftx bankruptcy claim records"
features:
  - "FTX is preserved as a historical location. History events you add manually (or that arrive via an aggregator export) can be tagged as FTX so they group with the rest of your FTX activity."
limitations:
  - "There is no FTX exchange connector; the FTX API is unreachable and rotki has removed it."
  - "There is no dedicated FTX CSV importer. If you have FTX history saved from before the shutdown, you need to import it via a portfolio-aggregator importer that rotki supports (e.g. CoinTracking, Blockpit, Cointracker, CoinLedger) or add the events manually."
setup:
  - "Recover or export your FTX history (from records saved before the shutdown, or via the bankruptcy claim portal)."
  - "Bring those records into a portfolio-aggregator CSV that rotki supports, or add the events manually as FTX-tagged history events."
  - "In rotki, open Import Data and select the matching importer for the CSV format you have."
faq:
  - q: "Can I add my FTX API key to rotki?"
    a: "No. The FTX API is unreachable. FTX appears only as a historical location."
  - q: "Does rotki have a direct FTX CSV importer?"
    a: "No. Use a supported aggregator importer (CoinTracking, Blockpit, Cointracker, CoinLedger) that includes your FTX history, or add events manually."
screenshots: []
ctaPlan: free
---
