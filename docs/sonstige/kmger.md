# Sonstige / Kundmachungen der Gerichte

Kurzreferenz für die offizielle OGD RIS API v2.6.

## Endpoint

```text
GET/POST https://data.bka.gv.at/ris/api/v2.6/Sonstige
Applikation=KmGer
```

## Beschreibung

Kundmachungen der Gerichte, etwa Geschäftsverteilungen.

## Offizielle Quellen

- Handbuch: `OGD-RIS API Handbuch V2_6`
- Example-UI: `Examples/kmger.html`
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
- `Gericht`
- `Kundmachungsdatum.Von` / `Kundmachungsdatum.Bis`
- `Fassung...`

## Wichtige Enums

### `Typ`
- `Geschaeftsordnung`
- `Geschaeftsverteilung`

### `Gericht`
- `LVwG Tirol`
- `LVwG Vorarlberg`

### `Sortierung.SortedByColumn`
- `Gericht`
- `Kurzinformation`
- `Inkrafttretensdatum`

## Minimales Beispiel

```bash
curl -sG 'https://data.bka.gv.at/ris/api/v2.6/Sonstige' \
  --data-urlencode 'Applikation=KmGer' \
  --data-urlencode 'Suchworte=Geschäftsverteilung' \
  --data-urlencode 'DokumenteProSeite=Ten' \
  --data-urlencode 'Seitennummer=1' \
  --data-urlencode 'Sortierung.SortedByColumn=Gericht' \
  --data-urlencode 'Sortierung.SortDirection=Descending'
```

## Siehe auch

- [`README.md`](./README.md)
- [`../examples/official-examples-index.md`](../examples/official-examples-index.md)
- [`../examples/other-top-level-endpoints.md`](../examples/other-top-level-endpoints.md)
