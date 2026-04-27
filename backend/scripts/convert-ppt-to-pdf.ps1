param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'

$powerPoint = $null
$presentation = $null

try {
  $resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
  $outputDirectory = Split-Path -Path $OutputPath -Parent

  if (-not (Test-Path -LiteralPath $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
  }

  $powerPoint = New-Object -ComObject PowerPoint.Application
  $presentation = $powerPoint.Presentations.Open($resolvedInput, $false, $false, $false)
  $presentation.SaveAs($OutputPath, 32)
}
finally {
  if ($presentation -ne $null) {
    $presentation.Close()
  }

  if ($powerPoint -ne $null) {
    $powerPoint.Quit()
  }

  [System.GC]::Collect()
  [System.GC]::WaitForPendingFinalizers()
}
