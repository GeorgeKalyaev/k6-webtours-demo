# Запуск WebTours в Docker (нужен запущенный Docker Desktop)
$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot "webtours-docker"
if (-not (Test-Path $root)) {
    Write-Host "Папка не найдена: $root" -ForegroundColor Red
    exit 1
}
docker version 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker недоступен. Запусти Docker Desktop и повтори." -ForegroundColor Yellow
    exit 1
}
Set-Location $root
docker compose up -d --build
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Открой: http://127.0.0.1:1080/WebTours/" -ForegroundColor Green
    Write-Host "k6: cd $PSScriptRoot ; k6 run src/test/js/simulation/Debug.js"
}
