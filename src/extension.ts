import * as vscode from 'vscode';
import { safePush } from './pushInterceptor';
import { trackCommand } from './commands/trackCommand';
import { statusCommand } from './commands/statusCommand';
import {
    addTrackedBranchesCommand,
    removeTrackedBranchesCommand,
    viewTrackedBranchesCommand
} from './commands/trackedBranchesCommand';
import { TerminalGitInterceptor } from './services/terminalGitInterceptor';
import { pickRepositoryRoot } from './services/repositoryService';

export function activate(context: vscode.ExtensionContext) {

    vscode.window.showInformationMessage("UpTo activated");
    const terminalGitInterceptor = new TerminalGitInterceptor(context);
    terminalGitInterceptor.activate();

    context.subscriptions.push(
        {
            dispose: () => terminalGitInterceptor.dispose()
        },
        vscode.commands.registerCommand('upto.push', async () => {
            await safePush(context);
        }),
        vscode.commands.registerCommand('upto.track', async () => {
            const rootPath = await pickRepositoryRoot('tracking branches');

            if (!rootPath) {
                return;
            }

            await trackCommand(context, rootPath);
        }),
        vscode.commands.registerCommand('upto.status', async () => {
            const rootPath = await pickRepositoryRoot('checking branch status');

            if (!rootPath) {
                return;
            }

            await statusCommand(context, rootPath);
        }),
        vscode.commands.registerCommand('upto.trackedBranches.view', async () => {
            const rootPath = await pickRepositoryRoot('viewing tracked branches');

            if (!rootPath) {
                return;
            }

            await viewTrackedBranchesCommand(context, rootPath);
        }),
        vscode.commands.registerCommand('upto.trackedBranches.add', async () => {
            const rootPath = await pickRepositoryRoot('adding tracked branches');

            if (!rootPath) {
                return;
            }

            await addTrackedBranchesCommand(context, rootPath);
        }),
        vscode.commands.registerCommand('upto.trackedBranches.remove', async () => {
            const rootPath = await pickRepositoryRoot('removing tracked branches');

            if (!rootPath) {
                return;
            }

            await removeTrackedBranchesCommand(context, rootPath);
        })
    );
}
