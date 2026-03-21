# Sonstige / Erlässe der Bundesministerien

Kurzreferenz für die offizielle OGD RIS API v2.6.

## Endpoint

```text
GET/POST https://data.bka.gv.at/ris/api/v2.6/Sonstige
Applikation=Erlaesse
```

## Beschreibung

Ausgewählte Erlässe der Bundesministerien.

## Offizielle Quellen

- Handbuch: `OGD-RIS API Handbuch V2_6`
- Example-UI: `Examples/erlaesse.html`
- Katalog: [`../ris-api-endpoints-catalog.md`](../ris-api-endpoints-catalog.md)

## Gemeinsam verfügbare Parameter

- `Suchworte`
- `DokumenteProSeite`
- `Seitennummer`
- `Sortierung.SortedByColumn`
- `Sortierung.SortDirection`
- `ImRisSeit`

## Wichtige zusätzliche Parameter

- `Titel`
- `VonInkrafttretensdatum` / `BisInkrafttretensdatum`
- `FassungVom`
- `Bundesministerium`
- `Abteilung`
- `Fundstelle`
- `Geschaeftszahl`
- `Norm`

## Wichtige Enums

### `Sortierung.SortedByColumn`
- `Geschaeftszahl`
- `Bundesministerium`
- `Genehmigungsdatum`

## Minimales Beispiel

```bash
curl -sG 'https://data.bka.gv.at/ris/api/v2.6/Sonstige' \
  --data-urlencode 'Applikation=Erlaesse' \
  --data-urlencode 'Suchworte=Datenschutz' \
  --data-urlencode 'DokumenteProSeite=Ten' \
  --data-urlencode 'Seitennummer=1' \
  --data-urlencode 'Sortierung.SortedByColumn=Genehmigungsdatum' \
  --data-urlencode 'Sortierung.SortDirection=Descending'
```

## Siehe auch

- [`README.md`](./README.md)
- [`../examples/official-examples-index.md`](../examples/official-examples-index.md)
- [`../examples/other-top-level-endpoints.md`](../examples/other-top-level-endpoints.md)
