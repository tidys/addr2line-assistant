import * as vscode from 'vscode';
import { TreeItem } from "vscode"
import { getPhones } from './config';

enum Type {
  Phone = 0,
}
export class MyTreeItem extends vscode.TreeItem {
  constructor(label: string) {
    super(label);
    this.label = label;
  }
}
export class MyTreeViewDataProvider implements vscode.TreeDataProvider<TreeItem>{
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