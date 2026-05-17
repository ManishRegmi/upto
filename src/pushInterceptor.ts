import * as vscode from 'vscode';
import { getGitApi } from './git/api';
import { ConfigService } from './services/configService';
import { GitService } from './services/gitService';
import { showSyncModal } from './services/notificationService';

export async function safePush(context: vscode.ExtensionContext) {

    const git = await getGitApi();
    const repo = git.repositories[0];

    if (!repo) {
        return;
    }

    const rootPath = repo.rootUri.fsPath;
    const configService = new ConfigService(context, rootPath);
    const gitService = new GitService(rootPath);
    const trackedBranches = configService.getTrackedBranches();

    if (trackedBranches.length === 0) {
        await repo.push();
        return;
    }

    await gitService.fetch();

    const behindBranches = [];

    for (const branch of trackedBranches) {
        const result = await gitService.compareWithBranch(branch);

        if (result.behind > 0) {
            behindBranches.push({
                branch,
                behind: result.behind
            });
        }
    }

    if (behindBranches.length > 0) {

        const choice = await showSyncModal(behindBranches);

        if (choice === "Merge") {
            for (const { branch } of behindBranches) {
                await gitService.mergeRemoteBranch(branch);
            }

            await gitService.push();
            return;
        }

        if (choice === "Continue Anyway") {
            await gitService.push();
        }

        return;
    }

    await gitService.push();
}
