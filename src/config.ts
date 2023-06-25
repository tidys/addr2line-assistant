import * as vscode from "vscode";
import { existsSync, unlinkSync } from "fs";
const id = "a2la";
const KEY_IPS = 'ips';
const KEY_APPS = 'apps';
const KEY_LEAK_FILE = "leak-file";
const KEY_LOCAL_FILES = "local-files";
const KEY_EXECUTABLE_FILE = "executable-file";

export function getKey(ip: string, app: string) {
  return `${ip}-${app}`;
}
export function getExecutableFile(): string {
  const config = vscode.workspace.getConfiguration(id);
  return config.get(KEY_EXECUTABLE_FILE, "");
}
export async function setExecutableFile(file: string) {
  const config = vscode.workspace.getConfiguration(id);
  return await config.update(KEY_EXECUTABLE_FILE, file);
}


export function getLocalFiles(ip: string, app: string): string[] {
  const key = getKey(ip, app);
  const config = vscode.workspace.getConfiguration(id);
  const ret: Record<string, string[]> = config.get<Record<string, string[]>>(KEY_LOCAL_FILES, {});
  return ret[key] || [];
}

export async function addLocalFiles(ip: string, app: string, file: string) {
  const config = vscode.workspace.getConfiguration(id);
  const key = getKey(ip, app);
  let ret: Record<string, string[]> = config.get<Record<string, string[]>>(KEY_LOCAL_FILES, {});
  if (!ret[key]) {
    ret[key] = [];
  }
  // ret[key].push(file);// 这么写更新不进去
  const arr = ret[key];
  arr.push(file);
  ret[key] = arr;
  await config.update(KEY_LOCAL_FILES, ret);
}

export async function removeLocalFiles(ip: string, app: string, file: string | null) {
  const config = vscode.workspace.getConfiguration(id);
  const key = getKey(ip, app);
  const ret: Record<string, string[]> = config.get<Record<string, string[]>>(KEY_LOCAL_FILES, {});
  if (!ret[key]) {
    ret[key] = [];
  }
  const deleFiles: string[] = [];
  if (file) {
    const idx = ret[key].findIndex(el => el === file);
    if (idx !== -1) {
      ret[key].splice(idx, 1);
      deleFiles.push(file);
    }
  } else {
    // delete file
    for (let i = 0; i < ret[key].length; i++) {
      deleFiles.push(ret[key][i]);
    }
    ret[key] = [];
  }
  for (let i = 0; i < deleFiles.length; i++) {
    if (existsSync(deleFiles[i])) {
      unlinkSync(deleFiles[i]);
    }
  }
  await config.update(KEY_LOCAL_FILES, ret);
}
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
  const ret = { err: 0, msg: '' };
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
  const ret = { err: 0, msg: '' };
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
  const ret = { err: 0, msg: '' };
  const config = vscode.workspace.getConfiguration(id);
  const apps = getApps();
  const index = apps.findIndex(el => el === pkg);
  if (index !== -1) {
    apps.splice(index, 1);
    await config.update(KEY_APPS, apps);
    return ret;
  } else {
    ret.err = 1;
    ret.msg = `未找到app:${pkg}`;
    return ret;
  }
}
export async function removeIP(ip: string): Promise<{ err: number, msg: string }> {
  const ret = { err: 0, msg: '' };
  const config = vscode.workspace.getConfiguration(id);
  const ips = getIPS();
  const index = ips.findIndex(el => el === ip);
  if (index !== -1) {
    ips.splice(index, 1);
    await config.update(KEY_IPS, ips);
    return ret;
  } else {
    ret.err = 1;
    ret.msg = `未找到ip:${ip}`;
    return ret;
  }
}