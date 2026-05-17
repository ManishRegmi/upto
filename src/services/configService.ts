import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface BranchConfig {
    workspaces: Record<string, string[]>;
}

export class ConfigService {

    private configPath: string;

    constructor(
        private context: vscode.ExtensionContext,
        private rootPath: string
    ) {
        fs.mkdirSync(context.globalStorageUri.fsPath, { recursive: true });
        this.configPath = ConfigService.getConfigPath(context);
    }

    static getConfigPath(context: vscode.ExtensionContext) {
        return path.join(context.globalStorageUri.fsPath, 'tracked-branches.json');
    }

    saveTrackedBranches(branches: string[]) {
        const config = this.readConfig();
        config.workspaces[this.rootPath] = [...new Set(branches)].sort();
        this.writeConfig(config);
    }

    getTrackedBranches(): string[] {
        return this.readConfig().workspaces[this.rootPath] || [];
    }

    addTrackedBranches(branches: string[]) {
        this.saveTrackedBranches([
            ...this.getTrackedBranches(),
            ...branches
        ]);
    }

    removeTrackedBranches(branches: string[]) {
        const branchesToRemove = new Set(branches);

        this.saveTrackedBranches(
            this.getTrackedBranches().filter(branch => !branchesToRemove.has(branch))
        );
    }

    private readConfig(): BranchConfig {
        if (!fs.existsSync(this.configPath)) {
            return { workspaces: {} };
        }

        return JSON.parse(fs.readFileSync(this.configPath, 'utf-8')) as BranchConfig;
    }

    private writeConfig(config: BranchConfig) {
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    }
}
