import * as vscode from 'vscode';

export async function getGitApi() {
    const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
    return gitExtension?.getAPI(1);
}