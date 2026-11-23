# CHEERS — Your Personal Beer & Wine Journal

Private-first beer and wine tasting journal, designed for iPhone as an installable Progressive Web App.

## First version
- Separate beer and wine collections
- Personal tasting scores from 1–10 in half-point increments
- Multiple tasting moments per product
- Favorites, search and personal overview
- Vivino score and review count fields for wines (manual entry)
- Local device storage and JSON backup/restore
- Offline app shell through a service worker

## Publish with GitHub Pages
1. Open repository **Settings → Pages**.
2. Under Build and deployment, select **Deploy from a branch**.
3. Select branch **main** and folder **/(root)**, then Save.
4. Open the published URL on iPhone in Safari. Use Share → Add to Home Screen.

## Privacy
Personal entries and photos are stored in this browser on this device. They are not committed to this repository. Export a JSON backup regularly. Clearing Safari website data can remove local records.

## Notes
Vivino scores are entered manually in this first version. Automatic Vivino lookup is not included; it requires a supported and permitted data source.

## Version 1.2.0 — photo handling and updates
- Photos are automatically resized and compressed before they are saved, so large iPhone originals can be stored.
- Label recognition normalizes the alcohol percentage to a numeric value and asks the AI to look specifically for ABV / Alc. markings.
- The app displays its version and checks for updates when opened or when returning to the app. Updates do not reload while a product or tasting form has unsaved input.
- Existing collection data remains in local browser storage; updates do not clear it.

## Version 1.1 — AI label recognition
The add-product screen can send a selected label photo to a separately hosted Cloudflare Worker. The worker calls the OpenAI Responses API and returns structured beer or wine label fields. The user must review the fields before saving.

### Configure the AI service
1. Create a Cloudflare Worker and deploy the contents of `worker.js`.
2. In the Worker settings, add the secret `OPENAI_API_KEY` with your own OpenAI API key. Never put this key in the GitHub repository or browser app.
3. Set the variable `ALLOWED_ORIGIN` to `https://ecknest-jpg.github.io` to restrict browser calls to this GitHub Pages origin. This variable is required.
4. In CHEERS → Toevoegen, paste the Worker URL into “AI-herkenning endpoint”. This setting is stored locally in that browser.
5. AI image requests are sent to OpenAI for processing. API usage may incur separate charges under the API account. Photo recognition requires an internet connection.

The Worker uses `gpt-4.1-mini` by default. Set `OPENAI_MODEL` to another vision-capable model if desired. The AI returns only fields it can read; uncertain fields are left blank. Vivino lookup is intentionally not part of 1.1.


## Version 1.3.0 — external wine information
- Wine detail pages can search the WineAPI catalog and save available rating, rating count, grape, region, body, acidity, intensity, description and critic scores to the local wine record.
- WineAPI is an independent data source, not Vivino. Coverage and data completeness vary; missing values remain blank.
- Configure the optional `WINEAPI_KEY` secret in the Cloudflare Worker. The free WineAPI plan currently documents 100 requests per day for personal use. Never place the key in browser code or GitHub.
- The Cloudflare Worker proxies search and detail requests so the API key stays server-side.


## Version 1.4.0 — wijngegevens en smaakprofiel
- Druivensoort is nu een echte keuzelijst met rode en witte druiven.
- WineAPI-zoekresultaten worden als kandidaten getoond. CHEERS kiest niet langer automatisch de eerste zoekmatch; controleer naam, wijnhuis, jaargang en regio en laad daarna bewust de juiste kandidaat.
- Per wijn kun je een eigen smaakprofiel instellen op vijf niveaus: droog–zoet, frisheid, licht–vol, strak–rond, tannines en smaakintensiteit.
- WineAPI levert alleen velden die in zijn catalogus beschikbaar zijn. Een gevonden wijn garandeert geen score of smaakdata.
- Vivino heeft geen officiële openbare ontwikkelaars-API. CHEERS haalt daarom niet automatisch Vivino-scores op en gebruikt geen ongeautoriseerde scraping. Vivino-score kan handmatig worden ingevoerd. Een eventuele automatische koppeling vereist een passende, toegestane externe datadienst.
