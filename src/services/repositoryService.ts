import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getGitApi } from '../git/api';

export async function pickRepositoryRoot(action: string): Promise<string | undefined> {
    const repositories = await getRepositoryRoots();

    if (repositories.length === 0) {
        vscode.window.showWarningMessage(`No Git repository found for ${action}.`);
        return;
    }

    if (repositories.length === 1) {
        return repositories[0];
    }

    const picked = await vscode.window.showQuickPick(
        repositories.map(rootPath => ({
            label: path.basename(rootPath),
            description: rootPath,
            rootPath
        })),
        {
            placeHolder: `Select Git repository for ${action}`
        }
    );

    return picked?.rootPath;
}

async function getRepositoryRoots() {
    const roots = new Set<string>();
    const git = await getGitApi();

    for (const repository of git?.repositories || []) {
        roots.add(repository.rootUri.fsPath);
    }

    for (const workspaceFolder of vscode.workspace.workspaceFolders || []) {
        addRepositoryIfPresent(roots, workspaceFolder.uri.fsPath);
        addChildRepositories(roots, workspaceFolder.uri.fsPath);
    }

    return [...roots].sort();
}

function addRepositoryIfPresent(roots: Set<string>, rootPath: string) {
    if (fs.existsSync(path.join(rootPath, '.git'))) {
        roots.add(rootPath);
    }
}

function addChildRepositories(roots: Set<string>, workspacePath: string) {
    if (!fs.existsSync(workspacePath)) {
        return;
    }

    for (const entry of fs.readdirSync(workspacePath, { withFileTypes: true })) {
        if (!entry.isDirectory()) {
            continue;
        }

        addRepositoryIfPresent(roots, path.join(workspacePath, entry.name));
    }
}
