<#
.SYNOPSIS
  Regista o backend do SIPAR-FADA como Servico do Windows via NSSM, com
  arranque automatico e reinicio em caso de falha.

.DESCRIPTION
  Resolve OPS-11/OPS-28 da auditoria de pre-producao: ate agora, "supervisao
  de processo" era so um procedimento manual documentado (server/README.md).
  Este script torna-o um comando unico, repetivel, para cada instalacao.

  NSSM (https://nssm.cc/) nao e distribuido via npm - tem de ser descarregado
  uma vez e colocado no PATH, ou o caminho completo indicado com -NssmPath.

.PARAMETER ServiceName
  Nome do servico Windows. Por omissao "SIPAR-FADA-Backend".

.PARAMETER NssmPath
  Caminho para nssm.exe. Por omissao assume que "nssm" esta no PATH.

.EXAMPLE
  # A partir da pasta server/, como Administrador:
  .\scripts\install-windows-service.ps1

.EXAMPLE
  .\scripts\install-windows-service.ps1 -NssmPath "C:\ferramentas\nssm-2.24\win64\nssm.exe"
#>
param(
  [string]$ServiceName = "SIPAR-FADA-Backend",
  [string]$NssmPath = "nssm"
)

$ErrorActionPreference = "Stop"

# Confirma que corre como Administrador - registar um servico exige.
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Error "Este script tem de correr como Administrador (clique direito no PowerShell > Executar como Administrador)."
  exit 1
}

# Confirma que o nssm esta acessivel.
$nssmCmd = Get-Command $NssmPath -ErrorAction SilentlyContinue
if (-not $nssmCmd) {
  Write-Error "nssm nao encontrado ('$NssmPath'). Descarregue de https://nssm.cc/download, extraia, e passe o caminho completo com -NssmPath, ou adicione a pasta ao PATH do sistema."
  exit 1
}

$serverRoot = Split-Path -Parent $PSScriptRoot
$distEntry = Join-Path $serverRoot "dist\index.js"
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
  Write-Error "node nao encontrado no PATH."
  exit 1
}

Write-Host "A construir a aplicacao (npm run build) antes de registar o servico..."
Push-Location $serverRoot
try {
  npm run build
  if (-not (Test-Path $distEntry)) {
    Write-Error "Build nao gerou '$distEntry' - corrija os erros de build antes de continuar."
    exit 1
  }
} finally {
  Pop-Location
}

Write-Host "A registar o servico '$ServiceName'..."
& $NssmPath install $ServiceName $nodeCmd.Source $distEntry
& $NssmPath set $ServiceName AppDirectory $serverRoot
& $NssmPath set $ServiceName AppStdout (Join-Path $serverRoot "logs\service-stdout.log")
& $NssmPath set $ServiceName AppStderr (Join-Path $serverRoot "logs\service-stderr.log")
& $NssmPath set $ServiceName AppRotateFiles 1
& $NssmPath set $ServiceName AppRotateBytes 10485760
# Reinicia sempre em falha, com um pequeno atraso para nao entrar em ciclo
# imediato se a causa da falha nao se resolver sozinha (ex.: BD inacessivel).
& $NssmPath set $ServiceName AppExit Default Restart
& $NssmPath set $ServiceName AppRestartDelay 5000
& $NssmPath set $ServiceName Start SERVICE_AUTO_START

Write-Host ""
Write-Host "Servico '$ServiceName' registado. Para arrancar agora:"
Write-Host "  nssm start $ServiceName"
Write-Host "Para confirmar que esta saudavel depois de arrancar:"
Write-Host "  curl http://localhost:5000/api/v1/health"
Write-Host "Para parar/remover mais tarde:"
Write-Host "  nssm stop $ServiceName"
Write-Host "  nssm remove $ServiceName confirm"
