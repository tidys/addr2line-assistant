import * as vscode from "vscode";
const id = "a2la";
const KeyPhones = 'phones';
export function getPhones() {
  const config = vscode.workspace.getConfiguration(id);
  return config.get<string[]>(KeyPhones, []);
}
export async function addPhone(ip: string): Promise<{ err: number, msg: string }> {
  const ret = { err: 0, msg: '' }
  const config = vscode.workspace.getConfiguration(id);
  const phones = getPhones();
  if (!phones.find(el => el === ip)) {
    phones.push(ip);
    await config.update(KeyPhones, phones);
    return ret;
  } else {
    ret.err = 1;
    ret.msg = `发现相同的IP:${ip}`;
    return ret;
  }
}

export async function removePhone(ip: string): Promise<{ err: number, msg: string }> {
  const ret = { err: 0, msg: '' }
  const config = vscode.workspace.getConfiguration(id);
  const phones = getPhones();
  const index = phones.findIndex(el => el === ip);
  if (index !== -1) {
    phones.splice(index, 1);
    await config.update(KeyPhones, phones);
    return ret;
  } else {
    ret.err = 1;
    ret.msg = `未找到ip:${ip}`
    return ret;
  }
}