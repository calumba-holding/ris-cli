# Sonstige / Strukturpläne Gesundheit

Kurzreferenz für die offizielle OGD RIS API v2.6.

## Endpoint

```text
GET/POST https://data.bka.gv.at/ris/api/v2.6/Sonstige
Applikation=Spg
```

## Beschreibung

ÖSG, RSG und zugehörige Verordnungen.

## Offizielle Quellen

- Handbuch: `OGD-RIS API Handbuch V2_6`
- Example-UI: `Examples/spg.html`
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
- `Spgnummer`
- `OsgSuchEinschraenkung.SpgStrukturplanType`
- `RsgSuchEinschraenkung.SpgStrukturplanType`
- `RsgSuchEinschraenkung.Land`
- `Kundmachungsdatum.Von` / `Kundmachungsdatum.Bis`
- `Fassung...`

## Wichtige Enums

### `Sortierung.SortedByColumn`
- `Inkrafttretensdatum`
- `Spgnummer`
- `Kurzinformation`

## Minimales Beispiel

```bash
curl -sG 'https://data.bka.gv.at/ris/api/v2.6/Sonstige' \
  --data-urlencode 'Applikation=Spg' \
  --data-urlencode 'Suchworte=Gesundheit' \
  --data-urlencode 'DokumenteProSeite=Ten' \
  --data-urlencode 'Seitennummer=1' \
  --data-urlencode 'Sortierung.SortedByColumn=Spgnummer' \
  --data-urlencode 'Sortierung.SortDirection=Descending'
```

## Siehe auch

- [`README.md`](./README.md)
- [`../examples/official-examples-index.md`](../examples/official-examples-index.md)
- [`../examples/other-top-level-endpoints.md`](../examples/other-top-level-endpoints.md)
