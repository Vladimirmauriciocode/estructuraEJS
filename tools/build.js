const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const root = path.join(__dirname, '..');
const viewsDir = path.join(root, 'views');
const pagesDir = path.join(viewsDir, 'pages');
const outDir = path.join(root, 'dist');

if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

// render each .ejs file in views/pages
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.ejs'));

function titleFromName(name) {
  if (name === 'index') return 'Home';
  return name
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

async function build() {
  for (const file of files) {
    const filePath = path.join(pagesDir, file);
    const name = file.replace(/\.ejs$/, '');
    const outFile = name === 'index' ? path.join(outDir, 'index.html') : path.join(outDir, `${name}.html`);

    // try to load optional per-page JSON metadata (e.g. about.json next to about.ejs)
    const metaPath = path.join(pagesDir, `${name}.json`);
    let data = {};
    if (fs.existsSync(metaPath)) {
      try {
        data = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      } catch (err) {
        console.warn(`Warning: no se pudo parsear ${metaPath}:`, err.message);
      }
    }

    // ensure there's a title available for templates that use <%= title %>
    if (!data.title) data.title = titleFromName(name);

    const html = await ejs.renderFile(filePath, data, {
      root: viewsDir, // permite includes desde views/partials
      async: true,
      views: [viewsDir, pagesDir, path.join(viewsDir, 'partials')],
    });

    fs.writeFileSync(outFile, html, 'utf8');
    console.log('Rendered:', outFile);
  }

  // opcional: generar 404 si no existe
  if (!fs.existsSync(path.join(outDir, '404.html'))) {
    fs.writeFileSync(path.join(outDir, '404.html'), '<h1>404</h1>', 'utf8');
  }

  // copiar carpeta public si existe
  const publicSrc = path.join(root, 'public');
  const publicDest = path.join(outDir, 'public');
  if (fs.existsSync(publicSrc)) {
    copyRecursive(publicSrc, publicDest);
    console.log('Copied public -> dist/public');
  }

  console.log('Build completo. Carpeta dist/ lista para desplegar.');
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});