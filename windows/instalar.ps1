# Instala (o actualiza) el expediente del Dr. Dodoli en esta laptop Windows. Sin nube.
# Uso: clic derecho en instalar.bat > Ejecutar como administrador.
# Actualizar: copiar la carpeta nueva ENCIMA (sin borrar backend\.env ni backend\respaldos) y volver a correrlo.
$ErrorActionPreference = 'Stop'
$App = Split-Path $PSScriptRoot -Parent          # carpeta con backend\ y frontend\ (p. ej. C:\Dodoli)
$PgVer = 16
$PgBin = "C:\Program Files\PostgreSQL\$PgVer\bin"
$EnvFile = "$App\backend\.env"
function Clave($n = 32) { -join ((48..57) + (65..90) + (97..122) | Get-Random -Count $n | ForEach-Object { [char]$_ }) }
function Revisar($que) { if ($LASTEXITCODE -ne 0) { throw "Falló: $que (código $LASTEXITCODE)" } }
function Recargar-Path { $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User') }

Write-Host "== Expediente Dr. Dodoli: instalación en $App ==" -ForegroundColor Cyan

# 1. Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host '-> Instalando Node.js...'
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements; Revisar 'instalar Node.js'
  Recargar-Path
}

# 2. PostgreSQL + base de datos + .env (solo la primera vez; nunca se pisa un .env existente)
$Nueva = -not (Test-Path $EnvFile)
if ($Nueva) {
  if (Test-Path "$PgBin\psql.exe") { throw "PostgreSQL $PgVer ya estaba instalado. Crear la base a mano (ver LEEME.txt) o desinstalarlo primero." }
  $PgSuper = Clave; $DbPass = Clave; $Jwt = Clave 64
  Write-Host '-> Instalando PostgreSQL (tarda unos minutos)...'
  winget install -e --id "PostgreSQL.PostgreSQL.$PgVer" --accept-source-agreements --accept-package-agreements `
    --override "--mode unattended --unattendedmodeui none --superpassword $PgSuper --serverport 5432"; Revisar 'instalar PostgreSQL'
  $env:PGPASSWORD = $PgSuper
  & "$PgBin\psql.exe" -U postgres -h localhost -c "CREATE USER dodoli_user PASSWORD '$DbPass';"; Revisar 'crear usuario de BD'
  & "$PgBin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE dodoli OWNER dodoli_user;"; Revisar 'crear BD'
  Remove-Item Env:PGPASSWORD

  $Usb = Read-Host 'Letra de la USB o disco externo para respaldos (ej. E). Enter para configurarla después'
  $Copias = if ($Usb) { "$($Usb.Trim(':\ '))`:\RespaldosDodoli" } else { '' }
  $contenido = @"
PORT=3025
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dodoli
DB_USER=dodoli_user
DB_PASSWORD=$DbPass
JWT_SECRET=$Jwt
# Superusuario de PostgreSQL (mantenimiento): $PgSuper
CLIENTE_NOMBRE="Dr. Alejandro Dodoli"
CLIENTE_COLOR="#1E3A5F"
MODULOS=pacientes,agenda,finanzas,odontologia,consentimientos,respaldos
CORS_ORIGINS=
FRONTEND_DIST=$App\frontend\dist
PG_DUMP=$PgBin\pg_dump.exe
RESPALDOS_DIR=$App\respaldos
RESPALDOS_COPIAS=$Copias
RESPALDOS_CONSERVAR=30
"@
  [IO.File]::WriteAllText($EnvFile, $contenido, (New-Object Text.UTF8Encoding $false))   # sin BOM
}

# 3. Dependencias
Write-Host '-> Instalando dependencias...'
Push-Location "$App\backend"
npm install --omit=dev --no-audit --no-fund; Revisar 'npm install'

# 4. Detener la versión anterior (si corre) y arrancar
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*src\index.js*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
$Vbs = "$App\windows\iniciar.vbs"
Start-Process wscript.exe "`"$Vbs`""
Start-Sleep 6

# 5. Usuario del doctor (solo instalación nueva; las migraciones ya corrieron al arrancar)
if ($Nueva) {
  $Correo = Read-Host 'Correo del doctor para entrar al sistema'
  node src\scripts\seed_admin.js $Correo 'Dr. Alejandro Dodoli'; Revisar 'crear usuario'
  Write-Host 'Anota la contraseña temporal de arriba: se cambia al primer ingreso.' -ForegroundColor Yellow
}
Pop-Location

# 6. Arranque automático al iniciar sesión + acceso directo en el escritorio
$Shell = New-Object -ComObject WScript.Shell
$Inicio = $Shell.CreateShortcut("$([Environment]::GetFolderPath('Startup'))\Expediente Dodoli.lnk")
$Inicio.TargetPath = 'wscript.exe'; $Inicio.Arguments = "`"$Vbs`""; $Inicio.Save()
$Escritorio = [Environment]::GetFolderPath('Desktop')
Set-Content "$Escritorio\Expediente Dr. Dodoli.url" "[InternetShortcut]`r`nURL=http://localhost:3025/"

Write-Host "`n✓ Listo. Abrir: http://localhost:3025 (acceso directo en el escritorio)" -ForegroundColor Green
Read-Host 'Enter para cerrar'
