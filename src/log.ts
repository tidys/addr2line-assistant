import * as vscode from "vscode";

export class Log {
  private logInstance: vscode.OutputChannel | null = null;
  initLog() {
    this.logInstance = vscode.window.createOutputChannel("a2la");
    this.logInstance.show();
  }
  output(log: string) {
    if (this.logInstance) {
      this.logInstance.appendLine(log);
    }
  }
}

export const log = new Log();