# User Management CRUD App

React + Vite + Tailwind CSS + Express + SQLite

## Cara Install & Jalankan

### 1. Pastikan Node.js sudah terinstall
Download dari https://nodejs.org (pilih LTS)

### 2. Install semua dependencies
```bash
npm run install-all
```

### 3. Jalankan (frontend + backend sekaligus)
```bash
npm run dev
```

### 4. Buka browser
- Frontend: http://localhost:5173
- API: http://localhost:3001

## Struktur Project
```
crud-react/
├── server/
│   └── server.js          # Express API + SQLite
├── client/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.jsx        # Main app
│   │   ├── api.js         # API helper
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Tailwind CSS
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── package.json           # Root scripts
└── README.md
```

## Fitur
- ✅ CRUD (Tambah, Lihat, Edit, Hapus)
- ✅ Search / cari user
- ✅ Validasi NIM unik
- ✅ Dark mode UI
- ✅ Responsive (mobile friendly)
- ✅ Toast notifications
- ✅ Modal forms
- ✅ Animasi
