# orion PowerShell tab completion
# Install: Add to $PROFILE:
#   . <path-to-this-file>
# Or: orion install --completion | Out-String | Invoke-Expression

$verbs = @(
  'run', 'list', 'describe', 'install', 'sync', 'doctor', 'help',
  'fleet', 'replay', 'chain', 'migrate', 'next'
)

$adapters = @('claude-code', 'cursor', 'codex', 'windsurf')
$backends  = @('claude', 'codex', 'api')
$formats   = @('text', 'json', 'completion')

Register-ArgumentCompleter -Native -CommandName orion -ScriptBlock {
  param($wordToComplete, $commandAst, $cursorPosition)

  $tokens = $commandAst.CommandElements
  $prev   = if ($tokens.Count -ge 2) { $tokens[$tokens.Count - 2].ToString() } else { '' }

  switch ($prev) {
    { $_ -in @('run', 'describe', 'replay', 'chain') } {
      $skills = & orion list --format=completion 2>$null
      $skills | Where-Object { $_ -like "$wordToComplete*" } |
        ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
    }
    { $_ -in @('install', 'adapter') } {
      $adapters | Where-Object { $_ -like "$wordToComplete*" } |
        ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
    }
    '--backend' {
      $backends | Where-Object { $_ -like "$wordToComplete*" } |
        ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
    }
    '--format' {
      $formats | Where-Object { $_ -like "$wordToComplete*" } |
        ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
    }
    default {
      $verbs | Where-Object { $_ -like "$wordToComplete*" } |
        ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
    }
  }
}
