import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
// docs contains only generated static website files; it is the Pages publish root.
await mkdir('docs', { recursive: true });
for (const name of await readdir('docs')) await rm(`docs/${name}`, { recursive: true, force: true });
await cp('dist', 'docs', { recursive: true });
await writeFile('docs/.nojekyll', '');
console.log('GitHub Pages site prepared in docs/');
