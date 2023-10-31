import * as vscode from "vscode";
import { TreeItem } from "vscode";
import { getSoFiles } from "./config";
export class ToolItem extends vscode.TreeItem {
  constructor(label: string, state: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed) {
    super(label, state);
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
