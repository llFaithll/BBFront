# B&B Manager - Product Requirements

## Original Problem Statement
Gestionale completo per uno o più B&B con: dashboard KPI, calendario sincronizzato con Airbnb/Booking, tabella ospiti, magazzino, scadenziario spese fisse, prezzi dinamici AI, export Alloggiati Web (Polizia di Stato).

## User Choices
- **Auth**: JWT custom (email/password + bcrypt + httpOnly cookies)
- **Sync canali**: import iCal URL (Airbnb/Booking)
- **Alloggiati Web**: generazione file .txt formato tracciato Polizia
- **Prezzi dinamici**: AI (Claude Sonnet 4.5 via Emergent LLM key)
- **Proprietà**: singola inizialmente
- **Lingua**: Italiano

## Personas
- Proprietario B&B che gestisce prenotazioni, ospiti, forniture e scadenze fiscali

## Architecture
- Backend: FastAPI + MongoDB (motor), JWT auth, icalendar parser, emergentintegrations (Claude)
- Frontend: React 19 + React Router 7 + Recharts + Shadcn/UI + Phosphor Icons + Sonner
- Design: "Organic & Earthy meets High-Contrast Swiss" (Cormorant Garamond + Manrope, sage green + terracotta)

## Implemented (2026-02-11)
- Auth: login/register/me/refresh/logout con cookie sicuri
- Dashboard: KPI (ricavo lordo/netto, occupazione %, prenotazioni), grafici mensili e canali
- Calendario mensile con vista prenotazioni + import iCal
- Registro ospiti CRUD con campi Alloggiati (nascita, documento, cittadinanza)
- Magazzino: schede prodotto con soglia minima e alert
- Scadenziario spese: TARI/IMU/Condominio/Bollette con toggle pagato
- Prezzi Dinamici AI (Claude Sonnet 4.5) — richiede budget su chiave LLM
- Alloggiati Web: anteprima + download .txt fixed-width per portale Questura
- Calcolo automatico netto: commissioni canale (Airbnb 3%, Booking 15%, Direct 0%) + cedolare secca 21%

## Backlog (P1/P2)
- P1: Multi-proprietà (attualmente owner_id singolo utente)
- P1: Export iCal delle prenotazioni verso Airbnb/Booking (bidirezionale)
- P1: Alert email/notifiche per scadenze imminenti
- P2: Report PDF mensile/annuale
- P2: Grafici avanzati (RevPAR, ADR, lead time)
- P2: Integrazione contabile (fatture elettroniche)

## Test Credentials
Admin: `admin@bnb.it` / `admin123`
