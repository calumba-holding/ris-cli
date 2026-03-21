# Sonstige / Prüfungsordnungen gemäß GewO / HBB

Kurzreferenz für die offizielle OGD RIS API v2.6.

## Endpoint

```text
GET/POST https://data.bka.gv.at/ris/api/v2.6/Sonstige
Applikation=PruefGewO
```

## Beschreibung

Prüfungsordnungen gemäß Gewerbeordnung und HBB-Gesetz.

## Offizielle Quellen

- Handbuch: `OGD-RIS API Handbuch V2_6`
- Example-UI: `Examples/pruefgewo.html`
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
- `Typ`
- `Kundmachungsdatum.Von` / `Kundmachungsdatum.Bis`
- `Fassung.FassungVom` oder Inkraft-/Außerkrafttretensbereiche

## Wichtige Enums

### `Sortierung.SortedByColumn`
- `Kundmachungsdatum`
- `Kurzinformation`
- `Inkrafttretensdatum`

## Minimales Beispiel

```bash
curl -sG 'https://data.bka.gv.at/ris/api/v2.6/Sonstige' \
  --data-urlencode 'Applikation=PruefGewO' \
  --data-urlencode 'Suchworte=Meisterprüfung' \
  --data-urlencode 'DokumenteProSeite=Ten' \
  --data-urlencode 'Seitennummer=1' \
  --data-urlencode 'Sortierung.SortedByColumn=Kundmachungsdatum' \
  --data-urlencode 'Sortierung.SortDirection=Descending'
```

## Siehe auch

- [`README.md`](./README.md)
- [`../examples/official-examples-index.md`](../examples/official-examples-index.md)
- [`../examples/other-top-level-endpoints.md`](../examples/other-top-level-endpoints.md)
