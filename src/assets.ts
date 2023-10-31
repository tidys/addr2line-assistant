import * as vscode from "vscode";
import { join } from "path";
import { existsSync } from "fs";
export class Assets {
  private context: vscode.ExtensionContext | null = null;
  init(context: vscode.ExtensionContext) {
    this.context = context;
  }
  private _filePath(file: string) {
    let exePath = null;
    const platform = process.platform;
    if (platform === 'win32') {
      exePath = join(this.context!.extensionPath, "static", platform, file);
    }
    if (exePath && existsSync(exePath)) {
      return exePath;
    } else {
      return null;
    }
  }
  getAddr2lineExecutable() {
    return this._filePath("addr2line.exe");
  }
  getNM() {
    return this._filePath("nm.exe");
  }
  getObjDump() {
    return this._filePath("objdump.exe");
  }
  getReadElf() {
    return this._filePath("readelf.exe");
  }
}
export const assets = new Assets();