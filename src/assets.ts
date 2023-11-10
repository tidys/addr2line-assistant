import * as vscode from "vscode";
import { join } from "path";
import { existsSync } from "fs";
import { commandSync } from "execa"
export class Assets {
  private context: vscode.ExtensionContext | null = null;
  init(context: vscode.ExtensionContext) {
    this.context = context;
    if (this.isMac) {
      // chmod +x
      this.chmodX();
    }
  }
  get isWindows() {
    return process.platform === 'win32';
  }
  get isMac() {
    return process.platform === 'darwin';
  }
  private _filePath(file: string) {
    let exePath = null;
    let platformDir = "";
    const platform = process.platform;
    if (platform === 'win32') {
      platformDir = "win32";
    } else if (platform === 'darwin') {
      platformDir = "mac";
    }
    exePath = join(this.context!.extensionPath, "static", platformDir, file);
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
  chmodX(): string {
    if (!this.isMac) {
      return "";
    }
    const files: Array<string | null> = [
      this.getAddr2lineExecutable(),
      this.getNM(),
      this.getObjDump(),
      this.getReadElf(),
    ];
    let err: string = "";
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cmd = `chmod +x ${file}`;
      const { stdout, stderr } = commandSync(cmd);
      if (stderr) {
        err += stderr;
      }
    }
    return err;
  }
}
export const assets = new Assets();