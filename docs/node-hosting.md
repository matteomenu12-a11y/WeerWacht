# WeerWacht voor een kleine Node.js-host

Dit is een Node.js-hostingvariant van de **bestaande WeerWacht-app**. De originele ChatGPT Sites-host blijft ongewijzigd. Next.js 16 draait zelfstandig op Node en het startbestand heet main.js.

## Minimale vereisten

- Node.js >=22.13; een hosting die langlopende Node.js-processen en een HTTP-poort PORT toestaat.
- Bouwen op je eigen pc/laptop (bij voorkeur meerdere GB RAM), niet op een kleine 512 MB-host.
- Voor het draaien is circa 512 MB–1 GB RAM een praktische richtlijn, geen garantie; dit hangt af van gebruik en host.
- Alleen een los JavaScriptbestand kunnen uitvoeren zonder meegeleverde dependencies is onvoldoende voor een volledige Next.js-website.

## Bouw en upload

Voer dit uit op je eigen computer (met pnpm 11 en Node.js 22):

    corepack enable
    pnpm install --frozen-lockfile
    pnpm test
    pnpm build
    pnpm package:node

Zip **alle inhoud** van dist-node (inclusief de verborgen map .next) en upload die naar je host. Kies main.js als starterbestand, of start met node main.js. De app luistert op 0.0.0.0 en leest de poort uit PORT (standaard 3000). De productiebuild bevat de benodigde dependencies, afbeeldingen, scripts, lettertypes en kaarten.

Bij een nieuwe update voer je de build en verpakking opnieuw uit. Verplaats nooit je geheime .env.local naar GitHub.

## Supabase (accounts en voorkeuren)

Bestaande gebruikers en Cloudflare D1-data worden **niet** automatisch gemigreerd. Als je al een externe Supabase-database gebruikt, configureer je hetzelfde project en de juiste tabellen/RLS-beleidsregels. De app verwacht onder meer public.profiles, announcements, audit, notification_settings, push_subscriptions en notification_deliveries. Geef nooit een service-role key aan de browser.

Maak vóór het bouwen lokaal .env.local met deze waarden (ook op je server instellen):

    NEXT_PUBLIC_SUPABASE_URL=https://jouw-project.supabase.co
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=jouw-publishable-key

NEXT_PUBLIC_-waarden zitten in de browserbuild en moeten dus correct zijn **bij het bouwen**, niet alleen bij het opstarten. Voeg in Supabase Auth de Site URL van je server toe en sta https://jouw-domein/auth/callback toe als redirect URL.

Zonder Supabase-instellingen blijft de publieke weerfunctie bruikbaar, maar inloggen, favorieten op accountniveau en beheertools niet.

## Controleren en storingen

- GET /api/health retourneert status ok wanneer de Node.js-app draait; dit is geen uitgebreide externe brontest.
- Test de actuele gegevens, zoekfunctie, RainViewer-radar, KNMI-kaart, waarschuwingen en weergave op mobiele schermen.
- Test daarna e-mailaanmelding, terugkerende login en favorieten. Controleer de cookies en eventuele RLS-meldingen.
- Ontbrekende .next/static of public geeft missende afbeeldingen, fonts en scripts.
- Een 503 bij accounts wijst vaak op ontbrekende Supabase-variabelen, tabellen of toegangsregels.
- Als de host na enkele minuten stopt, controleer of de host wel een persistent Node.js-proces ondersteunt.

## Databronnen, radar en meldingen

RainViewer biedt publieke historische radarframes; toekomstige nowcast-frames zijn sinds 1 januari 2026 niet meer publiek beschikbaar. KNMI- en DWD-vooruitkaarten zijn **voorspellingen**, geen toekomstige metingen. Behoud daarom de verschillende bronlabels en de vereiste attributie. WeerWacht gebruikt verder Open-Meteo-verwachtingen en Belgische CAP-waarschuwingen via MeteoAlarm.

Automatische achtergronddiensten en pushmeldingen zijn **niet vanzelf actief** doordat je de Node-server start. De huidige beveiligde achtergrondplanning moet apart worden ingericht, samen met de bijbehorende configuratie en veilige databasebevoegdheden.
