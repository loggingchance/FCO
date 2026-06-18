$ErrorActionPreference = "Stop"

$RepositoryUrl = "https://github.com/loggingchance/FCO.git"
$RepositoryPage = "https://github.com/loggingchance/FCO"
$Root = Split-Path -Parent $PSScriptRoot

Set-Location -LiteralPath $Root

function Run-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)

    & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Git command failed: git $($Arguments -join ' ')"
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor DarkGreen
Write-Host "  FCO - Upload to GitHub" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor DarkGreen
Write-Host ""

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git is not installed or is not available on PATH."
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI (gh) is not installed. Install it from https://cli.github.com/"
}

& gh auth status --hostname github.com *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "GitHub needs authentication. Opening browser sign-in..." -ForegroundColor Yellow
    & gh auth login --hostname github.com --git-protocol https --web
    if ($LASTEXITCODE -ne 0) {
        throw "GitHub authentication was not completed."
    }
}

& gh auth setup-git
if ($LASTEXITCODE -ne 0) {
    throw "GitHub CLI could not configure Git authentication."
}

# The normal Windows user owns this folder. Marking it safe also avoids
# ownership warnings if another approved development tool works here later.
& git config --global --add safe.directory $Root

if (-not (Test-Path -LiteralPath ".git" -PathType Container)) {
    Write-Host "Creating local Git repository..."
    Run-Git init
}

Run-Git config user.name "loggingchance"

$Email = & gh api user --jq .email 2>$null
if (-not $Email) {
    $UserId = & gh api user --jq .id
    $Login = & gh api user --jq .login
    $Email = "$UserId+$Login@users.noreply.github.com"
}
Run-Git config user.email $Email

$Remotes = @(& git remote)
if ($Remotes -notcontains "origin") {
    Run-Git remote add origin $RepositoryUrl
} else {
    $Origin = & git remote get-url origin
    if ($LASTEXITCODE -ne 0) {
        throw "Git could not read the origin remote."
    }
    if ($Origin -ne $RepositoryUrl) {
        Run-Git remote set-url origin $RepositoryUrl
    }
}

Write-Host "Synchronizing with GitHub..."
Run-Git fetch origin

# Anchor the local files on the GitHub main branch. The working files remain
# in place, including files created before this repository was connected.
Run-Git branch -M main
$RemoteMain = & git rev-parse --verify origin/main 2>$null
if ($LASTEXITCODE -eq 0) {
    Run-Git reset --mixed origin/main
}

Write-Host "Preparing project files..."
Run-Git add --all

& git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "No new file changes to commit." -ForegroundColor Cyan
} else {
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    Run-Git commit -m "Update FCO ($Timestamp)"
}

Write-Host "Uploading main branch..."
Run-Git push --set-upstream origin main

Write-Host ""
Write-Host "Upload complete: $RepositoryPage" -ForegroundColor Green
