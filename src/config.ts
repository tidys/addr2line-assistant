import * as vscode from "vscode";
const id = "a2la";
const KeyPhones = 'phones';
export function getPhones() {
  const config = vscode.workspace.getConfiguration(id);
  return config.get<string[]>(KeyPhones, []);
}
export async function addPhone(ip: string): Promise<boolean> {
  const config = vscode.workspace.getConfiguration(id);
  const phones = getPhones();
  if (!phones.find(el => el === ip)) {
    phones.push(ip);
    await config.update(KeyPhones, phones);
    return true;
  }
  return false;
}