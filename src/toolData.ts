import * as vscode from "vscode";
import { TreeItem } from "vscode";
import { getSoFiles } from "./config";
import { basename } from "path";
import { existsSync } from "fs";
import { statSync } from 'fs'
export class ToolItem extends vscode.TreeItem {
  constructor(label: string, state: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None) {
    super(label, state);
    if (existsSync(label)) {
      const info = statSync(label);
      this.tooltip = `${basename(label)} ${(info.size / 1024 / 1024).toFixed(1)}M`;
    } else {
      this.tooltip = '';
    }
  }
}
export class ToolDataProvider implements vscode.TreeDataProvider<TreeItem> {
  data: TreeItem[] = [];
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeItem | void>();
  get onDidChangeTreeData(): vscode.Event<TreeItem | void> {
    return this._onDidChangeTreeData.event;
  }
  getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  getChildren(element?: ToolItem): Thenable<ToolItem[]> {
    return new Promise(async (resolve, reject) => {
      const items: ToolItem[] = [];
      if (!element) {
        const soFiles = await getSoFiles();
        for (let i = 0; i < soFiles.length; i++) {
          const toolItem = new ToolItem(soFiles[i]);
          items.push(toolItem);
        }
      }
      resolve(items);
    });
  }
  getParent?(element: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem> {
    throw new Error("Method not implemented.");
  }
  resolveTreeItem?(item: vscode.TreeItem, element: vscode.TreeItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
    throw new Error("Method not implemented.");
  }
  refresh() {
    this._onDidChangeTreeData.fire();
  }
}
