---
slug: ftx
label: "FTX"
type: exchange
image: "/img/integrations/ftx.svg"
tagline: "FTX recognised as a historical location only"
intro: "FTX collapsed in November 2022 and rotki no longer ships an FTX API connector or a dedicated FTX CSV importer. FTX is still recognised as a historical location enum, so events can be tagged against it, but you need to bring those events into rotki yourself."
keywords: "ftx historical records, ftx tax report, ftx bankruptcy claim records"
features:
  - "FTX is preserved as a historical location. History events you add manually (or import via rotki's generic CSV) can be tagged as FTX so they group with the rest of your FTX activity."
limitations:
  - "There is no FTX exchange connector; the FTX API is unreachable and rotki has removed it."
  - "There is no dedicated FTX CSV importer. If you have FTX history saved from before the shutdown, format it into rotki's own generic CSV import (generic trades or generic events) or add the events manually."
setup:
  - "Recover or export your FTX history (from records saved before the shutdown, or via the bankruptcy claim portal)."
  - "Format those records into rotki's generic CSV import, or add the events manually as FTX-tagged history events."
  - "In rotki, open Import Data and select the rotki generic trades or generic events importer."
faq:
  - q: "Can I add my FTX API key to rotki?"
    a: "No. The FTX API is unreachable. FTX appears only as a historical location."
  - q: "Does rotki have a direct FTX CSV importer?"
    a: "No. Format your FTX history into rotki's generic CSV import (generic trades or generic events), or add the events manually."
screenshots: []
ctaPlan: free
---
