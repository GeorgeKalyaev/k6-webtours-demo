# Запуск k6 с выводом метрик в InfluxDB 1.x (встроенный output, xk6 не нужен).
# Пример:
#   .\scripts\run-k6-influxdb1.ps1
#   .\scripts\run-k6-influxdb1.ps1 -InfluxOut "http://user:pass@localhost:8086/k6"
#   .\scripts\run-k6-influxdb1.ps1 -Script "src/test/js/simulation/Debug.js" -Tag "smoke-001"

param(
    [string] $InfluxOut = "http://localhost:8086/k6",
    [string] $Script = "src/test/js/simulation/Debug.js",
    [string] $Tag = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $root $Script))) {
    Write-Error "Скрипт не найден относительно корня репо: $Script (корень: $root)"
}
Set-Location $root

$k6Args = @("run", "--out", "influxdb=$InfluxOut")
if ($Tag) {
    $k6Args += @("--tag", "testid=$Tag")
}
$k6Args += $Script

& k6 @k6Args
