import * as vscode from 'vscode';
import { addApp, addPhone, getLeakFile, getIPS, removeAPP, removeIP, setLeakFile } from './config';
import { checkAppValid, checkIsIpValid } from './util';
import { MyTreeItem, MyTreeViewDataProvider } from './treeview';
import { log } from './log';
import { leakReporter } from './leak-reporter';

export function activate(context: vscode.ExtensionContext) {

  log.initLog();

  const treeDataProvider = new MyTreeViewDataProvider();
  vscode.window.registerTreeDataProvider("addr2line:main", treeDataProvider);

  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.helloWorld', (param) => {
    vscode.window.showInformationMessage('Hello World from addr2line-assistant!');
  }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.pullLeakFile',
    async (treeItem: MyTreeItem) => {
      leakReporter.pullReportFile(treeItem.ip, treeItem.app);
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

  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.connectPhone',
    async (treeItem: MyTreeItem) => {
      if (treeItem && typeof treeItem.label === 'string') {
        await leakReporter.connectPhone(treeItem.label);
      }
    }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.removePhone',
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
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.addPhone', async () => {
    const preValue = "192.168.1.";
    const ip = await vscode.window.showInputBox({ title: "请输入手机IP", value: preValue, valueSelection: [preValue.length, preValue.length] });
    if (!ip) { return; }
    const ret1 = checkIsIpValid(ip);
    if (ret1.err) {
      log.output(`${ret1.msg}`);
      return;
    }
    const ret2 = await addPhone(ip);
    if (!ret2.err) {
      treeDataProvider.refresh();
    } else {
      log.output(`添加IP失败:${ret2.msg}`);
    }
  }));
}

export function deactivate() { }
