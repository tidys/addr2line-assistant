import * as vscode from "vscode"
import { join } from "path"
class Assets {
  private context: vscode.ExtensionContext | null = null;
  init(context: vscode.ExtensionContext) {
    this.context = context;
  }

  getAdbFile() {
    const exePath = join(this.context!.extensionPath, "static", "generator-bin.exe");
    return exePath;
  }
}