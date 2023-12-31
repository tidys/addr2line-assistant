import * as vscode from "vscode";
import { existsSync, unlinkSync } from "fs";
const id = "a2la";
const KEY_IPS = 'ips';
const KEY_APPS = 'apps';
const KEY_LEAK_FILE = "leak-file";
const KEY_LOCAL_FILES = "local-files";
const KEY_EXECUTABLE_FILE = "executable-file";
const KEY_SO_FILES = "soFiles";
const KEY_LEAK_RANK = "leak-rank";
const KEY_SO_SOURCE_DIRECTORIES = "soSourceDirectories";
const KEY_DEFAULT_SO_FILE = "defaultSoFile";
export function getKey(ip: string, app: string) {
  return `${ip}-${app}`;
}
const cfgScope: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global;

export async function addSoSourceDirectory(directories: string[]) {
  const config = vscode.workspace.getConfiguration(id);
  let ret: string[] = config.get<string[]>(KEY_SO_SOURCE_DIRECTORIES, []);
  let change = false;
  directories.forEach(dir => {
    if (!ret.find(el => el === dir)) {
      ret.push(dir);
      change = true;
    }
  });
  if (change) {
    await config.update(KEY_SO_SOURCE_DIRECTORIES, ret, cfgScope);
    return true;
  }
  return false;
}

export function getSoSourceDirectories() {
  const config = vscode.workspace.getConfiguration(id);
  let ret: string[] = config.get<string[]>(KEY_SO_SOURCE_DIRECTORIES, []);
  return ret;
}

export async function setDefaultSoFile(file: string) {
  const config = vscode.workspace.getConfiguration(id);
  return await config.update(KEY_DEFAULT_SO_FILE, file, cfgScope);
}

export function getDefaultSoFile() {
  const config = vscode.workspace.getConfiguration(id);
  return config.get(KEY_DEFAULT_SO_FILE, "");
}

export async function setLeakRank(rank: number) {
  const config = vscode.workspace.getConfiguration(id);
  return await config.update(KEY_LEAK_RANK, rank, cfgScope);
}
export function getLeakRank() {
  const config = vscode.workspace.getConfiguration(id);
  return config.get(KEY_LEAK_RANK, 20);
}
export function getSoFiles(): string[] {
  const config = vscode.workspace.getConfiguration(id);
  return config.get(KEY_SO_FILES, []);
}

export async function addSoFile(file: string[]) {
  const config = vscode.workspace.getConfiguration(id);
  let ret: string[] = config.get<string[]>(KEY_SO_FILES, []);
  let change = false;
  file.forEach(filePath => {
    if (!ret.find(el => el === filePath)) {
      ret.push(filePath);
      change = true;
    }

  });
  if (change) {
    await config.update(KEY_SO_FILES, ret, cfgScope);
    return true;
  }
  return false;
}
export async function removeSoFile(file: string): Promise<boolean> {
  const config = vscode.workspace.getConfiguration(id);
  let ret: string[] = config.get<string[]>(KEY_SO_FILES, []);
  const idx = ret.findIndex(el => el === file);
  if (idx !== -1) {
    ret.splice(idx, 1);
    const defaultSoFile = getDefaultSoFile();
    if (defaultSoFile && defaultSoFile === file) {
      await setDefaultSoFile("");
    }
    await config.update(KEY_SO_FILES, ret, cfgScope);
    return true;
  }
  return false;
}
export function getExecutableFile(): string {
  const config = vscode.workspace.getConfiguration(id);
  return config.get(KEY_EXECUTABLE_FILE, "");
}
export async function setExecutableFile(file: string) {
  const config = vscode.workspace.getConfiguration(id);
  return await config.update(KEY_EXECUTABLE_FILE, file, cfgScope);
}

export function getLocalFiles(ip: string, app: string): string[] {
  const key = getKey(ip, app);
  const config = vscode.workspace.getConfiguration(id);
  const ret: Record<string, string[]> = config.get<Record<string, string[]>>(KEY_LOCAL_FILES, {});
  return ret[key] || [];
}
export async function removeLocalFile(ip: string, app: string, file: string): Promise<boolean> {
  const config = vscode.workspace.getConfiguration(id);
  const key = getKey(ip, app);
  let ret: Record<string, string[]> = config.get<Record<string, string[]>>(KEY_LOCAL_FILES, {});
  if (ret[key]) {
    let arr = ret[key];
    const idx = arr.findIndex(el => el === file);
    if (idx !== -1) {
      arr.splice(idx, 1);
      ret[key] = arr;
      await config.update(KEY_LOCAL_FILES, ret, cfgScope);
      if (existsSync(file)) {
        unlinkSync(file);
      }
      return true;
    }
  }
  return false;
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
  await config.update(KEY_LOCAL_FILES, ret, cfgScope);
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
  await config.update(KEY_LOCAL_FILES, ret, cfgScope);
}
export function getLeakFile() {
  const config = vscode.workspace.getConfiguration(id);
  return config.get<string>(KEY_LEAK_FILE, "");
}
export async function setLeakFile(file: string): Promise<boolean> {
  const config = vscode.workspace.getConfiguration(id);
  await config.update(KEY_LEAK_FILE, file, cfgScope);
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
    await config.update(KEY_APPS, apps, cfgScope);
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
    await config.update(KEY_IPS, ips, cfgScope);
    return ret;
  } else {
    ret.err = 1;
    ret.msg = `发现相同的IP:${ip}`;
    return ret;
  }
}
export async function modifyIP(oldIP: string, newIP: string): Promise<{ err: number, msg: string }> {
  const ret = { err: 0, msg: '' };
  const config = vscode.workspace.getConfiguration(id);
  const ips = getIPS();
  let find = false;
  for (let i = 0; i < ips.length; i++) {
    if (ips[i] === oldIP) {
      ips[i] = newIP;
      await config.update(KEY_IPS, ips, cfgScope);
      find = true;
      break;
    }
  }
  if (find) {
    // 修改files
    const addLocalFiles: Record<string, string[]> = config.get<Record<string, string[]>>(KEY_LOCAL_FILES, {});
    const newAddLocalFiles: Record<string, string[]> = {};
    let replace = false;

    for (let key in addLocalFiles) {
      if (key.indexOf(oldIP) !== -1) {
        const newKey = key.replace(oldIP, newIP);
        newAddLocalFiles[newKey] = addLocalFiles[key];
        replace = true;
      } else {
        newAddLocalFiles[key] = addLocalFiles[key];
      }
    }
    if (replace) {
      await config.update(KEY_LOCAL_FILES, newAddLocalFiles, cfgScope);
    }
  } else {
    ret.err = 1;
    ret.msg = `修改失败，没有找打 ${oldIP}`;
  }
  return ret;
}
export async function removeAPP(pkg: string): Promise<{ err: number, msg: string }> {
  const ret = { err: 0, msg: '' };
  const config = vscode.workspace.getConfiguration(id);
  const apps = getApps();
  const index = apps.findIndex(el => el === pkg);
  if (index !== -1) {
    apps.splice(index, 1);
    await config.update(KEY_APPS, apps, cfgScope);
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
    await config.update(KEY_IPS, ips, cfgScope);
    return ret;
  } else {
    ret.err = 1;
    ret.msg = `未找到ip:${ip}`;
    return ret;
  }
}