---
slug: shapeshift
label: "ShapeShift"
type: exchange
image: "/img/integrations/shapeshift.svg"
tagline: "ShapeShift non-custodial swaps from CSV, processed locally"
intro: "Import your ShapeShift swap history into rotki via CSV. ShapeShift went fully non-custodial in 2021 and operates as a DEX aggregator; rotki recognises the trades and reconciles them with the rest of your wallet activity. CSV files are processed on your machine."
metaDescription: "Import your ShapeShift swap history into rotki via CSV. ShapeShift went fully non-custodial in 2021 and operates as a DEX aggregator; rotki recognises the"
keywords: "shapeshift portfolio tracker, shapeshift tax report, shapeshift swap history, non-custodial swap tracker"
features:
  - "CSV import of ShapeShift trade and swap history exports."
  - "Swaps imported with matched spend and receive sides for tax accounting."
  - "Integrates with the rest of your portfolio so the swaps flow into your PnL."
setup:
  - "Export your ShapeShift history from app.shapeshift.com → Transaction History."
  - "In rotki, open Import Data and select your ShapeShift file."
faq:
  - q: "Is ShapeShift custodial?"
    a: "No. ShapeShift went fully non-custodial in 2021. It now operates as a DEX aggregator; you keep custody of your own wallet."
  - q: "Does my ShapeShift data leave my machine?"
    a: "No. CSV imports are parsed entirely on your computer; the file never leaves your machine."
screenshots: []
ctaPlan: free
---
