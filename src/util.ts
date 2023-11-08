import { basename, extname, normalize, join, dirname } from "path";
import { log } from "./log";
import * as os from 'os';
import { existsSync, readFileSync, writeFileSync } from "fs";
import * as vscode from 'vscode';
import { ensureFileSync, removeSync } from "fs-extra";
import { ExecaChildProcess, ExecaChildPromise, command } from "execa";
import { ChildProcess } from "child_process";
import { createHash } from "crypto";
import { getSoSourceDirectories } from "./config";

export function checkLeakFileValid(file: string): { err: number, msg: string } {
  const ret = { err: 0, msg: '' };
  return ret;
}
export function checkAppValid(pkg: string): { err: number, msg: string } {
  const ret = { err: 0, msg: '' };
  const arr = pkg.split('.');
  if (arr.length < 3) {
    ret.err = 1;
    ret.msg = "包名无效";
    return ret;
  }
  return ret;
}
export enum ERROR {
  OK = 0,
  NO_PORT = 1,
}

export function parseSourcemap(sourcemap: string): { file: string, line: number } | null {
  // 有时会出现(discriminator 5)，所以不能以行号结尾
  const matches = sourcemap.match(/(.*):(\d+)/);
  if (matches?.length === 3) {
    const file = normalize(matches[1]);//.replace(/\\/g, '/');
    const line = parseInt(matches[2]);
    return { file, line };
  }
  return null;
}
export function checkIsIpValid(str: string): { err: number, msg: string } {
  const ret = { err: 0, msg: '' };

  const regex = /^(\d{1,3}\.){3}\d{1,3}:\d{1,5}$/;
  if (regex.test(str)) {
    return ret;
  }
  const arr = str.split(".");
  if (arr.length !== 4) {
    ret.err = 1;
    ret.msg = '无效的IP';
    return ret;
  }
  const port = arr[3].split(':');
  if (port.length !== 2) {
    ret.err = ERROR.NO_PORT;
    ret.msg = "缺少端口";
    return ret;
  }
  return ret;
}
export function getSoHash(soFile: string): string {
  const hash = createHash('md5');
  const soBuffer = readFileSync(soFile);
  const soHash = hash.update(Buffer.from(soBuffer)).digest("hex");
  return soHash;
}
export async function saveCommandResultToFile(opts: {
  cmd: string, soFile: string, dir: string,
  callback: (process: ExecaChildProcess) => void
}) {
  const { cmd, soFile, dir, callback } = opts;
  log.output(`cmd: ${cmd}`);
  const bName = basename(soFile);
  const ext = extname(soFile);
  const fileName = bName.substring(0, bName.length - ext.length);
  const soHash = getSoHash(soFile);
  const resultFile = join(os.homedir(), dir, `${fileName}-${soHash}.txt`);
  if (existsSync(resultFile)) {
    const btnReGen: string = "重新生成";
    const btnOpen: string = "打开";
    const btnCancel: string = "取消";
    const result = await vscode.window.showInformationMessage(`发现已经有${basename(resultFile)}，是否重新生成？`, {}, btnOpen, btnReGen, btnCancel);
    if (result === btnReGen) {
    } else if (result === btnOpen) {
      vscode.workspace.openTextDocument(resultFile).then(
        (doc) => {
          vscode.window.showTextDocument(doc, {});
        },
        (error) => {
          const msg = decodeURIComponent(error.message);
          vscode.window.showErrorMessage(msg);
        });
      return;
    } else if (result === btnCancel) {
      return;
    }
  }
  ensureFileSync(resultFile);
  writeFileSync(resultFile, "");
  log.output(`result save in: ${resultFile}`);
  const uri = vscode.Uri.file(resultFile);
  // 先创建打开一个文本
  vscode.workspace.openTextDocument(uri).then(doc => {
    vscode.window.showTextDocument(doc, vscode.ViewColumn.One).then(editor => {

      function insertLine(str: string) {
        // const ins = new vscode.SnippetString();
        // ins.appendText(str);
        // ins.appendText(`\n`);
        // editor.insertSnippet(ins, doc.lineAt(0).range.start);

        editor.edit((editBuilder) => {
          const newPos = new vscode.Position(editor.document.lineCount + 1, 0);
          editBuilder.insert(newPos, str + os.EOL);
          var endPos = new vscode.Position(newPos.line + 1, 0);
          if (true) {
            // scroll to end
            var range = new vscode.Range(newPos, endPos);
            editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
          }
        });
      }
      insertLine(`${cmd} result`);

      const process = command(cmd, { encoding: 'utf-8', cwd: dirname(soFile) });
      process.stdout?.on('data', (str: Buffer) => {
        insertLine(str.toString());
      });
      process.stderr?.on('data', (str: string) => {
        log.output(str);
      });
      process.on('close', async () => {
        insertLine("---end---");
        log.output('close');
        vscode.window.showInformationMessage(`finished: ${cmd}`);
        if (!await editor.document.save()) {
          vscode.window.showInformationMessage("save failed");
        }
      });
      callback(process);
    });
  });

}

/**
 * 
 * @param file 来自addr2line，需要将地址转换下在进行打开
 */
export function openEngineSourceFile(file: string, line: number) {
  const dirs = getSoSourceDirectories();

  for (let i = 0; i < dirs.length; i++) {
    const dir = dirs[i];
    const fileArray = file.split('\\');
    if (!fileArray.length) {
      return;
    }

    while (fileArray.length) {
      fileArray.splice(0, 1);
      const curPath = fileArray.join('/');
      const resultPath = join(dir, curPath);
      if (existsSync(resultPath)) {
        vscode.workspace.openTextDocument(resultPath).then(doc => {
          vscode.window.showTextDocument(doc, { selection: new vscode.Range(line - 1, 0, line - 1, 0) });
        });
        return;
      }
    }
  }
}