# orion fish completion
# Install: orion install --completion | source
#      or: orion install --completion >> ~/.config/fish/completions/orion.fish

# Disable file completion for all orion commands
complete -c orion -f

# Top-level verbs
complete -c orion -n '__fish_use_subcommand' -a run       -d 'Execute a skill headlessly'
complete -c orion -n '__fish_use_subcommand' -a list      -d 'List all skills'
complete -c orion -n '__fish_use_subcommand' -a describe  -d 'Show skill details'
complete -c orion -n '__fish_use_subcommand' -a install   -d 'Install IDE adapter files'
complete -c orion -n '__fish_use_subcommand' -a sync      -d 'Regenerate adapter files'
complete -c orion -n '__fish_use_subcommand' -a doctor    -d 'Check adapter file integrity'
complete -c orion -n '__fish_use_subcommand' -a help      -d 'Show help'
complete -c orion -n '__fish_use_subcommand' -a fleet     -d 'Parallel agent execution'
complete -c orion -n '__fish_use_subcommand' -a replay    -d 'Re-run a past invocation'
complete -c orion -n '__fish_use_subcommand' -a chain     -d 'Sequential skill composition'
complete -c orion -n '__fish_use_subcommand' -a migrate   -d 'Migrate from pre-CLI layout'
complete -c orion -n '__fish_use_subcommand' -a next      -d 'Suggest next action'

# Skill names for run/describe/replay/chain
function __fish_orion_skills
  orion list --format=completion 2>/dev/null
end

complete -c orion -n '__fish_seen_subcommand_from run describe replay chain' \
  -a '(__fish_orion_skills)'

# install --tools completions
complete -c orion -n '__fish_seen_subcommand_from install' \
  -l tools -d 'IDE adapter' -a 'claude-code cursor codex windsurf'

# --backend completions
complete -c orion -l backend -d 'LLM backend' -a 'claude codex api'

# --format completions
complete -c orion -l format -d 'Output format' -a 'text json completion'

# Global flags
complete -c orion -l dry-run    -d 'Preview without writing/executing'
complete -c orion -l bypass     -d 'Skip router; execute canonical SKILL.md'
complete -c orion -l fix        -d 'Auto-repair drift (doctor only)'
complete -c orion -l yes        -d 'Skip interactive prompts'
complete -c orion -l completion -d 'Install tab completion'
complete -c orion -s v -l version -d 'Show version'
complete -c orion -s h -l help    -d 'Show help'
