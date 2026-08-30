# ប្រព័ន្ធគ្រប់គ្រងចំការទុរេន v2 — TypeScript + Offline PWA

នេះជាកំណែ "upgrade" ពេញលេញរបស់ App.jsx តែមួយឯកសារចាស់ ចែកចេញជា project ត្រឹមត្រូវ៖

- **TypeScript** ពេញលេញ — ចាប់ error ជាច្រើនប្រភេទដែលធ្លាប់ជួបកន្លងមក (field name ខុស, undefined ។ល។) មុននឹង deploy
- **React Router** — URL ពិតប្រាកដសម្រាប់ទំព័រនីមួយៗ (`/trees/:id` ។ល។)
- **React Query** — គ្រប់គ្រង loading/caching/sync ស្វ័យប្រវត្តិ
- **Offline-first (PWA)** — បញ្ចូលទិន្នន័យបានទោះគ្មានអ៊ីនធឺណិត រួច sync ស្វ័យប្រវត្តិពេលមកវិញ (មុខងារសំខាន់សម្រាប់ការប្រើប្រាស់នៅចម្ការ)
- Real-time sync, Theme ៤ បែប, sort controls, tree-code duplicate prevention — ដូចកំណែមុន

## ១. ដំឡើង

```bash
npm install
```

## ២. កំណត់ Environment Variables

ចម្លង `.env.example` ទៅជា `.env`:

```bash
cp .env.example .env
```

ដាក់តម្លៃដដែលពី project Supabase ដែលអ្នកកំពុងប្រើស្រាប់ (URL, anon key, Farm ID) — **ដូចគ្នាទាំងស្រុងជាមួយកំណែចាស់** ព្រោះ database schema មិនផ្លាស់ប្តូរអ្វីទេ គ្រាន់តែកូដ frontend ត្រូវបានសរសេរឡើងវិញ។

## ៣. រត់សាកល្បង

```bash
npm run dev
```

## ៤. Build សម្រាប់ production

```bash
npm run build
```

Build ត្រូវបានសាកល្បងរួចរាល់ (TypeScript check + Vite build + PWA generation ជោគជ័យទាំងអស់)។

## ៥. Deploy

ដូចគ្នានឹងកំណែមុន — push ទៅ GitHub, Vercel នឹង build ស្វ័យប្រវត្តិ។ Framework Preset នៅតែជា **Vite**។ កុំភ្លេចដាក់ environment variables ក្នុង Vercel ដូចធ្លាប់ធ្វើ។

**មុខងារថ្មីមួយ** ត្រូវការជំហានបន្ថែម៖ ដើម្បីអោយ PWA ដំណើរការ (installable app + offline) លើ production ត្រូវប្រាកដថា site ដំណើរការលើ **HTTPS** (Vercel ផ្តល់ HTTPS ស្វ័យប្រវត្តិរួចហើយ គ្មានអ្វីត្រូវធ្វើបន្ថែម)។

## ៦. សាកល្បង Offline Mode

1. បើក app លើទូរស័ព្ទ ចូល login ធម្មតា
2. ចុច "..." menu លើ browser → **"Add to Home Screen"** (iOS Safari) ឬ browser នឹងស្នើ **Install App** ស្វ័យប្រវត្តិ (Android Chrome)
3. បិទ WiFi/ទិន្នន័យទូរស័ព្ទ (Airplane mode)
4. បើក app ពី home screen — នៅតែបើកបាន (UI shell cached)
5. សាកល្បងបន្ថែម/កែទិន្នន័យ — នឹងឃើញសញ្ញា "គ្មានអ៊ីនធឺណិត · N" នៅក្បាល
6. បើក WiFi ឡើងវិញ — ក្នុងរយៈពេលប្រហែល ១ វិនាទី ទិន្នន័យនឹង sync ដោយស្វ័យប្រវត្តិ (សញ្ញាប្តូរជា "កំពុងបញ្ជូន...")

## ៧. រចនាសម្ព័ន្ធ Project

```
src/
  types/       — TypeScript interfaces សម្រាប់គ្រប់ទិន្នន័យ
  lib/         — constants, theme, permissions, format, offline queue, sync engine
  api/         — Supabase calls ចែកតាមប្រភេទ (trees.ts, workers.ts ។ល។)
  hooks/       — React Query hooks (មាន offline-queue fallback ស្រាប់ក្នុង create/update/delete)
  contexts/    — Auth, Theme
  components/  — UI បែងចែកតាមផ្នែក (ui/, trees/, workers/, expenses/, sales/, settings/)
  pages/       — ទំព័រនីមួយៗ ភ្ជាប់នឹង route
  App.tsx      — shell សំខាន់ (header, bottom nav, routes)
  main.tsx     — entry point
```

## អ្វីមិនទាន់ port មកកំណែនេះ (fast-follow)

ដើម្បីផ្តល់ជូនកំណែស្អាត ត្រឹមត្រូវ ១០០% ជាមុនសិន ខ្ញុំបានផ្តោតលើស្នូលសំខាន់ៗទាំងអស់។ មុខងារខាងក្រោមមិនទាន់បាន port មកកំណែ v2 នេះ (នៅមាននៅកំណែ Supabase artifact ចាស់)៖

- **ស្កេន QR** (ត្រូវ port ដោយប្រើ jsQR library ស្រដៀងកំណែចាស់)
- **បោះពុម្ព QR ទាំងអស់ / របាយការណ៍ (Report)** — ចាំបាច់សរសេរ component ថ្មីសម្រាប់ print view
- **Reset ទិន្នន័យទាំងអស់** ពី Settings (ឥឡូវប្រាប់ឲ្យប្រើ Supabase Dashboard ជំនួសវិញ ដើម្បីសុវត្ថិភាព)

ខ្ញុំអាចបន្ថែមផ្នែកទាំងនេះនៅជុំបន្ទាប់ — ឥឡូវ pattern/architecture បានបង្កើតរួចហើយ ដូច្នេះការបន្ថែមនឹងលឿនជាងមុនច្រើន។
