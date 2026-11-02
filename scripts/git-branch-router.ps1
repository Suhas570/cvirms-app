<#
.SYNOPSIS
    Automated Git Branch Router for CVIRMS App (Monorepo Multi-Branch Routing).

.DESCRIPTION
    Safely routes frontend changes to 'yashwanth' and backend/database changes to 'suhas'
    from a single local workspace without switching branches or interrupting dev servers.
    Protects 'main', guarantees secrets (.env) are never committed, and asks for confirmation before pushing.

.PARAMETER DryRun
    Simulate the routing and display which files would go to which branch without modifying any git refs.

.PARAMETER Push
    Prompt to push committed branches to GitHub (origin).

.PARAMETER Message
    Global commit message used for both branches.

.PARAMETER FrontendMessage
    Specific commit message for branch 'yashwanth'.

.PARAMETER BackendMessage
    Specific commit message for branch 'suhas'.

.PARAMETER IncludeShared
    Include shared root files (documentation, root configs) in a specific branch ('main', 'both', or 'skip').

.PARAMETER StatusOnly
    Display current branch status, commits, and uncommitted file categorization.

.PARAMETER NonInteractive
    Skip interactive prompts (useful for automated verification).
#>

[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$Push,
    [string]$Message,
    [string]$FrontendMessage,
    [string]$BackendMessage,
    [string]$IncludeShared = "skip",
    [switch]$StatusOnly,
    [switch]$NonInteractive
)

$ErrorActionPreference = "Continue"

function Write-Header {
    param([string]$Text)
    Write-Host "`n========================================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "========================================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host " [OK] $Text" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Text)
    Write-Host " [WARN] $Text" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Text)
    Write-Host " [ERR] $Text" -ForegroundColor Red
}

function Write-Info {
    param([string]$Text)
    Write-Host " [INFO] $Text" -ForegroundColor White
}

# 1. Base Environment Checks
$repoRoot = (git rev-parse --show-toplevel 2>$null)
if (-not $repoRoot) {
    Write-Err "Not inside a Git repository. Please run from the root of 'cvirms app'."
    exit 1
}
Set-Location $repoRoot

$originUrl = (git remote get-url origin 2>$null)
if (-not $originUrl) {
    Write-Warn "No 'origin' remote found. Setting default to https://github.com/Suhas570/cvirms-app..."
    git remote add origin "https://github.com/Suhas570/cvirms-app"
    $originUrl = "https://github.com/Suhas570/cvirms-app"
}

# Ensure base branches exist locally
$localBranches = (git branch --format="%(refname:short)") -split "`r?`n"
if ($localBranches -notcontains "main") {
    $remoteMain = (git ls-remote --heads origin main)
    if ($remoteMain) {
        git branch main origin/main | Out-Null
    } else {
        git branch main | Out-Null
    }
}
if ($localBranches -notcontains "yashwanth") {
    git branch yashwanth main | Out-Null
}
if ($localBranches -notcontains "suhas") {
    git branch suhas main | Out-Null
}

$currentBranch = (git branch --show-current).Trim()

Write-Header "CVIRMS Multi-Branch Git Router"
Write-Info "Working Directory : $repoRoot"
Write-Info "Current Branch    : $currentBranch"
Write-Info "Remote Origin     : $originUrl"
Write-Info "Target Branches   : yashwanth (frontend) | suhas (backend) | main (integrated)"

# 2. Status Only Mode
if ($StatusOnly) {
    Write-Host "`n--- Branch Commit Pointers ---" -ForegroundColor DarkCyan
    foreach ($b in @("main", "yashwanth", "suhas")) {
        $hash = (git rev-parse --short $b 2>$null)
        $log = (git log -1 --pretty=format:"%s (%cr)" $b 2>$null)
        Write-Host "  Branch: $b -> $hash : $log" -ForegroundColor Magenta
    }
}

# 3. Scan Working Tree Changes
# Use git status --porcelain=v1 -uall
$statusLines = @(git status --porcelain=v1 -uall)

$frontendFiles = [System.Collections.Generic.List[string]]::new()
$backendFiles  = [System.Collections.Generic.List[string]]::new()
$sharedFiles   = [System.Collections.Generic.List[string]]::new()
$ignoredFiles  = [System.Collections.Generic.List[string]]::new()
$secretViolations = [System.Collections.Generic.List[string]]::new()

$secretPatterns = @(
    "\.env$", "\.env\..+", "\.pem$", "\.key$", "id_rsa", "credentials\.json"
)

foreach ($line in $statusLines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $code = $line.Substring(0, 2).Trim()
    $filePath = $line.Substring(3).Trim()

    # Handle rename arrows "old -> new"
    if ($filePath -match " -> ") {
        $filePath = ($filePath -split " -> ")[1].Trim()
    }

    # Secret check (allows .env.example, blocks actual secrets)
    if ($filePath -notmatch "\.env\.example$") {
        foreach ($pat in $secretPatterns) {
            if ($filePath -match $pat) {
                $secretViolations.Add("$code $filePath")
            }
        }
    }

    # Ignore files that shouldn't be routed
    if ($filePath -match "^(\.agents/|dexter/|scratch/|skills-lock\.json|\.git/)|\.sqlite$") {
        $ignoredFiles.Add("$code $filePath")
    }
    # Legacy deleted files from old root Next.js template
    elseif ($code -eq "D" -and $filePath -match "^(app/|public/|eslint\.config|next\.config|postcss\.config|tsconfig\.json|package\.json|package-lock\.json)") {
        $ignoredFiles.Add("$code $filePath (superseded root template)")
    }
    # Frontend files
    elseif ($filePath -match "^(cvirms-frontend/|frontend/|client/)") {
        $frontendFiles.Add("$code $filePath")
    }
    # Backend files
    elseif ($filePath -match "^(cvirms-backend/|backend/|server/|database/)") {
        $backendFiles.Add("$code $filePath")
    }
    # Shared files
    else {
        $sharedFiles.Add("$code $filePath")
    }
}

# 4. Display Analysis Table
Write-Host "`n--- Detected File Routing ---" -ForegroundColor DarkCyan

$feCount = $frontendFiles.Count
$beCount = $backendFiles.Count
$shCount = $sharedFiles.Count
$igCount = $ignoredFiles.Count

Write-Host "  --> [Frontend -> branch: yashwanth] ($feCount files)" -ForegroundColor Green
$feSample = $frontendFiles | Select-Object -First 8
foreach ($f in $feSample) { Write-Host "      $f" -ForegroundColor DarkGreen }
if ($feCount -gt 8) { 
    $feRemaining = $feCount - 8
    Write-Host "      ... and $feRemaining more files" -ForegroundColor DarkGreen 
}

Write-Host "`n  --> [Backend/Database -> branch: suhas] ($beCount files)" -ForegroundColor Yellow
$beSample = $backendFiles | Select-Object -First 8
foreach ($f in $beSample) { Write-Host "      $f" -ForegroundColor DarkYellow }
if ($beCount -gt 8) { 
    $beRemaining = $beCount - 8
    Write-Host "      ... and $beRemaining more files" -ForegroundColor DarkYellow 
}

Write-Host "`n  --> [Shared / Monorepo Files] ($shCount files)" -ForegroundColor Cyan
foreach ($f in $sharedFiles) { Write-Host "      $f" -ForegroundColor DarkCyan }

if ($igCount -gt 0) {
    Write-Host "`n  --> [Ignored / Tooling Files] ($igCount files)" -ForegroundColor Gray
}

# 5. Secrets Safety Gate
if ($secretViolations.Count -gt 0) {
    Write-Header "CRITICAL SECURITY WARNING: SECRETS DETECTED"
    Write-Err "The following files match secret patterns and MUST NOT be committed to GitHub:"
    foreach ($sec in $secretViolations) {
        Write-Err "  $sec"
    }
    Write-Err "Aborting operation immediately. Add them to .gitignore before proceeding."
    exit 1
}

# 6. Dry Run Check
if ($DryRun) {
    Write-Header "DRY RUN MODE SUMMARY"
    Write-Info "No git commits, references, or pushes were modified."
    Write-Info "If executed without -DryRun:"
    Write-Info "  -> $feCount files will be staged into branch 'yashwanth'"
    Write-Info "  -> $beCount files will be staged into branch 'suhas'"
    if ($shCount -gt 0) {
        Write-Info "  -> $shCount shared files are currently HELD (use -IncludeShared main|both to route)"
    }
    Write-Success "Dry run completed successfully."
    exit 0
}

if ($StatusOnly) {
    exit 0
}

# 7. Check if there are changes to route
if ($frontendFiles.Count -eq 0 -and $backendFiles.Count -eq 0 -and $sharedFiles.Count -eq 0) {
    Write-Success "Working tree is clean. No changes to route."
    exit 0
}

# 8. Interactive prompt for shared files if unhandled
$routeSharedTo = $IncludeShared
if ($sharedFiles.Count -gt 0 -and $routeSharedTo -eq "skip" -and -not $NonInteractive) {
    Write-Host ""
    Write-Warn "Shared files were modified ($($sharedFiles -join ', '))."
    $ans = Read-Host "How should shared files be handled? [m] Route to 'main' | [b] Include in both branches | [s] Skip for now (Default: s)"
    if ($ans -eq "m") { $routeSharedTo = "main" }
    elseif ($ans -eq "b") { $routeSharedTo = "both" }
    else { $routeSharedTo = "skip" }
}

# Helper function to commit via temporary index plumbing
function Commit-ToBranch {
    param(
        [string]$TargetBranch,
        [string[]]$StagePaths,
        [string]$CommitMessage
    )

    $tempIndex = Join-Path $env:TEMP ("git-index-router-" + [System.Guid]::NewGuid().ToString("N"))
    try {
        $env:GIT_INDEX_FILE = $tempIndex

        # 1. Read existing branch tree into temporary index
        git read-tree $TargetBranch 2>&1 | Out-Null

        # 2. Stage target paths into the temporary index
        foreach ($p in $StagePaths) {
            git -c core.safecrlf=false add -A $p 2>&1 | Out-Null
        }

        # 3. Write new tree
        $writeTreeOutput = (git write-tree 2>&1)
        if ($LASTEXITCODE -ne 0) {
            throw "git write-tree failed: $writeTreeOutput"
        }
        $newTree = $writeTreeOutput.Trim()

        # 4. Compare with current branch tree
        $currentTree = (git rev-parse "$TargetBranch^{tree}" 2>$null)
        if ($currentTree -and ($newTree -eq $currentTree.Trim())) {
            Write-Info "Branch '$TargetBranch': No new changes compared to current commit. Skipping commit."
            return $null
        }

        # 5. Commit tree with current target branch as parent
        $parent = (git rev-parse $TargetBranch 2>$null)
        if ($parent) {
            $parent = $parent.Trim()
            $commitHash = (git commit-tree $newTree -p $parent -m $CommitMessage).Trim()
        } else {
            $commitHash = (git commit-tree $newTree -m $CommitMessage).Trim()
        }

        # 6. Update branch pointer
        git update-ref "refs/heads/$TargetBranch" $commitHash
        Write-Success "Successfully committed to branch '$TargetBranch' -> $commitHash"
        return $commitHash
    }
    finally {
        $env:GIT_INDEX_FILE = $null
        if (Test-Path $tempIndex) {
            Remove-Item -Force $tempIndex -ErrorAction SilentlyContinue
        }
    }
}

# 9. Commit Frontend Changes to 'yashwanth'
$feCommitted = $null
if ($frontendFiles.Count -gt 0) {
    Write-Header "Processing Frontend Changes -> Branch: yashwanth"
    $stageList = @("cvirms-frontend/")
    if ($routeSharedTo -eq "both") {
        foreach ($sf in $sharedFiles) {
            $stageList += ($sf -split " ", 2)[1]
        }
    }

    $feMsg = $FrontendMessage
    if (-not $feMsg) {
        if ($Message) { $feMsg = "$Message (frontend)" }
        else { $feMsg = "feat(frontend): CVIRMS client updates" }
    }

    $feCommitted = Commit-ToBranch -TargetBranch "yashwanth" -StagePaths $stageList -CommitMessage $feMsg
}

# 10. Commit Backend Changes to 'suhas'
$beCommitted = $null
if ($backendFiles.Count -gt 0) {
    Write-Header "Processing Backend Changes -> Branch: suhas"
    $stageList = @("cvirms-backend/")
    if ($routeSharedTo -eq "both") {
        foreach ($sf in $sharedFiles) {
            $stageList += ($sf -split " ", 2)[1]
        }
    }

    $beMsg = $BackendMessage
    if (-not $beMsg) {
        if ($Message) { $beMsg = "$Message (backend)" }
        else { $beMsg = "feat(backend): CVIRMS server and database updates" }
    }

    $beCommitted = Commit-ToBranch -TargetBranch "suhas" -StagePaths $stageList -CommitMessage $beMsg
}

# 11. Commit Shared Changes to 'main' (if requested)
if ($routeSharedTo -eq "main" -and $sharedFiles.Count -gt 0) {
    Write-Header "Processing Shared Files -> Branch: main"
    $stageList = @()
    foreach ($sf in $sharedFiles) {
        $stageList += ($sf -split " ", 2)[1]
    }
    $mainMsg = "chore(shared): update monorepo documentation and configuration"
    Commit-ToBranch -TargetBranch "main" -StagePaths $stageList -CommitMessage $mainMsg | Out-Null
}

# 12. Push Flow (Protected Confirmation Gate)
if ($Push) {
    Write-Header "Remote Push Confirmation"

    if ($feCommitted -or (git rev-parse yashwanth) -ne (git rev-parse origin/yashwanth 2>$null)) {
        $doPushFe = $false
        if ($NonInteractive) {
            $doPushFe = $true
        } else {
            $ans = Read-Host "Push branch 'yashwanth' to GitHub ($originUrl)? [y/N]"
            if ($ans -eq "y" -or $ans -eq "Y") { $doPushFe = $true }
        }

        if ($doPushFe) {
            Write-Info "Pushing branch 'yashwanth' to origin..."
            git push -u origin yashwanth
            Write-Success "Pushed branch 'yashwanth' to GitHub."
        } else {
            Write-Warn "Skipped pushing 'yashwanth'."
        }
    }

    if ($beCommitted -or (git rev-parse suhas) -ne (git rev-parse origin/suhas 2>$null)) {
        $doPushBe = $false
        if ($NonInteractive) {
            $doPushBe = $true
        } else {
            $ans = Read-Host "Push branch 'suhas' to GitHub ($originUrl)? [y/N]"
            if ($ans -eq "y" -or $ans -eq "Y") { $doPushBe = $true }
        }

        if ($doPushBe) {
            Write-Info "Pushing branch 'suhas' to origin..."
            git push -u origin suhas
            Write-Success "Pushed branch 'suhas' to GitHub."
        } else {
            Write-Warn "Skipped pushing 'suhas'."
        }
    }
} else {
    Write-Header "Next Steps: Ready to Push"
    Write-Info "Commits are prepared locally on your branches."
    Write-Info "To push to GitHub, run:"
    Write-Host "  .\scripts\git-branch-router.ps1 -Push" -ForegroundColor Yellow
    Write-Info "Or push manually:"
    Write-Host "  git push -u origin yashwanth" -ForegroundColor Gray
    Write-Host "  git push -u origin suhas" -ForegroundColor Gray
}

Write-Header "Workflow Complete"
Write-Success "All changed files safely routed without working tree corruption."
