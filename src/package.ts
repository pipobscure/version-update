import * as FS from 'node:fs/promises';

import { respecifyDependency } from './registry.js';

export type PackageJson = {
    name: string;
    version: string;
    description: string;
    dependencies: Record<string,string>,
    devDependencies: Record<string,string>,
    optionalDependencies: Record<string,string>,
    peerDependencies: Record<string,string>
}
export async function loadPackage() {
    return JSON.parse(await FS.readFile('package.json', 'utf-8')) as PackageJson;
}

async function updateDependencySection(id: string, data: Record<string, string>) {
    console.debug(`updating ${id}`);
    const items = await Promise.all((Object.entries(data).map(async ([ name, spec ])=>[ name, await respecifyDependency(name, spec) ])));
    return Object.fromEntries(items);
}
export async function updateDependencies(data: PackageJson) {
    const sections = Object.entries(data).filter(([ name ])=>['dependencies','devDependencies','optionalDependencies','peerDependencies'].includes(name));
    const updated = await Promise.all(sections.map(async ([name, data])=>[name, await updateDependencySection(name, data as Record<string,string>)]));
    return Object.assign(data, Object.fromEntries(updated)) as PackageJson;
}

export async function savePackage(data: PackageJson) {
    await FS.writeFile('package.json', JSON.stringify(data, undefined, '\t')+'\n');
}
