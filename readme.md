````markdown
# ⚡ SeamlessRouter

[![TypeScript](https://img.shields.io/badge/typescript-%233178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-bad ge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](./LICENSE)

---

### 🧩 About the Project

**SeamlessRouter** is a lightweight TypeScript router for AJAX navigation,
which makes transitions between pages smooth, without full page reloads.

💨 Faster than standard navigation
⚙️ Compatible with any CMS (e.g., MODX)
🧠 Caches pages and updates only changed elements (head, footer, meta)
🪶 Minimal dependencies - pure TypeScript

---

### 📦 Installation and Run

```bash
# Clone the repository
git clone https://github.com/yourname/SeamlessRouter.git

cd SeamlessRouter

# Install dependencies
pnpm install

# Start the dev server (Vite)
pnpm dev

# Build the library
pnpm build
````

After build, the file will be located in:

```
dist/SeamlessRouter.umd.js
```

---

### 🧠 Structure Project

```
SeamlessRouter/
├── src/
│ ├── core/
│ │ └── router.ts # Main router logic
│ └── index.ts # Entry point
├── index.html # Dev example
├── vite.config.ts # Build configuration
├── tsconfig.json # TypeScript settings
└── .gitignore
```

---

### 🚀 How it works

1. Intercepts clicks on links (`<a>` and `<button>`).
2. Makes a `fetch()` request for a new page.
3. Updates only changed blocks (head, meta, scripts, content).
4. Gracefully rolls back to a normal page load if an error occurs.

---

### 🧰 Roadmap

* [ ] Intercept all `<a>` and `<button>` with a safe fallback
* [ ] Parse `<head>` and update `<meta>`
* [ ] Caching content in IndexedDB
* [ ] Update `history.pushState` and handle `popstate`
* [ ] Page transition animations

---

### 🤝 Contributions

Pull requests, improvements, and ideas are welcome!
Before PR, make sure the project is linted and built.

---

### 🪪 License

The project is distributed under the [MIT](./LICENSE) license.
Built with ❤️ for speed and smoothness.