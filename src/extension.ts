import * as vscode from 'vscode';
import { addPhone, getPhones } from './config';
import { checkIsIp } from './util';
enum Type {
  Phone = 0,
}
class TreeItem extends vscode.TreeItem {
  constructor(label: string) {
    super(label);
  }
}
class MyTreeViewDataProvider implements vscode.TreeDataProvider<TreeItem>{
  data: TreeItem[] = [];
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeItem | void>();

  get onDidChangeTreeData(): vscode.Event<TreeItem | void> {
    return this._onDidChangeTreeData.event;
  }
  getTreeItem(element: TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  getChildren(element?: TreeItem): vscode.ProviderResult<TreeItem[]> {
    // 去配置里面查找phone
    const phones = getPhones();
    const item = [];
    for (let i = 0; i < phones.length; i++) {
      item.push(new TreeItem(phones[i]));
    }
    return item;
  }
  getParent?(element: TreeItem): vscode.ProviderResult<TreeItem> {
    throw new Error('getParent not implemented.');
  }
  resolveTreeItem?(item: vscode.TreeItem, element: TreeItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
    throw new Error('resolveTreeItem not implemented.');
  }
  refresh() {
    this._onDidChangeTreeData.fire();
  }
}



export function activate(context: vscode.ExtensionContext) {

  const treeDataProvider = new MyTreeViewDataProvider();
  vscode.window.registerTreeDataProvider("addr2line:main", treeDataProvider);

  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from addr2line-assistant!');
  }));

  context.subscriptions.push(vscode.commands.registerCommand('addr2line-assistant.addPhone',
    async () => {
      const preValue = "192.168.1.";
      const ip = await vscode.window.showInputBox({ title: "请输入手机IP", value: preValue, valueSelection: [preValue.length, preValue.length] });
      if (ip && checkIsIp(ip)) {
        const b = await addPhone(ip);
        if (b) {
          treeDataProvider.refresh();
        }
      }

    }));
}

export function deactivate() { }
