import * as vscode from 'vscode';
import { ConfigService } from '../services/configService';
import { GitService } from '../services/gitService';

export async function viewTrackedBranchesCommand(context: vscode.ExtensionContext, rootPath: string) {

    const trackedBranches = new ConfigService(context, rootPath).getTrackedBranches();

    if (trackedBranches.length === 0) {
        vscode.window.showInformationMessage('No tracked branches configured.');
        return;
    }

    await vscode.window.showQuickPick(
        trackedBranches,
        {
            placeHolder: 'Tracked branches',
            canPickMany: false
        }
    );
}

export async function addTrackedBranchesCommand(context: vscode.ExtensionContext, rootPath: string) {

    const gitService = new GitService(rootPath);
    const configService = new ConfigService(context, rootPath);
    const trackedBranches = new Set(configService.getTrackedBranches());
    const remoteBranches = await gitService.getRemoteBranches();
    const availableBranches = remoteBranches.filter(branch => !trackedBranches.has(branch));

    if (availableBranches.length === 0) {
        vscode.window.showInformationMessage('All remote branches are already tracked.');
        return;
    }

    const branches = await vscode.window.showQuickPick(
        availableBranches,
        {
            canPickMany: true,
            placeHolder: 'Select branches to add'
        }
    );

    if (!branches || branches.length === 0) {
        return;
    }

    await configService.addTrackedBranches(branches);

    vscode.window.showInformationMessage(`Added tracked branches: ${branches.join(', ')}`);
}

export async function removeTrackedBranchesCommand(context: vscode.ExtensionContext, rootPath: string) {

    const configService = new ConfigService(context, rootPath);
    const trackedBranches = configService.getTrackedBranches();

    if (trackedBranches.length === 0) {
        vscode.window.showInformationMessage('No tracked branches configured.');
        return;
    }

    const branches = await vscode.window.showQuickPick(
        trackedBranches,
        {
            canPickMany: true,
            placeHolder: 'Select branches to remove'
        }
    );

    if (!branches || branches.length === 0) {
        return;
    }

    await configService.removeTrackedBranches(branches);

    vscode.window.showInformationMessage(`Removed tracked branches: ${branches.join(', ')}`);
}
