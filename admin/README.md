# Ihle B2B Shop – Admin panel

Separate React app for Ihle staff to check the data exchanged with NAV (phase 1, as requested by Ihle):
**orders, customers, articles** (with search and filters) and the **import** of the NAV files.

```bash
npm install
npm run dev   # http://localhost:5174 (needs the backend on http://localhost:5000)
```

## Backend

All data comes from the backend (`../backend`): `/api` is forwarded to it by Vite (see `vite.config.js`).

- Login: admin accounts are stored in the database. Create one, or set a new password, with
  `npm run admin:create` in `../backend`. Only a bcrypt hash of the password is stored.
- Import: the file is checked by the backend (preview, nothing saved) and saved on "Import bestätigen".
- Order XML: built by the backend in NAV's format and downloaded from the order page.

## Product photos

Photos are uploaded under "Import → Fotos hochladen" (or for a whole folder with
`npm run photos:upload -- <folder>` in `../backend`). The backend stores two WebP sizes per photo and
matches them to articles by file name, exactly as NAV lists them in `<Pictures>` (`40000_001_01.jpg`).
An article is shown in the shop only once at least one of its photos is uploaded ("Wartet auf Fotos" until then).

Real NAV exports contain customer data: never copy them into this folder.
