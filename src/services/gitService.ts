import simpleGit from 'simple-git';

export class GitService {

    private git;

    constructor(rootPath: string) {
        this.git = simpleGit(rootPath);
    }

    async fetch() {
        await this.git.raw(['fetch', 'origin', '--quiet']);
    }

    async getRemoteBranches(): Promise<string[]> {

        const branches = await this.git.branch(['-r']);

        return branches.all.map(branch =>
            branch.replace('origin/', '')
        );
    }

    async compareWithBranch(branch: string) {

        const result = await this.git.raw([
            'rev-list',
            '--left-right',
            '--count',
            `HEAD...origin/${branch}`
        ]);

        const [ahead, behind] = result.trim().split('\t');

        return {
            ahead: parseInt(ahead),
            behind: parseInt(behind)
        };
    }

    async mergeRemoteBranch(branch: string) {
        await this.git.merge([`origin/${branch}`]);
    }

    async push() {
        await this.git.push();
    }
}
