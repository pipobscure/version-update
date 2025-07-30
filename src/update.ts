#!/usr/bin/env node

import * as PT from 'node:path';
import * as PKG from './package.js';

async function main() {
    const cwd = process.cwd();
    const arg = PT.resolve(process.argv[2] ?? cwd);
    const base = PT.basename(arg) === 'package.json' ? PT.dirname(arg) : arg;
    process.chdir(base);
    const data = await PKG.loadPackage();
    await PKG.updateDependencies(data);
    await PKG.savePackage(data);
    process.chdir(cwd);
}

if (module.id==='.') main().catch(e=>console.error(e));
