# Sonstige / Amtliche Veterinärnachrichten

Kurzreferenz für die offizielle OGD RIS API v2.6.

## Endpoint

```text
GET/POST https://data.bka.gv.at/ris/api/v2.6/Sonstige
Applikation=Avn
```

## Beschreibung

Amtliche Veterinärnachrichten (AVN).

## Offizielle Quellen

- Handbuch: `OGD-RIS API Handbuch V2_6`
- Example-UI: `Examples/avn.html`
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
- `Avnnummer`
- `Typ.SucheInKundmachungen` / `Typ.SucheInVeroeffentlichungenAufGrundVEVO` / `Typ.SucheInSonstigeVeroeffentlichungen`
- `Kundmachung.Periode` oder `Kundmachung.Von/Bis`
- `FassungVom`
- `Geschaeftszahl`
- `Norm`

## Wichtige Enums

### `Sortierung.SortedByColumn`
- `Avnnummer`
- `Kundmachungsdatum`
- `Kurzinformation`

## Minimales Beispiel

```bash
curl -sG 'https://data.bka.gv.at/ris/api/v2.6/Sonstige' \
  --data-urlencode 'Applikation=Avn' \
  --data-urlencode 'Suchworte=Tierseuche' \
  --data-urlencode 'DokumenteProSeite=Ten' \
  --data-urlencode 'Seitennummer=1' \
  --data-urlencode 'Sortierung.SortedByColumn=Kundmachungsdatum' \
  --data-urlencode 'Sortierung.SortDirection=Descending'
```

## Siehe auch

- [`README.md`](./README.md)
- [`../examples/official-examples-index.md`](../examples/official-examples-index.md)
- [`../examples/other-top-level-endpoints.md`](../examples/other-top-level-endpoints.md)
