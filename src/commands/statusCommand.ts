import * as vscode from 'vscode';
import { GitService } from '../services/gitService';
import { ConfigService } from '../services/configService';

export async function statusCommand(context: vscode.ExtensionContext, rootPath: string) {

    const gitService =
        new GitService(rootPath);

    const configService =
        new ConfigService(context, rootPath);

    const trackedBranches =
        configService.getTrackedBranches();

    if (trackedBranches.length === 0) {

        vscode.window.showWarningMessage(
            'No tracked branches configured'
        );

        return;
    }

    await gitService.fetch();

    let output = '';

    for (const branch of trackedBranches) {

        const result =
            await gitService.compareWithBranch(branch);

        output +=
            `${branch} → ahead ${result.ahead}, behind ${result.behind}\n`;
    }

    vscode.window.showInformationMessage(output);
}
