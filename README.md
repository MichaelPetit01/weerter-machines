# De Weerter Machines 🏊🚴🏃

Triathlon trainingsapp voor Michael & Lars. Richting 13 juni. Geen excuses.

## Stack

- **Backend**: Node.js + Express + SQLite (better-sqlite3)
- **Frontend**: React + Vite + Tailwind CSS
- **Auth**: express-session (cookie-based)
- **Uploads**: Multer (selfies lokaal opgeslagen)

Gekozen voor eenvoud en stabiliteit. SQLite draait zonder externe database. Alles lokaal, direct op te starten.

---

## Lokaal opstarten

### 0. Gebruik Node.js v20

```bash
nvm use 20
# of: nvm install 20 && nvm use 20
```

> **Let op:** Node v24 werkt niet met better-sqlite3 vanwege een compiler-probleem. Gebruik v20 LTS.

### 1. Installeer dependencies

```bash
npm run setup
```

Dit installeert backend én frontend dependencies.

### 2. Vul de database

```bash
npm run seed
```

Maakt aan:
- 2 gebruikers (Michael & Lars)
- Volledig trainingsschema t/m 13 juni
- 4 voorbeeldberichten in de chat

### 3. Start de app

```bash
npm run dev
```

Dit start:
- Backend op `http://localhost:3001`
- Frontend op `http://localhost:5173`

Open je browser op **http://localhost:5173**

---

## Inloggegevens

| Gebruiker | Wachtwoord |
|-----------|------------|
| Michael   | Michael-Supermachine-2026 |
| Lars      | Lars-Supermachine-2026 |

---

## Productie build

```bash
npm run build
NODE_ENV=production npm start
```

De app draait dan volledig op `http://localhost:3001`.

---

## Projectstructuur

```
Weerter Machines/
├── server.js          # Express API (alle routes)
├── db.js              # SQLite database setup
├── seed.js            # Seed data (gebruikers, schema, berichten)
├── uploads/selfies/   # Geselecteerde trainingsselfies
├── data.db            # SQLite database (aangemaakt na seed)
└── client/
    └── src/
        ├── App.jsx
        ├── api.js
        ├── utils.js
        ├── pages/
        │   ├── Login.jsx
        │   ├── Home.jsx
        │   ├── Week.jsx
        │   ├── Chat.jsx
        │   └── Stats.jsx
        └── components/
            ├── Nav.jsx
            ├── SportBadge.jsx
            ├── TrainingCard.jsx
            ├── TrainingDrawer.jsx
            ├── EvaluationForm.jsx
            └── TrainingFormDrawer.jsx
```

---

## Deployen (Render / Railway)

1. Push naar GitHub
2. Maak een Web Service aan (Node, `npm start`, `PORT` env var)
3. Voeg `uploads/` toe aan persistent storage
4. Run `npm run build` als build command
5. Run `node seed.js` eenmalig via console

---

## Kernfuncties

- ✅ Login voor Michael & Lars
- ✅ Home met countdown, next training, week summary
- ✅ Weekoverzicht met bladeren door weken
- ✅ Training aanmaken / bewerken / verwijderen
- ✅ Extra training toevoegen
- ✅ Evaluatie per gebruiker (status, zwaarte, gevoel, tekst)
- ✅ Verplichte selfie voor afgeronde training
- ✅ Selfie-validatie: "Hey pussy, je moet je selfie nog sturen."
- ✅ Chat met polling (3 sec)
- ✅ Basisstatistieken per gebruiker
- ✅ Dark navy + orange stijl, mobile-first
