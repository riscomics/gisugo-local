#Requires -Version 5.1
<#
.SYNOPSIS
  SHIP EVERYTHING - commit (if needed) + push GitHub + firebase deploy.
  This is what "Deploy" means on DESKTOP. Disk, GitHub, and live must match.

.PARAMETER Message
  Commit message when there are uncommitted shippable changes. Required if dirty.

.PARAMETER Only
  Optional Firebase --only override (e.g. "hosting" or "hosting,functions").
  Default: auto from changed paths in HEAD.

.PARAMETER SkipFirebase
  Only sync git (commit/push). Rare - do not use for normal Deploy.

.EXAMPLE
  .\scripts\ship-everything.ps1 -Message "Contact reveal hourglass loader."
  .\scripts\ship-everything.ps1
#>
param(
  [string]$Message = "",
  [string]$Only = "",
  [switch]$SkipFirebase,
  [switch]$IncludeUntrackedAssets,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

function Write-Step([string]$msg) { Write-Host ""; Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Fail([string]$msg) { Write-Host "FAIL: $msg" -ForegroundColor Red; exit 1 }
function Write-Ok([string]$msg) { Write-Host "OK: $msg" -ForegroundColor Green }

$IgnoreExact = @(
  ".firebase/hosting..cache",
  "scripts/github-action-gisugo1-key.json"
)
$IgnorePrefixes = @(
  ".firebase/"
)

function Test-IgnoredPath([string]$path) {
  $norm = ($path -replace "\\", "/").TrimStart("./")
  foreach ($e in $IgnoreExact) {
    if ($norm -eq $e) { return $true }
  }
  foreach ($p in $IgnorePrefixes) {
    if ($norm.StartsWith($p)) { return $true }
  }
  if ($norm -match "(^|/)\.env(\.|$)" -or $norm -match "credentials\.json$" -or $norm -match "-key\.json$") {
    return $true
  }
  return $false
}

function Get-PorcelainEntries {
  $raw = git status --porcelain -uall
  if (-not $raw) { return @() }
  $entries = @()
  foreach ($line in ($raw -split "`n")) {
    if (-not $line.Trim()) { continue }
    $path = $line.Substring(3).Trim()
    if ($path -match " -> ") { $path = ($path -split " -> ")[-1].Trim() }
    $path = $path.Trim('"')
    $entries += [pscustomobject]@{ Status = $line.Substring(0, 2); Path = $path }
  }
  return $entries
}

function Test-IsShippableEntry($entry) {
  if (Test-IgnoredPath $entry.Path) { return $false }
  # Untracked WIP images are easy to ship by accident; require -IncludeUntrackedAssets.
  $norm = ($entry.Path -replace "\\", "/")
  $isUntracked = ($entry.Status -match '^\?\?')
  if (-not $IncludeUntrackedAssets -and $isUntracked -and $norm -match '^public/images/') {
    return $false
  }
  return $true
}

function Get-ShippableDirty {
  $all = Get-PorcelainEntries
  $out = @()
  foreach ($e in $all) {
    if (Test-IsShippableEntry $e) { $out += $e }
  }
  return $out
}

function Get-DeployTargetsFromPaths([string[]]$paths) {
  $needHosting = $false
  $needFunctions = $false
  $needRules = $false
  foreach ($p in $paths) {
    $n = ($p -replace "\\", "/")
    if ($n.StartsWith("functions/")) { $needFunctions = $true; continue }
    if ($n -eq "firestore.rules" -or $n -eq "storage.rules" -or $n -eq "firestore.indexes.json") {
      $needRules = $true
      continue
    }
    if ($n -match "\.(html|css|js|png|jpg|jpeg|webp|svg|ico|json|txt|xml)$" -or
        $n.StartsWith("public/") -or
        $n -eq "firebase-messaging-sw.js" -or
        $n -eq "firebase.json" -or
        $n -eq ".firebaserc") {
      $needHosting = $true
      continue
    }
  }
  $parts = New-Object System.Collections.Generic.List[string]
  if ($needHosting) { [void]$parts.Add("hosting") }
  if ($needFunctions) { [void]$parts.Add("functions") }
  if ($needRules) {
    [void]$parts.Add("firestore:rules")
    [void]$parts.Add("firestore:indexes")
    [void]$parts.Add("storage")
  }
  if ($parts.Count -eq 0) {
    return "hosting"
  }
  return ($parts -join ",")
}

Write-Step "SHIP EVERYTHING (Deploy)"
Write-Host "Repo: $(Get-Location)"

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne "main") {
  Write-Host "WARN: on branch '$branch' (expected main). Continuing." -ForegroundColor Yellow
}

$dirty = Get-ShippableDirty
if ($dirty.Count -gt 0) {
  Write-Step ("Uncommitted shippable files (" + $dirty.Count + ")")
  $dirty | ForEach-Object { Write-Host ("  {0} {1}" -f $_.Status, $_.Path) }
  if (-not $Message) {
    Write-Fail "Working tree has shippable changes but no -Message. Refuse to deploy a half-synced tree. Fix: .\scripts\ship-everything.ps1 -Message 'your commit message'"
  }
  if ($DryRun) {
    Write-Host "DRY RUN: would commit + push + deploy"
    exit 0
  }
  Write-Step "Staging shippable files"
  foreach ($d in $dirty) {
    git add -- $d.Path
    if ($LASTEXITCODE -ne 0) { Write-Fail ("git add failed: " + $d.Path) }
  }
  Write-Step "Commit"
  git commit -m $Message
  if ($LASTEXITCODE -ne 0) { Write-Fail "git commit failed" }
} else {
  Write-Ok "No shippable uncommitted changes (noise like .firebase cache ignored)"
}

$still = Get-ShippableDirty
if ($still.Count -gt 0) {
  Write-Fail "Shippable files still dirty after commit - aborting before push/deploy"
}

Write-Step ("Fetch + push origin " + $branch)
git fetch origin
if ($LASTEXITCODE -ne 0) { Write-Fail "git fetch failed" }

$local = (git rev-parse HEAD).Trim()
$remoteRef = "origin/" + $branch
$remoteOk = $true
try {
  git rev-parse --verify $remoteRef | Out-Null
  if ($LASTEXITCODE -ne 0) { $remoteOk = $false }
} catch {
  $remoteOk = $false
}

if ($remoteOk) {
  $remote = (git rev-parse $remoteRef).Trim()
  if ($local -ne $remote) {
    $ahead = [int](git rev-list --count ($remoteRef + "..HEAD"))
    $behind = [int](git rev-list --count ("HEAD.." + $remoteRef))
    if ($behind -gt 0) {
      Write-Fail ("Local is behind " + $remoteRef + " by " + $behind + " commit(s). Pull/rebase first.")
    }
    if ($ahead -gt 0) {
      if ($DryRun) {
        Write-Host ("DRY RUN: would push " + $ahead + " commit(s)")
        exit 0
      }
      git push origin ("HEAD:refs/heads/" + $branch)
      if ($LASTEXITCODE -ne 0) { Write-Fail "git push failed" }
    }
  } else {
    Write-Ok ("Already in sync with " + $remoteRef + " (" + $local.Substring(0, 7) + ")")
  }
} else {
  if ($DryRun) {
    Write-Host "DRY RUN: would push new branch"
    exit 0
  }
  git push -u origin ("HEAD:refs/heads/" + $branch)
  if ($LASTEXITCODE -ne 0) { Write-Fail "git push failed" }
}

$local = (git rev-parse HEAD).Trim()
$remote = (git rev-parse $remoteRef).Trim()
if ($local -ne $remote) {
  Write-Fail ("After push, HEAD (" + $local.Substring(0, 7) + ") != " + $remoteRef + " (" + $remote.Substring(0, 7) + "). Abort deploy.")
}
Write-Ok ("Git sync locked: " + $local.Substring(0, 7) + " on " + $branch + " = " + $remoteRef)

if ($SkipFirebase) {
  Write-Ok "SkipFirebase set - git ship only"
  exit 0
}

if ($Only) {
  $targets = $Only
} else {
  $changed = @(git show --pretty="" --name-only HEAD)
  $targets = Get-DeployTargetsFromPaths $changed
}

Write-Step ("Firebase deploy --only " + $targets)
if ($DryRun) {
  Write-Host ("DRY RUN: firebase deploy --only " + $targets)
  exit 0
}

firebase deploy --only $targets
if ($LASTEXITCODE -ne 0) { Write-Fail "firebase deploy failed" }

Write-Step "Post-ship lock check"
$local2 = (git rev-parse HEAD).Trim()
$remote2 = (git rev-parse $remoteRef).Trim()
$dirty2 = Get-ShippableDirty
if ($local2 -ne $remote2) {
  Write-Fail ("Post-deploy git drift: local " + $local2.Substring(0, 7) + " vs remote " + $remote2.Substring(0, 7))
}
if ($dirty2.Count -gt 0) {
  Write-Fail "Shippable dirty files appeared during deploy - investigate"
}

Write-Ok "SHIP COMPLETE"
Write-Host ("  commit:   " + $local2.Substring(0, 7))
Write-Host ("  github:   " + $remoteRef + " @" + $remote2.Substring(0, 7))
Write-Host ("  firebase: --only " + $targets)
Write-Host "  live:     https://gisugo.com"
Write-Host ""
Write-Host "Report to user: Deployed - live on https://gisugo.com now. (git + Firebase synced)"
