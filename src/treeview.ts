import * as vscode from 'vscode';
import { TreeItem } from "vscode";
import { getApps, getIPS, getLeakRank, getLocalFiles } from './config';
import { log } from './log';
import { execSync } from 'child_process';
import { leakReporter } from './leak-reporter';
import { readFileSync } from 'fs';
import { LeakAddress, LeakStack } from './leak-stack';
import { parseSourcemap } from './util';
import { basename } from 'path';

enum Type {
  NONE = 'none',
  IP = 'ip',
  APP = 'app',
  LeakFile = 'leak-file',
  LeakResultTitle = 'leak-result-title',
  LeakResultStack = 'leak-result-stack'
}
export class MyTreeItem extends vscode.TreeItem {
  public type: Type = Type.NONE;
  public ip: string = '';
  public app: string = '';
  public file: string = '';
  public source: string = "";
  constructor(label: string, type: Type, state: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed) {
    super(label, state);
    this.label = label;
    this.type = type;
    this.contextValue = type;
    switch (type) {
      case Type.APP: {

        break;
      }
      case Type.LeakFile: {
        this.command = {
          title: 'show leak file',
          command: 'addr2line-assistant.showLeakFile',
          tooltip: "show leak file",
          arguments: [this]
        };
        break;
      }
      case Type.LeakResultStack: {
        this.command = {
          title: 'show leak stack',
          command: 'addr2line-assistant.showLeakStack',
          tooltip: "show leak stack",
          arguments: [this]
        }
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
  getChildren(element?: MyTreeItem): vscode.ProviderResult<MyTreeItem[]> {
    const items: MyTreeItem[] = [];
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
          const treeItem = new MyTreeItem(files[i], Type.LeakFile);
          treeItem.file = files[i];
          items.push(treeItem);
        }
      } else if (type === Type.LeakFile) {
        const { file } = element;
        const data = readFileSync(file, 'utf-8');
        const lines = data.split('\n');
        const allStackArray: LeakStack[] = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const stack = new LeakStack();
          if (line && stack.parseLine(line)) {
            allStackArray.push(stack);
          }
        }
        // 取出排行前几名
        const leakAddress = new LeakAddress();
        const stackArray: LeakStack[] = [];
        allStackArray.sort((a, b) => {
          return b.size - a.size;
        });
        const rank = getLeakRank();
        for (let i = 0; i < rank; i++) {
          if (i < allStackArray.length) {
            const stack = allStackArray[i];
            stack.address.map(address => leakAddress.add(address));
            stackArray.push(stack);
          }
        }
        leakAddress.addr2line();
        // 插入前几名的数据
        for (let i = 0; i < stackArray.length; i++) {
          const item = stackArray[i];

          const titleTreeItem = new MyTreeItem(item.getTitle(), Type.LeakResultTitle, vscode.TreeItemCollapsibleState.None);
          titleTreeItem.source = "";
          items.push(titleTreeItem);
          for (let count = 0; count < item.address.length; count++) {
            const addr = item.address[count];
            const sourcemap = leakAddress.get(addr);
            const result = parseSourcemap(sourcemap);
            let label = "";
            if (result) {
              const { file, line } = result;
              label = `    ${addr} ${basename(file)}`;
            } else {
              label = `    ${addr}`;
            }
            const stackTreeItem = new MyTreeItem(label, Type.LeakResultStack, vscode.TreeItemCollapsibleState.None);
            stackTreeItem.source = sourcemap;
            stackTreeItem.tooltip = sourcemap;
            items.push(stackTreeItem);
          }
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