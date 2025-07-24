# OnlineSprava | Hlasování

Kompletní systém pro správu hlasování v bytových domech (SVJ) s pokročilými funkcemi pro e-mailové hlasování, správu členů a budov.

## 🚀 Funkce

- **Multi-role autentizace** (Admin, Předseda, Člen)
- **Správa budov a členů** s CSV import/export
- **Pokročilý hlasovací systém** s personalizovanými e-mailovými odkazy
- **Real-time sledování průběhu hlasování**
- **Správa e-mailových šablon** s proměnnými
- **Komprehensivní výsledky a audit**
- **Responzivní design** optimalizovaný pro všechna zařízení

## 🛠️ Technologie

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend/Databáze**: Supabase
- **Autentizace**: Supabase Auth
- **Ikony**: Lucide React
- **Routing**: React Router DOM

## 📋 Požadavky

- Node.js 18+
- Supabase projekt
- npm nebo yarn

## 🔧 Instalace

1. **Klonování repozitáře**
   ```bash
   git clone <repository-url>
   cd online-sprava-hlasovani
   ```

2. **Instalace závislostí**
   ```bash
   npm install
   ```

3. **Nastavení Supabase**
   
   a) Vytvořte nový Supabase projekt na [supabase.com](https://supabase.com)
   
   b) Spusťte migrace v Supabase SQL editoru:
   ```sql
   -- Spusťte všechny soubory z supabase/migrations/ v abecedním pořadí
   ```

   c) Nasaďte Edge Functions:
   ```bash
   # Nainstalujte Supabase CLI
   npm install -g supabase
   
   # Přihlaste se k Supabase
   supabase login
   
   # Nasaďte Edge Functions
   supabase functions deploy send-voting-email
   supabase functions deploy distribute-voting-emails
   supabase functions deploy get-voting-data
   supabase functions deploy process-email-vote
   ```

   d) Nastavte Environment Variables v Supabase:
   - `BREVO_API_KEY` - API klíč z Brevo
   - `FROM_EMAIL` - e-mailová adresa odesílatele
   - `FROM_NAME` - jméno odesílatele
   - `FRONTEND_URL` - URL vaší aplikace

4. **Konfigurace prostředí**
   ```bash
   cp .env.example .env
   ```
   
   Vyplňte `.env` soubor:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

5. **Vytvoření demo uživatelů**
   
   V Supabase Auth vytvořte tyto uživatele:
   - `admin@svj.cz` (heslo: `demo123`)
   - `chairman@svj.cz` (heslo: `demo123`)
   - `member@svj.cz` (heslo: `demo123`)

6. **Spuštění aplikace**
   ```bash
   npm run dev
   ```

## 📧 Nastavení Brevo (Sendinblue)

1. **Vytvoření účtu**
   - Zaregistrujte se na [brevo.com](https://brevo.com)
   - Ověřte svou e-mailovou adresu

2. **Získání API klíče**
   - Přejděte do Settings → SMTP & API
   - Vytvořte nový API klíč
   - Zkopírujte klíč do Supabase Environment Variables

3. **Nastavení odesílatele**
   - Přidejte a ověřte svou doménu v Brevo
   - Nastavte FROM_EMAIL a FROM_NAME v Environment Variables

## 🏗️ Struktura databáze

### Hlavní tabulky:
- `buildings` - Bytové domy
- `members` - Členové společenství
- `votes` - Hlasování
- `user_votes` - Odevzdané hlasy
- `personalized_voting_links` - Personalizované hlasovací odkazy
- `email_templates` - E-mailové šablony
- `email_delivery_logs` - Logy odeslaných e-mailů
- `voting_sessions` - Statistiky hlasování

### Typy:
- `member_role`: 'admin' | 'chairman' | 'member'
- `vote_status`: 'draft' | 'active' | 'completed' | 'cancelled'

## 👥 Role uživatelů

### Administrátor (`admin`)
- Plný přístup ke všem funkcím
- Správa budov a členů
- Vytváření a správa hlasování
- Přístup k auditním logům

### Předseda (`chairman`)
- Správa členů své budovy
- Vytváření a správa hlasování
- Správa e-mailových šablon
- Sledování výsledků

### Člen (`member`)
- Účast v hlasování
- Zobrazení výsledků
- Přístup k dokumentům

## 🔐 Bezpečnost

- **Row Level Security (RLS)** na všech tabulkách
- **Autentizace** přes Supabase Auth
- **Personalizované tokeny** pro e-mailové hlasování
- **Časově omezené odkazy** s expirací

## 📧 E-mailový hlasovací systém

1. **Aktivace hlasování** - generuje personalizované odkazy
2. **Rozeslání e-mailů** - pomocí šablon s proměnnými
3. **Bezpečné hlasování** - přes unikátní tokeny
4. **Real-time sledování** - průběh hlasování v reálném čase

## 🚀 Nasazení

### Netlify (doporučeno)
1. Build aplikace: `npm run build`
2. Nasazení `dist` složky na Netlify
3. Nastavení environment variables v Netlify

### Vercel
1. Připojení GitHub repozitáře
2. Automatické nasazení při push
3. Konfigurace environment variables

## 🔧 Vývoj

### Spuštění dev serveru
```bash
npm run dev
```

### Build pro produkci
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## 📝 Poznámky

- Demo data jsou automaticky vložena při spuštění migrací
- Pro plnou funkcionalnost e-mailového systému je potřeba nastavit Supabase Edge Functions
- Aplikace je optimalizována pro české prostředí (SVJ)

## 🤝 Podpora

Pro podporu a dotazy kontaktujte vývojový tým nebo vytvořte issue v repozitáři.