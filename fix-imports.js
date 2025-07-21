#!/usr/bin/env node

/**
 * Script to fix missing .js extensions in TypeScript imports
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fixImportsInFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;

    // Fix relative imports that don't have .js extension
    const importRegex = /from\s+['"](\.\.?\/[^'"]+)(?<!\.js)['"]/g;
    content = content.replace(importRegex, (match, importPath) => {
      modified = true;
      return `from '${importPath}.js'`;
    });

    // Fix imports from errors folder
    content = content.replace(/from\s+['"]\.\.\/errors['"]/g, "from '../errors/index.js'");
    content = content.replace(/from\s+['"]\.\.\/\.\.\/errors['"]/g, "from '../../errors/index.js'");
    content = content.replace(/from\s+['"]\.\.\/\.\.\/errors\.js['"]/g, "from '../../errors/index.js'");
    
    // Fix imports from types folder
    content = content.replace(/from\s+['"]\.\.\/\.\.\/types\.js['"]/g, "from '../../types/index.js'");

    if (modified) {
      await fs.writeFile(filePath, content);
      console.log(`Fixed imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

async function findTypeScriptFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('build')) {
      files.push(...await findTypeScriptFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  console.log('Fixing TypeScript imports...');
  
  const srcDir = path.join(__dirname, 'src');
  const files = await findTypeScriptFiles(srcDir);
  
  console.log(`Found ${files.length} TypeScript files`);
  
  for (const file of files) {
    await fixImportsInFile(file);
  }
  
  console.log('Done!');
}

main().catch(console.error);