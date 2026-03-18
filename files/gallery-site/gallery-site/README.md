# 📸 Gallery Site — Guida Completa

Sito galleria fotografica statico, hostato gratis su **GitHub Pages**, protetto da **Cloudflare**.

---

## ⚡ Struttura del progetto

```
gallery-site/
├── index.html          ← Struttura HTML (non toccare)
├── style.css           ← Stile visivo (non toccare)
├── app.js              ← Logica app (non toccare)
├── content.json        ← ✅ QUI aggiungi immagini e testi
├── images/             ← ✅ QUI metti le tue foto
│   ├── photo1.jpg
│   └── ...
├── _headers            ← Header sicurezza Cloudflare
├── _redirects          ← Redirect Cloudflare
└── .github/
    └── workflows/
        └── deploy.yml  ← Auto-deploy su push
```

---

## 🚀 STEP 1 — Pubblica su GitHub

1. Crea un account su [github.com](https://github.com) (gratis)
2. Crea un nuovo repository pubblico, ad esempio: `my-gallery`
3. Carica tutti i file del progetto nel repository
4. Vai su **Settings → Pages**
5. In "Source" seleziona **GitHub Actions**
6. Fai un push (o clicca "Re-run jobs") → il sito è live su:
   `https://TUOUSERNAME.github.io/my-gallery/`

---

## 🛡️ STEP 2 — Proteggi con Cloudflare (GRATIS)

Cloudflare Free ti dà:
- ✅ DDoS protection automatica (Layer 3/4/7)
- ✅ Firewall con regole custom
- ✅ Rate limiting base
- ✅ SSL/TLS gratuito
- ✅ Cache globale CDN

### Come configurare:

1. Crea account su [cloudflare.com](https://cloudflare.com) (gratis)
2. Aggiungi il tuo dominio personalizzato (opzionale, serve acquistarne uno ~€10/anno)
   - Se non hai un dominio, GitHub Pages ha già HTTPS su `github.io`
3. Se hai un dominio:
   - In Cloudflare, vai su **DNS** e punta un record CNAME a `TUOUSERNAME.github.io`
   - Attiva la **nuvola arancione** (proxy Cloudflare)
4. Vai su **Security → WAF** (Web Application Firewall):
   - Attiva le regole "Managed Rules" (Cloudflare Free Managed Ruleset)
5. Vai su **Security → Bots**:
   - Attiva "Bot Fight Mode" (gratis)
6. Vai su **Security → Settings**:
   - Security Level: **Medium** o **High**
   - Challenge Passage: **30 minuti**
7. Vai su **Speed → Optimization**:
   - Attiva "Auto Minify" per HTML/CSS/JS
   - Attiva "Brotli" compression

### Regola Firewall consigliata (blocca bot aggressivi):

In **Security → WAF → Custom Rules** → crea una regola:
```
Campo:    (http.request.uri.path contains "/images/") AND (http.user_agent eq "")
Azione:   Block
```

---

## ✏️ STEP 3 — Aggiungere contenuti

### Aggiungere foto

1. Metti le foto nella cartella `images/`
2. Apri `content.json`
3. In una sezione di tipo `"gallery"`, aggiungi un oggetto dentro `"images"`:

```json
{
  "src": "images/mia-foto.jpg",
  "alt": "Descrizione accessibile della foto",
  "caption": "Testo che appare hovering",
  "width": 1200,
  "height": 800
}
```

### Aggiungere una nuova sezione galleria

```json
{
  "id": "estate-2024",
  "type": "gallery",
  "title": "Estate 2024",
  "description": "Le mie vacanze in Sicilia.",
  "layout": "masonry",
  "images": [...]
}
```

Layout disponibili: `"masonry"` (altezze variabili) o `"grid"` (uniforme).

### Aggiungere testo / paragrafi

```json
{
  "id": "about",
  "type": "text",
  "title": "Chi sono",
  "body": "Paragrafo principale.",
  "paragraphs": [
    "Secondo paragrafo.",
    "Terzo paragrafo."
  ]
}
```

### Modificare info del sito

```json
"site": {
  "title": "Il mio nome",
  "subtitle": "Fotografo",
  "author": "Mario Rossi"
}
```

### Modificare contatti nel footer

```json
"contact": {
  "show": true,
  "email": "tua@email.it",
  "instagram": "tuousername",
  "twitter": ""
}
```

---

## 🔒 Sicurezza integrata nel codice

| Feature | Dove |
|---------|------|
| Content Security Policy | `index.html` meta tag |
| X-Frame-Options DENY | `_headers` + HTML meta |
| X-Content-Type-Options | `_headers` + HTML meta |
| Sanitizzazione input | `app.js` Security module |
| Rate limiting client-side | `app.js` (80 click/10sec) |
| Nessun innerHTML da dati utente | `app.js` (solo textContent) |
| Validazione src immagini | `app.js` sanitizeImageSrc() |
| Nessun eval() | tutto il codice |
| Lazy loading immagini | `app.js` IntersectionObserver |
| Keyboard navigation | `app.js` + `index.html` |
| ARIA labels | `index.html` |
| Reduced motion support | `style.css` |

---

## 📝 Note

- **Dimensioni foto consigliate**: max 2000px sul lato lungo, formato JPG/WebP
- **Nomi file**: usa solo lettere, numeri, trattini (es. `foto-estate-01.jpg`)
- **Dopo ogni modifica** a `content.json` o alle immagini, fai un commit+push su GitHub e il sito si aggiorna automaticamente in ~1 minuto
