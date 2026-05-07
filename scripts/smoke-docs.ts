import * as fs from 'fs-extra';
import * as path from 'node:path';

async function checkLinks(file: string, content: string, rootDir: string) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  let hasErrors = false;
  
  while ((match = linkRegex.exec(content)) !== null) {
    const link = match[2];
    if (link.startsWith('http') || link.startsWith('#')) continue;
    
    const targetPath = path.resolve(path.dirname(file), link);
    if (!await fs.pathExists(targetPath)) {
      console.error(`❌ Broken link in ${file}: ${link} -> ${targetPath}`);
      hasErrors = true;
    }
  }
  return hasErrors;
}

async function scanDocs(dir: string, rootDir: string): Promise<boolean> {
  let hasErrors = false;
  if (!await fs.pathExists(dir)) return false;

  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      hasErrors = await scanDocs(fullPath, rootDir) || hasErrors;
    } else if (entry.name.endsWith('.md')) {
      const content = await fs.readFile(fullPath, 'utf8');
      hasErrors = await checkLinks(fullPath, content, rootDir) || hasErrors;
    }
  }
  return hasErrors;
}

async function main() {
  const rootDir = process.cwd();
  console.log('Running docs smoke test...');

  let hasErrors = false;
  
  // Check README.md
  const readmeContent = await fs.readFile(path.join(rootDir, 'README.md'), 'utf8');
  hasErrors = await checkLinks(path.join(rootDir, 'README.md'), readmeContent, rootDir) || hasErrors;

  // Check docs dir
  hasErrors = await scanDocs(path.join(rootDir, 'docs'), rootDir) || hasErrors;

  if (hasErrors) {
    throw new Error('Broken links found in documentation.');
  }

  console.log('✅ Docs smoke test passed.');
}

main().catch((err) => {
  console.error('❌ Smoke docs failed:', err.message);
  process.exit(1);
});
