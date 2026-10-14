# Automated Git Branch Workflow Guide

This guide explains how to develop both the **Frontend** and **Backend** from the same local workspace while automatically routing changes to dedicated GitHub branches:

| Branch | Domain | Monorepo Paths |
| :--- | :--- | :--- |
| `yashwanth` | **Frontend** changes only | `cvirms-frontend/` |
| `suhas` | **Backend & Database** changes only | `cvirms-backend/` |
| `main` | **Integrated Stable Release** | Full codebase (Frontend + Backend + Documentation) |

---

## 1. How It Works (The Non-Disruptive Architecture)

Normally, switching Git branches on Windows while local servers (`npm run dev` on port 3001 and port 5000) are running causes file locks, compilation failures, and risks cross-contaminating files across branches.

To eliminate this risk, our PowerShell workflow script (`scripts/git-branch-router.ps1` and `git-sync.ps1`) uses **Git index plumbing (`GIT_INDEX_FILE`)**:
1. **Zero Working Tree Disruption:** You stay in your main directory. Your running servers are never interrupted.
2. **Selective Staging:** Only `cvirms-frontend/` files are committed to `yashwanth`. Only `cvirms-backend/` files are committed to `suhas`.
3. **Secrets Guard:** Real `.env` files, `.pem` certificates, private keys, and credentials are automatically scanned and blocked from ever reaching Git.
4. **Shared File Protection:** Monorepo root files (`DEV_LOG.md`, `.gitignore`, root configs) are held separately and will never be silently assigned to a branch without your explicit confirmation.
5. **Interactive Push Gate:** The script asks for your confirmation before pushing anything to GitHub.

---

## 2. Daily Command Cheat Sheet

You can run commands from PowerShell in your project root (`c:\Users\ADMIN\Desktop\cvirms app`):

### A. Preview Changes (Dry Run)
Inspect which files will be routed without modifying any commits or branches:
```powershell
.\git-sync.ps1 -DryRun
```

### B. Route & Commit Locally
Commit frontend changes to `yashwanth` and backend changes to `suhas`:
```powershell
.\git-sync.ps1
```

### C. Commit with Custom Commit Messages
```powershell
.\git-sync.ps1 -FrontendMessage "feat(ui): enhance dashboard and visitor list" -BackendMessage "feat(api): add guest CRUD endpoints and validation"
```

### D. Commit and Push to GitHub (Interactive)
Routes your changes locally, then prompts you to confirm pushing each branch to GitHub:
```powershell
.\git-sync.ps1 -Push
```

### E. Check Branch Status
View current commit hashes and tracking status across `yashwanth`, `suhas`, and `main`:
```powershell
.\git-sync.ps1 -StatusOnly
```

### F. Include Shared Files
If you updated root documentation (`DEV_LOG.md`, `.gitignore`, etc.) and want to commit them to `main`:
```powershell
.\git-sync.ps1 -IncludeShared main
```

---

## 3. Safe First-Time Push Procedure

Your local branches `yashwanth` and `suhas` have already been prepared with your initial commits. Follow these exact steps to push them safely to GitHub for the first time:

### Step 1: Preview with Dry Run
```powershell
.\git-sync.ps1 -DryRun
```

### Step 2: Push Each Branch with Confirmation
Run:
```powershell
.\git-sync.ps1 -Push
```
When prompted:
```text
Push branch 'yashwanth' to GitHub (https://github.com/Suhas570/cvirms-app)? [y/N]: y
Push branch 'suhas' to GitHub (https://github.com/Suhas570/cvirms-app)? [y/N]: y
```

Or push manually via standard Git commands:
```powershell
git push -u origin yashwanth
git push -u origin suhas
```

---

## 4. How to Merge Both Branches into `main`

Once changes in `yashwanth` and `suhas` are tested, merge them into `main`. Because frontend and backend live in completely disjoint directories, merging will have **zero merge conflicts**.

### Recommended Method: GitHub Pull Requests (Best Practice)
1. Go to [https://github.com/Suhas570/cvirms-app/pulls](https://github.com/Suhas570/cvirms-app/pulls).
2. Click **New Pull Request**:
   - Base: `main` ← Compare: `yashwanth`
   - Title: `feat: Frontend updates (Yashwanth)`
   - Click **Create Pull Request** and **Merge Pull Request**.
3. Click **New Pull Request**:
   - Base: `main` ← Compare: `suhas`
   - Title: `feat: Backend updates (Suhas)`
   - Click **Create Pull Request** and **Merge Pull Request**.
4. Both frontend and backend are now integrated in `main`.

### Alternative Method: Local CLI Merge
If you prefer merging locally in PowerShell:
```powershell
# 1. Fetch latest state
git fetch origin

# 2. Switch to main
git checkout main
git pull origin main

# 3. Merge frontend branch
git merge yashwanth -m "Merge frontend (yashwanth) into main"

# 4. Merge backend branch
git merge suhas -m "Merge backend (suhas) into main"

# 5. Push integrated main to GitHub
git push origin main
```

---

## 5. Conflict Prevention & Recovery Procedure

### Conflict Prevention Rules
1. **Never edit `cvirms-backend/` files on branch `yashwanth`.**
2. **Never edit `cvirms-frontend/` files on branch `suhas`.**
3. **Develop in your root workspace;** let `.\git-sync.ps1` manage the branch commits.
4. Keep shared files (`.gitignore`, `DEV_LOG.md`) managed via `.\git-sync.ps1 -IncludeShared main`.

### Recovery Procedure
If remote history ever diverges or you need to resync your branches with `main`:

#### 1. Discard Unwanted Staged Changes
If an accidental file was staged:
```powershell
git restore --staged <file>
```

#### 2. Rebase or Resync Branches from `main`
If `main` has new commits from your collaborator that you want in `yashwanth` or `suhas`:
```powershell
git fetch origin

# To sync yashwanth with main:
git checkout yashwanth
git merge origin/main -m "chore: sync yashwanth with latest main"
git push origin yashwanth

# To sync suhas with main:
git checkout suhas
git merge origin/main -m "chore: sync suhas with latest main"
git push origin suhas
```

#### 3. View Routing Log
At any time, run:
```powershell
.\git-sync.ps1 -StatusOnly
```
to review current pointers without touching files on disk.
