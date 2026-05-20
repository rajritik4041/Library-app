# macOS .dmg — GitHub Actions se download (private repo ke liye login zaroori)
$repo = "rajritik4041/Library-app"
$releaseDir = Join-Path $PSScriptRoot "..\release"
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

Write-Host ""
Write-Host "  EJ MCAET Library — macOS .dmg download"
Write-Host "  ========================================"
Write-Host ""

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "  GitHub CLI (gh) install nahi hai. Browser se download karein:"
  Write-Host "  https://github.com/$repo/actions/workflows/build-desktop.yml"
  Start-Process "https://github.com/$repo/actions/workflows/build-desktop.yml"
  exit 0
}

$auth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "  Pehle GitHub login karein (browser khulega):"
  Write-Host "  gh auth login"
  Write-Host ""
  gh auth login
}

Write-Host "  Latest macOS build download ho raha hai..."
Push-Location $releaseDir
gh run download --repo $repo --name EJ-MCAET-Library-macOS 2>&1
$ok = $LASTEXITCODE -eq 0
Pop-Location

if ($ok) {
  Get-ChildItem $releaseDir -Filter "*.dmg" | ForEach-Object {
    Write-Host "  OK: $($_.FullName)"
  }
} else {
  Write-Host "  Download fail — Actions page khul rahi hai (manual artifact):"
  Start-Process "https://github.com/$repo/actions/workflows/build-desktop.yml"
}

Write-Host ""
