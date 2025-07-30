import * as CP from 'node:child_process';
import * as SV from 'semver';

export type RegistryPackage = {
  name: string,
  description: string,
  'dist-tags': Record<string,string>,
  versions: Record<string, object>,
};
let registry: Promise<string> | null = null;

export function getRegistryUrl() {
    return new Promise<string>((resolve, reject)=>{
        const chunks: string[] = [];

        const child = CP.spawn('npm config get registry', { shell: true, stdio: [ 'pipe', 'pipe', 'inherit' ] });
        child.on('error', (err: Error)=>reject(err));
        child.on('exit', (code: number | null)=>{
            if (code === null || code) return reject(new Error(`exit code ${code}`));
            resolve(chunks.join('').trim());
        });
        child.stdout.on('data', (chunk)=>chunks.push(chunk));
        child.stdin.end();
    });
}

export async function getPackageData(name: string) {
    registry = registry ?? getRegistryUrl();
    return (await fetch(`${await registry}/${name}`)).json() as Promise<RegistryPackage>;
}

export function getAllVersions(data: RegistryPackage, spec: string = '*') {
    return Object.keys(data.versions).filter(v=>SV.satisfies(v, spec)).sort((a,b)=>SV.compare(a,b));
}
export function getMaxVersion(data: RegistryPackage, spec: string = '*') {
    return getAllVersions(data, spec).pop();
}
export async function respecifyDependency(name: string, spec: string) {
    if (!/^[\^~]/.test(spec)) return spec;
    const prefix = spec[0];
    console.debug(`Getting Registry Information for ${name}`);
    const data = await getPackageData(name);
    const version = getMaxVersion(data, spec);
    const newspec = `${prefix}${version}`;
    if (newspec !== spec) console.debug(`Updating ${name} tp ${newspec}`);
    return newspec;
}
