# Judikatur / Verwaltungsgerichtshof

Kurzreferenz für die offizielle OGD RIS API v2.6.

## Endpoint

```text
GET/POST https://data.bka.gv.at/ris/api/v2.6/Judikatur
Applikation=Vwgh
```

## Beschreibung

Entscheidungen des Verwaltungsgerichtshofes (VwGH).

## Offizielle Quellen

- Handbuch: `OGD-RIS API Handbuch V2_6`
- Example-UI: `Examples/vwgh.html`
- Katalog: [`../ris-api-endpoints-catalog.md`](../ris-api-endpoints-catalog.md)

## Gemeinsam verfügbare Parameter

- `Suchworte`
- `DokumenteProSeite`
- `Seitennummer`
- `Sortierung.SortedByColumn`
- `Sortierung.SortDirection`
- `ImRisSeit`

## Wichtige zusätzliche Parameter

- `Dokumenttyp.SucheInRechtssaetzen` / `Dokumenttyp.SucheInEntscheidungstexten`
- `Geschaeftszahl`
- `Norm`
- `EntscheidungsdatumVon` / `EntscheidungsdatumBis`
- `Entscheidungsart`
- `Index`
- `Sammlungsnummer`

## Wichtige Enums

### `Entscheidungsart`
- `Beschluss`
- `Erkenntnis`
- `BeschlussVS`
- `ErkenntnisVS`

### `Sortierung.SortedByColumn`
- `Geschaeftszahl`
- `Datum`
- `Art`
- `Typ`

## Minimales Beispiel

```bash
curl -sG 'https://data.bka.gv.at/ris/api/v2.6/Judikatur' \
  --data-urlencode 'Applikation=Vwgh' \
  --data-urlencode 'Suchworte=Datenschutz' \
  --data-urlencode 'DokumenteProSeite=Ten' \
  --data-urlencode 'Seitennummer=1' \
  --data-urlencode 'Sortierung.SortedByColumn=Datum' \
  --data-urlencode 'Sortierung.SortDirection=Descending'
```

## Siehe auch

- [`README.md`](./README.md)
- [`../ris-api-judikatur-justiz.md`](../ris-api-judikatur-justiz.md)
- [`../examples/official-examples-index.md`](../examples/official-examples-index.md)
