# One-time setup for gta6-clipper on Windows. Safe to run again. Prints "All set" at the end.
# Run it with setup.bat (it handles PowerShell's script policy for you).
$ErrorActionPreference = "Stop"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvDir = if ($env:GTA6_ENV_DIR) { $env:GTA6_ENV_DIR } else { Join-Path $env:USERPROFILE ".gta6-clipper" }
$ClipsDir = if ($env:GTA6_CLIPS_DIR) { $env:GTA6_CLIPS_DIR } else { Join-Path $env:USERPROFILE "gta6-clips" }
$Venv = Join-Path $EnvDir "venv"
$Missing = $false

function Ok($m)  { Write-Host "[ok] $m" -ForegroundColor Green }
function Bad($m) { Write-Host "[x]  $m" -ForegroundColor Red; $script:Missing = $true }
function Have($c) { return [bool](Get-Command $c -ErrorAction SilentlyContinue) }

Write-Host "gta6-clipper setup (Windows)"

# --- Python 3.9 - 3.13 (the real one, not the Microsoft Store shortcut) ---
$PyCmd = $null
foreach ($try in @(@("py", "-3.12"), @("py", "-3.11"), @("py", "-3.13"), @("py", "-3.10"), @("py", "-3"), @("python"))) {
    if (-not (Have $try[0])) { continue }
    try {
        $args2 = @($try | Select-Object -Skip 1) + @("-c", "import sys;print('%d.%d' % sys.version_info[:2])")
        $v = (& $try[0] @args2 2>$null | Out-String).Trim()
        if ($v -match '^3\.(\d+)$' -and [int]$Matches[1] -ge 9 -and [int]$Matches[1] -le 13) { $PyCmd = $try; $PyVer = $v; break }
    } catch { }
}
if ($PyCmd) { Ok "Python $PyVer" } else { Bad "Python 3.9-3.13 missing: winget install Python.Python.3.12  (then open a new terminal)" }

if (Have "ffmpeg" -and (Have "ffprobe")) { Ok "ffmpeg" } else { Bad "ffmpeg missing: winget install Gyan.FFmpeg  (then open a new terminal)" }
if (Have "claude") { Ok "Claude Code" } else { Bad "claude missing: install Claude Code first, then open a new terminal" }
if ((Have "deno") -or (Have "node") -or (Have "bun")) { Ok "JavaScript runtime (YouTube needs one)" }
else { Bad "no deno/node: winget install DenoLand.Deno  (YouTube downloads need it)" }

$Drive = (Get-PSDrive (Split-Path $ClipsDir -Qualifier).TrimEnd(":"))
$FreeGB = [math]::Floor($Drive.Free / 1GB)
if ($FreeGB -ge 3) { Ok "disk: $FreeGB GB free" }
else { Bad "only $FreeGB GB free; setup needs ~1.5 GB, clipping ~0.1 GB per stream hour" }

if ($Missing) { Write-Host ""; Write-Host "Fix the [x] lines above, then run this again."; exit 1 }

# --- private Python environment ---
New-Item -ItemType Directory -Force -Path $EnvDir | Out-Null
$VenvPy = Join-Path $Venv "Scripts\python.exe"
if (-not (Test-Path $VenvPy)) {
    $mk = @($PyCmd | Select-Object -Skip 1) + @("-m", "venv", $Venv)
    & $PyCmd[0] @mk
}
& $VenvPy -m pip install -q -U pip --no-cache-dir
& $VenvPy -m pip install -q -U faster-whisper "opencv-python-headless<5" pillow numpy yt-dlp --no-cache-dir
if ($LASTEXITCODE -ne 0) { Write-Host "[x]  pip install failed (see above)" -ForegroundColor Red; exit 1 }
Ok "Python packages (private env in $EnvDir)"

# --- models ---
$env:GTA6_ENV_DIR = $EnvDir
$env:PYTHONUTF8 = "1"
& $VenvPy (Join-Path $Here "fetch_models.py")

# --- watchlist ---
New-Item -ItemType Directory -Force -Path $ClipsDir | Out-Null
$wl = Join-Path $ClipsDir "streamers.txt"
if (-not (Test-Path $wl)) { Copy-Item (Join-Path $Here "..\streamers.txt") $wl }
Ok "watchlist: $wl"

# --- optional: GPU video encoder + GPU Whisper hints ---
$gpu = (Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue | ForEach-Object { $_.Name }) -join "; "
if ($gpu) { Write-Host "  graphics: $gpu  (use --fast to try its video encoder)" }

Write-Host ""
Write-Host "All set. Try:  `"$Here\gta6clip.cmd`" --find --list"
