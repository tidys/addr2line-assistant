import * as vscode from 'vscode';
import { addPhone, getPhones, removePhone } from './config';
import { checkIsIp } from './util';
import { MyTreeItem, MyTreeViewDataProvider } from './treeview';



export function activate(context: vscode.ExtensionContext) {

  const log = vscode.window.createOutputChannel("a2la");
  log.show();

  const treeDataProvider = new MyTreeViewDataProvider();
  vscode.window.registerTreeDataProvider("addr2line:main", treeDataProvider);

  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from addr2line-assistant!');
  }));
  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.removePhone',
    async (param: MyTreeItem) => {
      if (param.label && typeof param.label === 'string') {
        const ret = await removePhone(param.label);
        if (!ret.err) {
          treeDataProvider.refresh();
        } else {
          log.appendLine(`删除IP失败:${ret.msg}`)
        }
      }
    }));

  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.addPhone',
    async () => {
      const preValue = "192.168.1.";
      const ip = await vscode.window.showInputBox({ title: "请输入手机IP", value: preValue, valueSelection: [preValue.length, preValue.length] });
      if (ip && checkIsIp(ip)) {
        const ret = await addPhone(ip);
        if (!ret.err) {
          treeDataProvider.refresh();
        } else {
          log.appendLine(`添加IP失败:${ret.msg}`);
        }
      }

    }));
}

export function deactivate() { }
