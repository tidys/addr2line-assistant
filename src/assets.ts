import * as vscode from "vscode";
import { join } from "path";
import { existsSync } from "fs";
export class Assets {
  private context: vscode.ExtensionContext | null = null;
  init(context: vscode.ExtensionContext) {
    this.context = context;
  }

  getAddr2lineExecutable() {
    let exePath = null;
    const platform = process.platform;
    if (platform === 'win32') {
      exePath = join(this.context!.extensionPath, "static", platform, "addr2line.exe");
    }
    if (exePath && existsSync(exePath)) {
      return exePath;
    } else {
      return null;
    }
  }
}
export const assets = new Assets();