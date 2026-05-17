import * as vscode from 'vscode';

export class BranchTracker {

    setBranch(context: vscode.ExtensionContext, branch: string) {
        context.globalState.update("upto.trackedBranch", branch);
    }

    getBranch(context: vscode.ExtensionContext): string {
        return context.globalState.get("upto.trackedBranch") || "main";
    }
}