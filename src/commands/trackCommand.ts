import * as vscode from 'vscode';
import { ConfigService } from '../services/configService';
import { GitService } from '../services/gitService';

export async function trackCommand(context: vscode.ExtensionContext, rootPath: string) {

    const gitService = new GitService(rootPath);
    const configService = new ConfigService(context, rootPath);
    const remoteBranches = await gitService.getRemoteBranches();

    const branches = await vscode.window.showQuickPick(
        remoteBranches,
        {
            canPickMany: true,
            placeHolder: "Select branches to track before push"
        }
    );

    if (!branches || branches.length === 0) {
        return;
    }

    await configService.saveTrackedBranches(branches);

    vscode.window.showInformationMessage(`Tracking branches: ${branches.join(', ')}`);
}
