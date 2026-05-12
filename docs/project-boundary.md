# Project Boundary

_Last updated: 2026-05-12._

## This project is the borrower / frontend project only

This Lovable project contains **only** the borrower-facing and public surface of
approvU. The admin panel is being designed and built in a **separate Lovable
project** and is intentionally out of scope here.

Codex will later merge the two Lovable projects into one unified approvU
application before any production database wiring.

## In scope (this project)

- Public website (`/`, `/purchase`, `/refinance`, `/pre-purchase`)
- Qualification flow & Mortgage Snapshot
- Account handoff / login / 2FA (`/internal/account-handoff`)
- Mortgage Offers
- Borrower Portal (`/portal/*`)
- Mortgage Application Hub (`/applications/$applicationId/*`)
- Document Upload, Lender Response, Funding Conditions
- Wallet / Home Life Bundle
- Mortgage Tools (`/portal/tools/*`)
- Borrower Settings (`/portal/settings/*`)

## Out of scope (separate Admin Lovable project)

- Admin Dashboard
- Partner Growth Engine, Partner Directory
- Offer Builder (Standard Offers, Partner Offers, Offer Bundles)
- Qualification admin views
- Mortgage Application Command Centre
- Condition Engine, Document Vault (admin)
- Lenders, Mortgage Products, Pricing Engine
- Property Intelligence
- Users, Roles, and Admin Settings

## Implication for QA & Codex

Missing admin routes in **this** project are not bugs. They are tracked in the
separate Admin Lovable project. Codex should merge the two projects before
treating any "admin not built" item here as actionable.

Route conventions after merge:
- Borrower routes remain under `/`, `/qualification`, `/portal`, `/applications`.
- Admin routes will live under `/admin` (or `/internal/admin`).