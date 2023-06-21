import * as vscode from 'vscode';
import { TreeItem } from "vscode";
import { getApps, getIPS, getLocalFiles } from './config';
import { log } from './log';
import { execSync } from 'child_process';

enum Type {
  NONE = 'none',
  IP = 'ip',
  APP = 'app',
  Leak = 'leak',
}
export class MyTreeItem extends vscode.TreeItem {
  public type: Type = Type.NONE;
  public ip: string = '';
  public app: string = '';
  public file: string = '';
  constructor(label: string, type: Type) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.label = label;
    this.type = type;
    this.contextValue = type;
    switch (type) {
      case Type.APP: {

        break;
      }
      case Type.Leak: {
        this.command = {
          title: 'show leak',
          command: 'addr2line-assistant.showLeakFile',
          tooltip: "show leak",
          arguments: [this]
        };
        break;
      }
    }

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
  getChildren(element?: MyTreeItem): vscode.ProviderResult<TreeItem[]> {
    const items = [];
    if (!element) {
      // root: 去配置里面查找ip
      const ips = getIPS();
      for (let i = 0; i < ips.length; i++) {
        const treeItem = new MyTreeItem(ips[i], Type.IP);
        treeItem.ip = ips[i];
        items.push(treeItem);
      }
    } else {
      const { type } = element;
      if (type === Type.IP) {
        // show app
        const apps = getApps();
        for (let i = 0; i < apps.length; i++) {
          const treeItem = new MyTreeItem(apps[i], Type.APP);
          treeItem.ip = element.ip;
          treeItem.app = apps[i];
          items.push(treeItem);
        }
      } else if (type === Type.APP) {
        // show leak files
        const files = getLocalFiles(element.ip, element.app);
        for (let i = 0; i < files.length; i++) {
          const treeItem = new MyTreeItem(files[i], Type.Leak);
          treeItem.file = files[i];
          items.push(treeItem);
        }
      }
    }
    return items;
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