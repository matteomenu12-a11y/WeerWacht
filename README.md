# WeerWacht

Belgische weerapp met actuele weersgegevens, interactieve verwachtingen, regenradar, officiële waarschuwingen en een Liquid Glass-interface.

**Live:** https://weerwacht-live.matteomenu.chatgpt.site/

Gemaakt en bewerkt door Matteo Menu.

## Inhoud

- Volledige React/TypeScript-app met Vinext, Vite en Tailwind CSS.
- RainViewer-radar, DWD-neerslagverwachting en Open-Meteo-weergegevens.
- Officiële KMI/CAP-waarschuwingen, interactieve grafieken en meldingsinstellingen.
- Achtergrondvideo’s, logo’s, lettertypes, kaartbestanden en PWA-serviceworker.
- Backendroutes, databaseschema, migraties en tests.

## Lokaal starten

Vereist Node.js 22.13 of nieuwer en pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

```sh
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

## Hosting en configuratie

Deze versie gebruikt **Cloudflare Workers via ChatGPT Sites**, inclusief D1 en de door Sites beheerde ChatGPT-aanmelding. De repository bevat de broncode; bestaande gebruikers, databasegegevens, runtimegeheimen en hosting worden niet naar GitHub gekopieerd.

GitHub Pages ondersteunt alleen statische bestanden en kan deze volledige backend niet uitvoeren. Voor een andere host moeten de Worker/D1-koppelingen en aanmelding worden aangepast; alleen de repository importeren in Vercel is daarvoor niet voldoende.

Voor pushmeldingen zijn eigen VAPID-sleutels en een beveiligde periodieke serveraanroep nodig. Configureer geheimen uitsluitend in de serveromgeving. Een eventuele commerciële Open-Meteo-sleutel hoort eveneens op de server. Zie [technische documentatie](docs/weerwacht-2.md) voor de variabelen en beperkingen.

De algemene informatie over de oorspronkelijke Sites-starter staat in [docs/sites-starter.md](docs/sites-starter.md).

## Databronnen en rechten

De gebruikte providers hebben eigen voorwaarden en bronvermeldingsvereisten. De broncode maakt hun gegevens niet vrij van die voorwaarden. Bestaande licentiebestanden voor meegeleverde onderdelen blijven behouden.
