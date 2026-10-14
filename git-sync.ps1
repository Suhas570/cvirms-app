<#
.SYNOPSIS
    Convenience shortcut for scripts/git-branch-router.ps1
#>
param(
    [switch]$DryRun,
    [switch]$Push,
    [string]$Message,
    [string]$FrontendMessage,
    [string]$BackendMessage,
    [string]$IncludeShared = "skip",
    [switch]$StatusOnly,
    [switch]$NonInteractive
)

& "$PSScriptRoot\scripts\git-branch-router.ps1" @PSBoundParameters
