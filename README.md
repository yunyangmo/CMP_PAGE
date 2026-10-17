# CMP Project Page

Research project website for **Learning Context-Aware Motion Priors for Humanoid Control**.

- **Paper:** https://arxiv.org/abs/2608.03234
- **Website:** https://yunyangmo.github.io/cmp-project-page/ (after GitHub Pages is enabled)
- **Code:** maintained in a separate private repository; not yet publicly released.

## Preview locally

This is a static HTML/CSS/JavaScript website. No build step, Node.js,
Isaac Gym, model checkpoint, or server-side application is required.

From the repository root:

```bash
python -m http.server 8000
```

Open http://localhost:8000/ in your browser. JavaScript and WebGL are needed
for interactive demonstrations. The location interaction is an illustration,
not live CMP inference. The reference scene replays precomputed animations.

## Deploy with GitHub Pages

Open your public GitHub repository's **Settings > Pages** and select:

- **Source:** Deploy from a branch
- **Branch:** `main`
- **Folder:** `/(root)`

The site will be published at
https://yunyangmo.github.io/cmp-project-page/ when deployment finishes.

Do not move `index.html` into a subfolder: its local `modules/` and `static/`
paths expect all three entries at repository root. `.nojekyll` disables Jekyll processing.

## Included media

- Drag-interactive task context illustration (`modules/location/`).
- Interactive 3D reference-motion viewer (`modules/reference/scene.html`).
- AMP versus CMP-AMP early/late comparison videos (`static/videos/`).

No external fonts or CDN assets are required.
