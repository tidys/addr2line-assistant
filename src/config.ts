import * as vscode from "vscode";
const id = "a2la";
const KEY_IPS = 'ips';
const KEY_APPS = 'apps';
const KEY_LEAK_FILE = "leak-file";

export function getLeakFile() {
  const config = vscode.workspace.getConfiguration(id);
  return config.get<string>(KEY_LEAK_FILE, "");
}
export async function setLeakFile(file: string): Promise<boolean> {
  const config = vscode.workspace.getConfiguration(id);
  await config.update(KEY_LEAK_FILE, file);
  return true;
}

export function getIPS() {
  const config = vscode.workspace.getConfiguration(id);
  return config.get<string[]>(KEY_IPS, []);
}

export function getApps() {
  const config = vscode.workspace.getConfiguration(id);
  return config.get<string[]>(KEY_APPS, []);
}

export async function addApp(app: string): Promise<{ err: number, msg: string }> {
  const ret = { err: 0, msg: '' }
  const config = vscode.workspace.getConfiguration(id);
  const apps = getApps();
  if (!apps.find(el => el === app)) {
    apps.push(app);
    await config.update(KEY_APPS, apps);
    return ret;
  } else {
    ret.err = 1;
    ret.msg = `发现相同的APP:${app}`;
    return ret;
  }
}

export async function addIP(ip: string): Promise<{ err: number, msg: string }> {
  const ret = { err: 0, msg: '' }
  const config = vscode.workspace.getConfiguration(id);
  const ips = getIPS();
  if (!ips.find(el => el === ip)) {
    ips.push(ip);
    await config.update(KEY_IPS, ips);
    return ret;
  } else {
    ret.err = 1;
    ret.msg = `发现相同的IP:${ip}`;
    return ret;
  }
}
export async function removeAPP(pkg: string): Promise<{ err: number, msg: string }> {
  const ret = { err: 0, msg: '' }
  const config = vscode.workspace.getConfiguration(id);
  const apps = getApps();
  const index = apps.findIndex(el => el === pkg);
  if (index !== -1) {
    apps.splice(index, 1);
    await config.update(KEY_APPS, apps);
    return ret;
  } else {
    ret.err = 1;
    ret.msg = `未找到app:${pkg}`
    return ret;
  }
}
export async function removeIP(ip: string): Promise<{ err: number, msg: string }> {
  const ret = { err: 0, msg: '' }
  const config = vscode.workspace.getConfiguration(id);
  const ips = getIPS();
  const index = ips.findIndex(el => el === ip);
  if (index !== -1) {
    ips.splice(index, 1);
    await config.update(KEY_IPS, ips);
    return ret;
  } else {
    ret.err = 1;
    ret.msg = `未找到ip:${ip}`
    return ret;
  }
}