UpTo

Prevent outdated pushes with smart branch sync checks before every Git push.

UpTo is a VS Code extension designed to prevent integration conflicts, broken staging environments, and “I forgot to pull” moments in collaborative Git workflows.

Instead of relying on developers to manually check whether their branch is up to date, UpTo automatically verifies tracked branches before a push and warns the developer when they are behind.

Built for fast-moving teams working with:

main
staging
production
release branches
shared feature branches
✨ Features
✅ Smart Branch Sync Checks

Before pushing, UpTo checks whether your current branch is behind selected tracked branches.

Example:

Current Branch: feature/payment-refactor
Tracked Branches:
- main
- staging

If main or staging has newer commits, UpTo warns the user before allowing the push.

✅ Merge Protection Modal

If your branch is behind:

Your branch is behind 'staging' by 4 commits.
Please merge before pushing.

Actions:

Merge
Push Anyway
Cancel
✅ Per-Developer Tracking

Every developer can choose which branches matter to them.

Examples:

main
staging
production
release/v2
✅ Works Across Repositories

Install once in VS Code and use across multiple Git repositories.

✅ Lightweight & Fast
No external servers
No GitHub App required
No CI dependency
Runs locally using Git
🚀 Why UpTo Exists

Teams often face these issues:

Developers forget to pull latest changes
Staging crashes after outdated pushes
Hidden merge conflicts appear late
Shared environments become unstable
Team members unknowingly overwrite each other

UpTo acts as a proactive safety layer between developers and Git pushes.

🧠 How It Works

UpTo performs these steps before a push:

git fetch origin
↓
Compare current branch with tracked branches
↓
Detect missing commits
↓
Show warning modal if behind
↓
Allow merge / cancel / push anyway
📦 Installation
From VS Code Marketplace

Coming soon.

Local Development Installation

Clone the repository:

git clone <repository-url>
cd upto

Install dependencies:

pnpm install

Run extension in development mode:

F5

This opens a new VS Code Extension Development Host window.

⚙️ Requirements
VS Code ^1.119.0
Git installed
Node.js >=18

Recommended:

pnpm
🛠 Development Setup
Install dependencies
pnpm install
Start watch mode
pnpm run watch
Run extension

Press:

F5

inside VS Code.

📁 Project Structure
src/
├── extension.ts
├── git/
│   ├── checker.ts
│   └── commands.ts
├── ui/
│   └── pushModal.ts
🧪 Commands
UpTo: Secure Push

Safely pushes current branch after sync validation.

UpTo: Track Branches

Configure tracked branches for update validation.

UpTo: Status

Shows current synchronization status against tracked branches.

🔐 Philosophy

UpTo is intentionally designed to:

Warn developers early
Reduce broken shared environments
Preserve developer autonomy
Avoid blocking legitimate workflows

Developers always maintain final control.

🏗 Roadmap
Planned Features
Terminal git push interception
GitHub authentication
Team-wide branch policies
Auto-merge support
Branch health indicators
AI-assisted merge conflict explanation
Pull request awareness
Multi-repository workspace support
GitLens integration
Team sync dashboard
🤝 Contributing

Contributions are welcome.

Development workflow
git checkout -b feature/my-feature
pnpm run watch
📄 License

MIT License

👨‍💻 Author

Built by Manish Regmi

⭐ Vision

UpTo aims to become the safety layer modern development teams never realized they needed:

“Know before you push.”