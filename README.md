# Ahmed & Diana RSVP

En enkel bröllopssida där gäster kan svara om de kommer. Svaren sparas i Supabase och kan exporteras till CSV/Excel från Supabase när ni vill.

## Sa fungerar det

- `index.html`, `styles.css` och `app.js` är själva webbsidan.
- `supabase-schema.sql` skapar tabellen `rsvps` och reglerna som låter gäster skicka in svar.
- Gästerna skriver antal personer. Sidan skapar sedan ett förnamn- och efternamnfält per person.
- Lankar kan skickas med en inbjudningskod, till exempel:
  `https://ahmedochdiana.se/?invite=familjen-ali`

## Supabase

1. Skapa ett nytt projekt i Supabase.
2. Öppna SQL Editor.
3. Klistra in allt från `supabase-schema.sql` och kör det.
4. Gå till Project Settings -> API.
5. Kopiera `Project URL` och `anon public key`.
6. Byt ut platshallarna hogst upp i `app.js`:
   - `PASTE_SUPABASE_URL_HERE`
   - `PASTE_SUPABASE_ANON_KEY_HERE`

Publicera aldrig en `service_role` key i webbsidan. Den nyckeln ger full tillgång.

## Export till Excel

I Supabase kan du öppna tabellen `rsvps` och exportera svaren som CSV. CSV-filen kan öppnas direkt i Excel.

Det finns också en vy som heter `rsvp_summary`. Den ger snabb summering av:

- antal ja-svar
- antal nej-svar
- totalt antal gäster

## Publicering

GitHub kan hålla koden. För själva webbsidan är de enklaste valen:

- Vercel eller Netlify om du vill koppla domän smidigt.
- GitHub Pages om du vill hålla det extra enkelt.

Supabase används här som databas för svaren.
