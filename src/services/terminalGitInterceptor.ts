import * as vscode from 'vscode';
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';
import { createHash } from 'crypto';
import { execFileSync } from 'child_process';
import { ConfigService } from './configService';
import { BehindBranch, showSyncModal } from './notificationService';

interface PushCheckRequest {
    behindBranches: BehindBranch[];
}

export class TerminalGitInterceptor {

    private server?: net.Server;
    private socketPath: string;

    constructor(private context: vscode.ExtensionContext) {
        const storageHash = createHash('sha1')
            .update(context.globalStorageUri.fsPath)
            .digest('hex')
            .slice(0, 12);

        this.socketPath = path.join(os.tmpdir(), `upto-${storageHash}.sock`);
    }

    activate() {
        const binPath = path.join(this.context.globalStorageUri.fsPath, 'bin');
        const wrapperPath = path.join(binPath, 'git');
        const realGitPath = this.getRealGitPath();

        fs.mkdirSync(binPath, { recursive: true });
        fs.writeFileSync(wrapperPath, this.getWrapperScript());
        fs.chmodSync(wrapperPath, '755');

        this.startServer();

        const env = this.context.environmentVariableCollection;
        env.persistent = false;
        env.description = 'UpTo intercepts git push in VS Code integrated terminals.';
        env.prepend('PATH', `${binPath}${path.delimiter}`);
        env.replace('UPTO_REAL_GIT', realGitPath);
        env.replace('UPTO_CONFIG_PATH', ConfigService.getConfigPath(this.context));
        env.replace('UPTO_SOCKET_PATH', this.socketPath);
    }

    dispose() {
        this.server?.close();
    }

    private startServer() {
        if (fs.existsSync(this.socketPath)) {
            fs.unlinkSync(this.socketPath);
        }

        this.server = net.createServer(socket => {
            let body = '';

            socket.on('data', chunk => {
                body += chunk.toString();

                if (body.includes('\n')) {
                    void this.handlePushCheckRequest(socket, body);
                }
            });
        });

        this.server.listen(this.socketPath);
    }

    private async handlePushCheckRequest(socket: net.Socket, body: string) {
        try {
            const request = JSON.parse(body.trim()) as PushCheckRequest;
            const choice = await showSyncModal(request.behindBranches);
            socket.end(JSON.stringify({ choice }) + '\n');
        } catch (error) {
            socket.end(JSON.stringify({
                error: error instanceof Error ? error.message : String(error)
            }) + '\n');
        }
    }

    private getRealGitPath() {
        return execFileSync('which', ['git'])
            .toString()
            .trim();
    }

    private getWrapperScript() {
        return `#!/usr/bin/env node
const fs = require('fs');
const net = require('net');
const { execFileSync, spawnSync } = require('child_process');

const args = process.argv.slice(2);
const realGit = process.env.UPTO_REAL_GIT || 'git';

function runGit(gitArgs) {
    const result = spawnSync(realGit, gitArgs, {
        stdio: 'inherit',
        env: {
            ...process.env,
            PATH: stripWrapperPath(process.env.PATH || '')
        }
    });

    if (result.error) {
        console.error(result.error.message);
        process.exit(1);
    }

    if (result.signal) {
        process.kill(process.pid, result.signal);
    }

    process.exit(result.status || 0);
}

function stripWrapperPath(currentPath) {
    const delimiter = process.platform === 'win32' ? ';' : ':';
    const wrapperDir = __dirname;
    return currentPath
        .split(delimiter)
        .filter(part => part !== wrapperDir)
        .join(delimiter);
}

function getOutput(gitArgs) {
    return execFileSync(realGit, gitArgs, {
        encoding: 'utf-8',
        env: {
            ...process.env,
            PATH: stripWrapperPath(process.env.PATH || '')
        }
    }).trim();
}

function askExtension(behindBranches) {
    return new Promise(resolve => {
        const socketPath = process.env.UPTO_SOCKET_PATH;

        if (!socketPath) {
            console.error('UpTo: extension socket is not configured.');
            resolve(undefined);
            return;
        }

        const socket = net.createConnection(socketPath);
        let response = '';

        socket.on('connect', () => {
            socket.write(JSON.stringify({ behindBranches }) + '\\n');
        });

        socket.on('data', chunk => {
            response += chunk.toString();
        });

        socket.on('end', () => {
            try {
                const result = JSON.parse(response);

                if (result.error) {
                    console.error(\`UpTo: \${result.error}\`);
                }

                resolve(result.choice);
            } catch {
                console.error('UpTo: could not read extension response.');
                resolve(undefined);
            }
        });

        socket.on('error', error => {
            console.error(\`UpTo: could not reach the extension process: \${error.message}\`);
            resolve(undefined);
        });
    });
}

async function main() {
    if (args[0] !== 'push') {
        runGit(args);
    }

    let rootPath;

    try {
        rootPath = getOutput(['rev-parse', '--show-toplevel']);
    } catch {
        runGit(args);
    }

    const configPath = process.env.UPTO_CONFIG_PATH;

    if (!configPath || !fs.existsSync(configPath)) {
        runGit(args);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const trackedBranches = config.workspaces?.[rootPath] || [];

    if (trackedBranches.length === 0) {
        runGit(args);
    }

    console.error('UpTo: checking tracked branches before push...');
    runGitWithoutExit(['fetch', 'origin', '--quiet']);

    const behindBranches = [];

    for (const branch of trackedBranches) {
        const result = getOutput([
            'rev-list',
            '--left-right',
            '--count',
            \`HEAD...origin/\${branch}\`
        ]);
        const [, behind] = result.split(/\\s+/);
        const behindCount = Number.parseInt(behind, 10);

        if (behindCount > 0) {
            behindBranches.push({ branch, behind: behindCount });
        }
    }

    if (behindBranches.length === 0) {
        runGit(args);
    }

    const choice = await askExtension(behindBranches);

    if (choice === 'Merge') {
        console.error('UpTo: merging tracked branch updates before push...');
        for (const { branch } of behindBranches) {
            runGitWithoutExit(['merge', \`origin/\${branch}\`]);
        }

        console.error('UpTo: merge complete, continuing push...');
        runGit(args);
    }

    if (choice === 'Continue Anyway') {
        console.error('UpTo: continuing push without merging...');
        runGit(args);
    }

    console.error('UpTo cancelled git push.');
    process.exit(1);
}

function runGitWithoutExit(gitArgs) {
    const result = spawnSync(realGit, gitArgs, {
        stdio: 'inherit',
        env: {
            ...process.env,
            PATH: stripWrapperPath(process.env.PATH || '')
        }
    });

    if (result.status !== 0) {
        process.exit(result.status || 1);
    }
}

main();
`;
    }
}
