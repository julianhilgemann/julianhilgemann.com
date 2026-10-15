# I build the systems between a measurement and a decision.

Data platform engineer in Munich. Specialized in scalable BI Solutions.

Projects

## Now building

In active development

### FX Macro Data Platform

A data platform for macroeconomic and FX time series, built so that every number can be traced back to what was knowable at the moment it was published.

Macro data gets revised. A GDP print or an inflation reading is published, then corrected — sometimes more than once, sometimes quietly. Keep only the latest value and you lose the version that mattered for a backtest, a research note or an audit. So the platform keeps every vintage: provider responses are stored untouched, and the warehouse records both the period a value describes and the day it became known.

- Raw data is immutable

- Every revision becomes a new vintage

- The warehouse rebuilds from raw

- Failures are loud, never silent

Every stage runs in its own Docker container

[View on GitHub](https://github.com/julianhilgemann/fx_macro_platform) [Why structure is the product](/story#structure)

## What I do

One chain, three stages. A measurement has to land somewhere, be modelled into something that holds, and leave as a number someone can act on. I work across all three.

- **Platforms** Microsoft Fabric, run like a product. A multi-tenant setup where every customer gets their own Dev, Test and Prod on shared capacity. Changes go through source files, Git and DevOps, so an environment can be rebuilt rather than remembered. [How that runs today](/about#platform)

- **Data Warehousing** Modelled once, so it can be reused. Warehouses and lakehouses with real models: a named grain, declared relationships, and lineage you can walk from a dashboard figure back to its row. On Fabric today, on Postgres and dbt before that. [The case for structure](/story#structure)

- **Business Intelligence** The number people actually act on. Dashboards, forecasts and scenario planning, over a metric layer that holds still. A number is only worth acting on if you can say what it leaves out, so the definitions and the uncertainty travel with it. [Data products in fintech](/about#bi)

And then the same chain backwards — a number opened back up into colour, motion and sound. [That is the other half of the work.](/story#expansion)

## Selected work

[All projects](/projects)

## Questions? I reply fast.

Contact me
