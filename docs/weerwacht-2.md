# WeerWacht 2.0 — bediening en beheer

De bestaande app, identiteit, accountopslag, navigatieankers, mededelingen en makerpagina blijven bestaan. Instellingen staan op `/instellingen`.

## Bronnen en betekenis

- **Radar:** RainViewer, `radar.past` (2 uur, 10-minutenstappen). Geen toekomstige metingen. Het tijdstip is het composiettijdstip, geen exact simultaan meetmoment. Bronzoom maximaal 7; verder inzoomen voegt geen bronresolutie toe.
- **Kleuren:** de RainViewer-brontegels gebruiken kleurmodus `2` (Universal Blue) en worden ongewijzigd weergegeven. De legenda toont representatieve originele bronkleuren met hun dBZ-bereiken. Dit is de enige openbaar beschikbare API-kleurmodus; de website of mobiele app kan een andere, niet openbaar beschikbare kleurmodus tonen. Er is geen verzonnen mm/u-conversie.
- **Verwachting:** Open-Meteo `best_match`, Celsius, km/u, mm en `Europe/Brussels`. Unix-tijdstippen blijven intern eenduidig, ook bij winter-/zomertijd. Best Match kiest regionale/mondiale bronnen; we nemen geen eigen modelgemiddelden.
- **Vooruit-kaarten:** Windy/ECMWF en de bestaande DWD ICON-EU-uursommen (tot 12 uur), herkenbaar apart van radarwaarnemingen. De oorspronkelijke DWD-kleurklassen uit GetLegendGraphic worden in de voorwaartse DWD-kaart hertekend met contrastrijke weergavekleuren; de mm-uursom en klassengrenzen wijzigen niet. Transparante gebieden blijven transparant en onbekende kleuren ongewijzigd. De officiële bronlegenda is in de kaart gelinkt.
- **Officiële waarschuwingen:** KMI via MeteoAlarm België, met ernst, bronregio, ingangs-/eindtijd en bronlink. De tijden komen uit het oorspronkelijke CAP-bericht met expliciete tijdzone-offset, niet uit ongewijzigde legacy-Atom-tijdvelden. Onbevestigde details worden als onzeker getoond en niet voor push gebruikt. De bron bundelt Brabant (Vlaams-/Waals-Brabant en Brussel); Kust is apart. De landelijke balk is geen adresgebonden waarschuwing.
- **Luchtkwaliteit:** CAMS via Open-Meteo, modeldata.

De data/API-voorwaarden verschillen. Open-Meteo-data zijn CC BY 4.0 maar de gratis API is niet-commercieel; commercieel gebruik vraagt een klantabonnement. RainViewer is gratis voor persoonlijk/educatief/kleinschalig gemeenschapsgebruik en vraagt voor commercieel gebruik contact. KMI-radar-, bliksem- en hagelproducten vragen een aparte overeenkomst; geen privé-endpoints worden gescrapet. De eigen kaartbewerking is volgens RainViewer toegestaan.

Officiële documentatie:
- https://www.rainviewer.com/api/weather-maps-api.html
- https://www.rainviewer.com/api/transition-faq.html
- https://www.rainviewer.com/api.html
- https://www.rainviewer.com/files/rainviewer_api_colors_table.csv
- https://open-meteo.com/en/docs
- https://open-meteo.com/en/terms
- https://open-meteo.com/en/licence
- https://www.meteo.be/nl/diensten/producten-en-diensten/verwachtingen-voor-neerslag-bliksem-en-hagel
- https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/

## Laden en terugval

De kaart mount onafhankelijk van weerdata en scrollpositie. Eerst wordt het nieuwste radarbeeld voorbereid; de rest volgt met drie netwerkplaatsen. De softwaregrens van 72 nieuwe tegelverzoeken/minuut is conservatiever dan de bronlimiet. Andere bezoekers op hetzelfde publieke IP kunnen de bronlimiet nog steeds beïnvloeden. Het twee-uursoverzicht kan daardoor langer voorbereiden dan één uur. Er is geen belofte dat alle bronbeelden op elke verbinding onmiddellijk beschikbaar zijn.

Reeksen bevatten alleen volledig gedecodeerde beelden. Afspelen kan pas na voorbereiding van de gekozen reeks; slepen naar een nog niet klaar beeld houdt het vorige beeld met het vorige tijdstip zichtbaar. Geografische wijzigingen bereiden een nieuwe reeks voor. Browsercache: maximaal 100 rastertegels/3 uur en begrensd gedecodeerd geheugen. Open-Meteo: tien minuten browsercache (servercache bij de klant-API en meldingsbackend) en per-locatie laatste geldige snapshot tot 24 uur bij storingen. Ouderdom wordt zichtbaar gemeld.

## Push: wat al werkt en wat nog moet worden gekoppeld

De VAPID-sleutels en geheime backendtoken zijn voor deze Site in de runtime ingesteld. Ze staan niet in Git, browserbundels of manifesten. Een gebruiker moet eerst inloggen, maximaal drie locaties en de provincie kiezen, opslaan en daarna zelf toestemming geven. Op iPhone/iPad is een geschikte geïnstalleerde beginscherm-PWA nodig. Een testmelding is een expliciete aparte actie.

De backend bevat echte evaluatie, AES128GCM-Web-Push, accountgebonden opslag, atomische bezorgclaims, stabiele gebeurtenisidentificatie, een tweede ontdubbeling in de service worker, foutafhandeling en pruning bij 404/410. Er worden maximaal tien abonnementen en vijftien succesvolle meldingen per ronde verwerkt, met roulatie. Bezorgen kan door pushdienst, netwerk of toestelinstellingen worden vertraagd; OS-bezorging is pas op het eigen toestel te bevestigen.

**De periodieke achtergrondplanning is niet automatisch door Sites ingericht.** Zolang deze ontbreekt, meldt de app dat automatische weerpush nog niet actief is. Een browserinterval is geen betrouwbare achtergrondtaak.

Voor de eigenaar:

1. Open ingelogd `/instellingen`, onderdeel **Achtergrondplanning · beheer**.
2. Toon de koppelgegevens. Gebruik de aangegeven HTTPS-URL en de geheime `Authorization`-header in een eigen betrouwbare planner.
3. Plan iedere vijf minuten een `POST` naar `/api/notifications/check`; de body kan leeg zijn. Gebruik een planner met HTTPS en beveiligde opslag van headers. Deel de token niet.
4. Laat een eerste geautoriseerde controle lopen. Bevestig daarna de planning in de beheerkaart. De app verifieert een recente heartbeat voordat activeren lukt; bij ontbrekende controles wordt de status weer onzeker.
5. Gebruikers kunnen nu meldingen activeren en een test sturen. Automatische meldingen volgen de opgeslagen voorkeuren, provincie en drempels.

De Worker heeft ook een standaard `scheduled()`-handler voor een hostingomgeving die Cloudflare-crontriggers ondersteunt. Sites koppelt die trigger niet via het bronmanifest; de HTTPS-route is de ondersteunde configureerbare koppeling.

De gratis weerweergave vraagt Open-Meteo rechtstreeks vanuit de browser op, zoals in de oorspronkelijke architectuur. Dat voorkomt het samenvoegen van alle bezoekers op de gedeelde hostingquota. De klant-API met geheime sleutel en de meldingscontrole blijven server-side. Als de gedeelde serverquota voor gratis modeldata zijn bereikt, worden regen-/windpushrondes overgeslagen; officiële KMI-waarschuwingen blijven onafhankelijk daarvan werken. Er worden geen meldingen uit verzonnen of te oude data gestuurd. Een eigen Open-Meteo-klantabonnement is een configureerbare optie voor serverquota, geen vereiste voor de gratis weerweergave.

Benodigde runtimevelden:

| Naam | Gebruik |
| --- | --- |
| `PUSH_VAPID_PUBLIC_KEY` | Publieke toepassingssleutel |
| `PUSH_VAPID_PRIVATE_KEY` | Geheim; alleen server |
| `PUSH_VAPID_SUBJECT` | Werkelijke HTTPS-contactpagina van de Site |
| `PUSH_CRON_SECRET` | Geheim; authenticatie van de planner |
| `PUSH_SCHEDULE_ENABLED` | Optionele hostingconfiguratie; eigenaarbevestiging en heartbeat blijven zichtbaar |
| `OPEN_METEO_API_KEY` | Alleen indien commercieel abonnement; server kiest dan customer-api.open-meteo.com |

Hagel blijft uitgeschakeld totdat een toegestane betrouwbare bron is aangesloten. Onweerpush gebruikt officiële provinciegebonden waarschuwingen, geen gefingeerde bliksemdetectie. Regenpush gebruikt kwartiermodelwaarden (als gemiddeld mm/u-tempo), geen minuutnauwkeurige voorspelling.

Bewaring: bezorgclaims zeven dagen; toestelabonnementen na 90 dagen inactiviteit; ongeldig verklaarde endpoints worden verwijderd. Uitschakelen verwijdert de accountgebonden endpointregistratie en meldt het toestel af. Locaties/voorkeuren blijven accountgebonden en kunnen worden gewijzigd. De service worker cachet geen geauthenticeerde HTML/API-antwoorden.

## Visueel en interactief

Eén GlassCard-contract in `styles/glass.css`: gedeelde achtergrond, 48px desktopblur, 34px gebalanceerd mobiel en 22px in zuinige modus, contrast, rand, reflectie en radius. CSS bevat WebKit-prefix en een ondoorzichtige terugval. Thema/kwaliteit zijn toestelvoorkeuren; donker is de standaard. Verminderde beweging en databesparing gaan altijd voor. De aangeleverde timelapse blijft in volledige kwaliteit beschikbaar; de automatische mobiele achtergrond is licht in gebruik.

De SVG-grafiek is bewust licht en voegt geen extra grafiekenpakket toe. Aanraken/slepen, hover en pijltjestoetsen selecteren exact dezelfde bronwaarden. Temperatuur/gevoel, neerslag, neerslagkans, wind/stoten, vochtigheid en luchtdruk hebben eigen eenheden. Nullwaarden blijven ontbrekend.

## Controle

- `node --import ./tests/ts-loader.mjs --test tests/*.test.mjs`
- `node node_modules/typescript/bin/tsc --noEmit`
- Sites-productiebuild via de bestaande buildhelper.
- Browsercontrole op desktop en via 390px/768px responsieve weergave, radarafspelen en laagwissels, instellingen en thema's.
- Een echte iOS-toesteltest van Web Push vraagt de expliciete toestemming van de eigenaar van dat toestel; de cloudbrowser kan die bevestiging niet vervangen.

## Achtergrond en eenvoudige uitleg
De mobiele timelapse (171 kB) speelt ook in automatische/balanced kwaliteit af. Verminderde beweging, databesparing, een verborgen tab en een schermvullende kaart pauzeren de video. Safari-autoplay wordt bij een volgende aanraking of toetsaanslag opnieuw geprobeerd; toestelbeleid kan automatisch afspelen alsnog beperken. Zonnestralen komen uit de rechterbovenhoek bij actuele zonnige weerscodes overdag. De uitklapbare uitleg boven de dagkaarten beschrijft regenpercentages, mm, radar, voorspellingen, grafieken en broninformatie.
