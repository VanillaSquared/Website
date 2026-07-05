$ErrorActionPreference = "Stop"

$serviceName = "MySQL84"
$displayName = "MySQL Server 8.4"
$mysqld = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe"
$defaultsFile = "C:\ProgramData\MySQL\MySQL Server 8.4\my.ini"
$binaryPath = "`"$mysqld`" --defaults-file=`"$defaultsFile`" $serviceName"

Stop-Process -Name mysqld -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

$existing = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($existing) {
  if ($existing.Status -ne "Stopped") {
    Stop-Service -Name $serviceName -Force
  }

  sc.exe delete $serviceName | Out-Host
  Start-Sleep -Seconds 2
}

New-Service -Name $serviceName -BinaryPathName $binaryPath -DisplayName $displayName -StartupType Automatic | Out-Host
Start-Service -Name $serviceName
Start-Sleep -Seconds 3
Get-Service -Name $serviceName | Format-List Name,DisplayName,Status,StartType
