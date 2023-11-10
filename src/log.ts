import * as vscode from "vscode";
import {
  ErrorHandler,
  LanguageClient, LanguageClientOptions, RevealOutputChannelOn,
} from 'vscode-languageclient/node';
export class Log {
  private langClient: LanguageClient | null = null;
  private logInstance: vscode.OutputChannel | null = null;
  initLog() {
    this.logInstance = vscode.window.createOutputChannel("a2la");
    this.logInstance.show();
  }
  private testLanguageServer() {
    // 使用搞不定在output里面输出带链接的路径日志
    let handler: ErrorHandler | null = null;
    // this.logInstance.appendLine(`${vscode.Uri.parse("https://example.com").toString()}`);
    this.langClient = new LanguageClient("a2la-lang", {
      run: {
        command: "",
      },
      debug: {
        command: ""
      }
    }, {
      documentSelector: [
        // { scheme: 'file' },
        { scheme: 'untitled' }
      ],
      progressOnInitialization: true,
      revealOutputChannelOn: RevealOutputChannelOn.Never,
      errorHandler: {
        closed: () => {
          return handler!.closed();
        },
        error(error, message, count) {
          return handler!.error(error, message, count);
        }
      }
    });
    this.langClient?.createDefaultErrorHandler();
    // this.langClient.start();
    // const file = "E:\\proj\\addr2line-assistant\\node_modules\\eslint\\lib\\api.js"
    const file = "E:/proj/addr2line-assistant/node_modules/eslint/lib/api.js";
    // this.langClient.info(`${file}`);
    this.langClient.info(`${file}`);
    this.langClient.info(`file://c:/1.txt`); // 带上file协议有flow link了，但是打开的不正确
    this.langClient.info(`[111](${file})`);

    // this.langClient.onNotification()
    // this.langClient.outputChannel.show();
    // this.langClient.info(`${vscode.Uri.parse(file).toString()}`);

  }
  output(log: string) {
    if (this.logInstance) {
      this.logInstance.appendLine(log);
      this.logInstance.show();
    }
  }
}

export const log = new Log();