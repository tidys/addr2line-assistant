import * as vscode from 'vscode';
import { addApp, addIP, getLeakFile, getIPS, removeAPP, removeIP, setLeakFile, getKey, addLocalFiles, removeLocalFiles, setExecutableFile, modifyIP, setLeakRank } from './config';
import { ERROR, checkAppValid, checkIsIpValid, parseSourcemap } from './util';
import { MyTreeItem, MyTreeViewDataProvider } from './treeview';
import { log } from './log';
import { leakReporter } from './leak-reporter';
import { existsSync } from 'fs';
import { assets } from './assets';

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
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.set-executable-file', async () => {
    const uri = await vscode.window.showOpenDialog({
      title: "请选择带有调试符号的leak可执行文件",
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        "so": ['so']
      }
    });
    if (uri && uri.length) {
      const file = uri[0].fsPath;
      await setExecutableFile(file);
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
    if (!preValue) {
      preValue = "files/Documents/leak_report.txt";
    }
    const ret = await vscode.window.showInputBox({ title: "设置内存泄露汇报文件地址(相对于APP)", value: preValue, valueSelection: [preValue.length, preValue.length] });
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
