# install.ps1 — Tu dong tao shortcut cho AI CLI Manager tren Windows

$currentDir = Get-Location
$startBat = Join-Path $currentDir "start.bat"
$shortcutPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "Bridge App.lnk"

if (-not (Test-Path $startBat)) {
    Write-Host "[install] [X] Khong tim thay file start.bat tai $currentDir" -ForegroundColor Red
    exit
}

echo "[install] Dang tao shortcut tai Desktop..."

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "cmd.exe"
$shortcut.Arguments = "/c `"$startBat`""
$shortcut.WorkingDirectory = $currentDir
$shortcut.IconLocation = Join-Path $currentDir "manager.png"
$shortcut.WindowStyle = 7 # Minimized (chay thu nho)
$shortcut.Save()

Write-Host "[install] [V] Da tao shortcut 'Bridge App' tren Desktop." -ForegroundColor Green
Write-Host "[install] Ban co the copy file nay vao Start Menu neu muon."
Write-Host "[install] Luu y: Dam bao ban da cai dat Python va them vao PATH." -ForegroundColor Yellow

pause
