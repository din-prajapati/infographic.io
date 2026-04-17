<#.SYNOPSIS
  Create a GitHub PR using gh with a markdown body file.
.DESCRIPTION
  Requires: gh auth login, branch pushed to origin.
  Example:
    .\scripts\open-story-pr.ps1 -Title "[US-DESIGN-002] Editor + AI chat design tokens" `
      -BodyFile "docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/PR_BODY.md"
#>
param(
  [Parameter(Mandatory = $true)][string]$Title,
  [Parameter(Mandatory = $true)][string]$BodyFile,
  [string]$BaseBranch = "main",
  [string[]]$Label = @()
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if (-not (Test-Path $BodyFile)) {
  throw "Body file not found: $BodyFile"
}

$args = @("pr", "create", "--base", $BaseBranch, "--title", $Title, "--body-file", $BodyFile)
foreach ($l in $Label) {
  if ($l) { $args += @("--label", $l) }
}

Write-Host "gh $($args -join ' ')"
& gh @args
