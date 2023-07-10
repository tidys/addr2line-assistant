import * as vscode from 'vscode';
import { addApp, addIP, getLeakFile, getIPS, removeAPP, removeIP, setLeakFile, getKey, addLocalFiles, removeLocalFiles, setExecutableFile, modifyIP, setLeakRank, getExecutableFile, removeLocalFile, getApps } from './config';
import { ERROR, checkAppValid, checkIsIpValid, parseSourcemap } from './util';
import { MyTreeItem, MyTreeViewDataProvider } from './treeview';
import { log } from './log';
import { leakReporter } from './leak-reporter';
import { existsSync, readFileSync } from 'fs';
import { assets } from './assets';
import { spawn } from 'child_process';
import { join } from 'path';
import * as ADbDriver from "adb-driver";
import { remoteDevicesFileExist } from './adb';
import { homedir, type } from 'os';
import { ensureFileSync, unlinkSync } from 'fs-extra';

export function activate(context: vscode.ExtensionContext) {
  assets.init(context);
  log.initLog();

  const treeDataProvider = new MyTreeViewDataProvider();
  vscode.window.registerTreeDataProvider("addr2line:main", treeDataProvider);

  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.set-leak-rank', async () => {
    const num = await vscode.window.showInputBox({ title: '请输入过滤数量', value: "20" })
    if (!num) { return; }
    await setLeakRank(parseInt(num));
  }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.pull-leak-images', async () => {
    const apps = getApps();
    if (!apps.length) {
      vscode.window.showInformationMessage("请先添加app");
      return;
    }
    // choose app
    let appName = "";
    if (apps.length > 1) {
      const ret = await vscode.window.showQuickPick(apps, { title: "选择app", placeHolder: apps[0] });
      if (!ret) { return; }
      appName = ret;
    } else {
      appName = apps[0];
    }
    // 1. get leak image count
    let imageCount = 0;
    {
      const cmd = `adb shell am broadcast -a ${appName}.leak -e imageCount "vscode"`;
      const ret: any = await ADbDriver.execADBCommand(cmd);
      if (typeof ret !== "string") {
        console.log(ret.message);
        log.output(ret.message);
        return;
      }
      // Broadcasting: Intent { act=xx.leak flg=0x400000 (has extras) }
      // Broadcast completed: result=0
      // Broadcast completed: result=0, data="123"
      const arr = ret.split("\n");
      if (arr.length <= 2) {
        log.output(`无法解析的返回数据:${ret}`);
        return;
      }
      const matchResult = arr[1].match(/^Broadcast completed: result=0, data=(.*)/);
      if (!matchResult) {
        return;
      }
      let str = matchResult[1].trim();
      if (str.startsWith("\"")) {
        str = str.substring(1, str.length);
      }
      if (str.endsWith("\"")) {
        str = str.substring(0, str.length - 1);
      }
      imageCount = parseInt(str) || 0;
      log.output(`find ${imageCount} leak files`);
    }

    // 2. notify app save leak image to devices location
    if (imageCount <= 0) {
      return;
    }
    {
      const cmd = `adb shell am broadcast -a ${appName}.leak -e imageSave "vscode"`;
      const ret: any = await ADbDriver.execADBCommand(cmd);
      if (typeof ret !== "string") {
        console.log(ret.message);
        log.output(ret.message);
        return;
      }
    }
    // 3. pull leak image files to computer location
    const localDir = join(homedir(), `leak-images`, `${new Date().getTime()}-${imageCount}`);
    {
      for (let i = 1; i <= imageCount; i++) {
        // cocos2dx image.saveFile("/data/user/0/pkg/files/x.png")
        const remoteFile = `/data/user/0/${appName}/files/${i}.png`;
        const exist = await remoteDevicesFileExist(remoteFile);
        if (exist) {
          const localFile = join(localDir, `${i}.png`);
          ensureFileSync(localFile);
          {
            const cmd = `adb exec-out run-as ${appName} cat files/${i}.png > ${localFile}`;
            const ret: any = await ADbDriver.execADBCommand(cmd);
            if (typeof ret === "string" && ret.length === 0) {
              log.output(`Success:${localFile}`);
            }
            else if (typeof ret === "string" && ret.length > 0) {
              log.output(`Failed:${ret}`);
              unlinkSync(localFile);
              break;
            } else if (ret.message) {
              log.output(`Failed:${ret.message})`);
              unlinkSync(localFile);
              break;
            }
          }
          // 需要root权限
          if (false) {
            const cmd = `adb pull ${remoteFile} ${localFile}`;
            const ret: any = await ADbDriver.execADBCommand(cmd);
            if (typeof ret !== 'string') {
              // failed
            }
          }
        }
      }
    }
    vscode.window.showInformationMessage(`pull ${imageCount} leak images successfully:${localDir}`);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.modifyIP', async (treeItem: MyTreeItem) => {
    if (treeItem) {
      // 大部分情况下都是修改端口
      const { ip } = treeItem;
      let selectBeginIndex = ip.indexOf(":") + 1;
      const newIP = await vscode.window.showInputBox({ title: "请输入", value: ip, valueSelection: [selectBeginIndex, ip.length] });
      if (!newIP) { return; }
      let ret = checkIsIpValid(newIP);
      if (ret.err !== ERROR.OK) {
        log.output(`无效的IP:${newIP}`);
        return;
      }

      ret = await modifyIP(ip, newIP);
      if (!ret.err) {
        treeDataProvider.refresh();
      }
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.profile', async () => {
    const panel = vscode.window.createWebviewPanel("", "profile", vscode.ViewColumn.One, {
      retainContextWhenHidden: true,
      enableScripts: true
    });
    let html = readFileSync(join(context.extensionPath, "static", "profile", "index.html"), "utf-8");
    const jsFile = join(context.extensionPath, "static", "profile", "index.js");
    const indexJS = panel.webview.asWebviewUri(vscode.Uri.file(jsFile));
    panel.webview.html = html.replace("${indexJS}", indexJS.toString());
    panel.webview.onDidReceiveMessage((message: any) => {
      console.log(message);
    });
    panel.onDidDispose(() => {

    });
    panel.webview.postMessage("from vscode");
  }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.refresh', async () => {
    treeDataProvider.refresh();
  }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.removeLeakFile', async (treeItem: MyTreeItem) => {
    if (treeItem) {
      const { ip, app, file } = treeItem;
      const ret = await removeLocalFile(ip, app, file);
      if (ret) {
        treeDataProvider.refresh();
      }
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.set-executable-file', async () => {
    const uri = await vscode.window.showOpenDialog({
      title: "请选择带有调试符号的leak可执行文件",
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      defaultUri: vscode.Uri.file(getExecutableFile()),
      filters: {
        "so": ['so']
      }
    });
    if (uri && uri.length) {
      const file = uri[0].fsPath;
      await setExecutableFile(file);
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.show-executable-file', async () => {
    const file = getExecutableFile();
    if (existsSync(file)) {
      vscode.window.showInformationMessage(file);
      vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(file));
    } else {
      vscode.window.showInformationMessage(`文件不存在：${file}`);
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.addr2line', async (treeItem: MyTreeItem) => {
    if (treeItem) {
      const { file } = treeItem;
      console.log(file);
      // await leakReporter.parse(file);
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.showLeakStack', async (treeItem: MyTreeItem) => {
    if (treeItem) {
      const { source } = treeItem;
      const result = parseSourcemap(source);
      if (result) {
        const { file, line } = result;
        if (existsSync(file)) {
          log.output(source);
          vscode.workspace.openTextDocument(file).then(doc => {
            vscode.window.showTextDocument(doc, { selection: new vscode.Range(line - 1, 0, line - 1, 0) });
          });
        } else {
          log.output(`文件不存在：${source}`);
        }
      } else {
        log.output(`无法打开：${source}`);
      }
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.showLeakFile', (treeItem: MyTreeItem) => {
    if (treeItem) {
      const { file } = treeItem;
      if (existsSync(file)) {
        vscode.workspace.openTextDocument(file).then(doc => {
          vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
        });
      }
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.pullLeakFile',
    async (treeItem: MyTreeItem) => {
      const { ip, app } = treeItem;
      const localFile = await leakReporter.pullReportFile(ip, app);
      if (localFile) {
        await addLocalFiles(ip, app, localFile);
        treeDataProvider.refresh();
      }
    }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.setleakfile', async (param) => {
    let preValue = getLeakFile();
    const ret = await vscode.window.showQuickPick([
      "files/Download/leak_report.txt",
      "files/Documents/leak_report.txt",
    ], {
      title: "设置内存泄露汇报文件地址(相对于APP)",
      placeHolder: preValue,
    });

    if (!ret) { return; }
    // 允许文件没有后缀
    await setLeakFile(ret);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.connectIP',
    async (treeItem: MyTreeItem) => {
      if (treeItem && typeof treeItem.label === 'string') {
        await leakReporter.connectIP(treeItem.label);
      }
    }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.removeIP',
    async (treeItem: MyTreeItem) => {
      if (treeItem.label && typeof treeItem.label === 'string') {
        const ret = await removeIP(treeItem.label);
        if (!ret.err) {
          treeDataProvider.refresh();
        } else {
          log.output(`删除IP失败:${ret.msg}`);
        }
      }
    }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.removeAPP',
    async (treeItem: MyTreeItem) => {
      if (treeItem.label && typeof treeItem.label === 'string') {
        const ret = await removeAPP(treeItem.label);
        if (!ret.err) {
          const { ip, app } = treeItem;
          await removeLocalFiles(ip, app, null);
          treeDataProvider.refresh();
        } else {
          log.output(`删除APP失败:${ret.msg}`);
        }
      }
    }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.addAPP', async () => {
    const preValue = "com.";
    const pkg = await vscode.window.showInputBox({ title: "请输入APK包名", value: preValue, valueSelection: [preValue.length, preValue.length] });
    if (!pkg) { return; };
    const ret1 = checkAppValid(pkg);
    if (ret1.err) {
      log.output(ret1.msg);
      return;
    }

    const ret2 = await addApp(pkg);
    if (!ret2.err) {
      treeDataProvider.refresh();
    } else {
      log.output(`添加app失败:${ret2.msg}`);
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.addIP', async () => {
    const preValue = "192.168.1.";
    let ip = await vscode.window.showInputBox({ title: "请输入手机IP", value: preValue, valueSelection: [preValue.length, preValue.length] });
    if (!ip) { return; }
    let ret1 = checkIsIpValid(ip);
    if (ret1.err === ERROR.NO_PORT) {
      const port = await vscode.window.showInputBox({ title: "请输入端口", value: "6666" });
      if (!port) {
        return;
      }
      if (ip.endsWith(":")) {
        ip += port;
      } else {
        ip = `${ip}:${port}`;
      }
      ret1 = checkIsIpValid(ip);
    }

    if (ret1.err) {
      log.output(`${ret1.msg}`);
      return;
    }
    const ret2 = await addIP(ip);
    if (!ret2.err) {
      treeDataProvider.refresh();
    } else {
      log.output(`添加IP失败:${ret2.msg}`);
    }
  }));
}

export function deactivate() { }
