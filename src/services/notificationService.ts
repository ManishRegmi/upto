import * as vscode from 'vscode';

export interface BehindBranch {
    branch: string;
    behind: number;
}

export type SyncModalChoice = "Merge" | "Continue Anyway" | undefined;

export async function showSyncModal(behindBranches: BehindBranch[]): Promise<SyncModalChoice> {

    const branchSummary = behindBranches
        .map(({ branch, behind }) => `${branch} (${behind} commit${behind === 1 ? '' : 's'})`)
        .join(', ');

    return await vscode.window.showWarningMessage(
        `Your branch is behind tracked branch${behindBranches.length === 1 ? '' : 'es'}: ${branchSummary}.`,
        { modal: true },
        "Merge",
        "Continue Anyway"
    );
}
