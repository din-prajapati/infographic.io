#compdef orion
# orion zsh completion
# Install: source <(orion install --completion)
#      or: orion install --completion >> ~/.zshrc

_orion() {
  local state
  local -a verbs skills backends formats

  verbs=(
    'run:Execute a skill headlessly'
    'list:List all skills'
    'describe:Show skill details'
    'install:Install IDE adapter files'
    'sync:Regenerate adapter files'
    'doctor:Check adapter file integrity'
    'help:Show help for a verb'
    'fleet:Parallel agent execution'
    'replay:Re-run a past invocation'
    'chain:Sequential skill composition'
    'migrate:Migrate from pre-CLI layout'
    'next:Suggest next action'
  )

  backends=('claude' 'codex' 'api')
  formats=('text' 'json' 'completion')

  _arguments \
    '(-v --version)'{-v,--version}'[Show version]' \
    '(-h --help)'{-h,--help}'[Show help]' \
    '--dry-run[Preview without writing/executing]' \
    '--bypass[Skip router; execute canonical SKILL.md]' \
    '--yes[Skip interactive prompts]' \
    "--backend=[LLM backend]:backend:(${backends[*]})" \
    "--format=[Output format]:format:(${formats[*]})" \
    '1: :->verb' \
    '*: :->args'

  case $state in
    verb)
      _describe 'verbs' verbs
      ;;
    args)
      case $words[2] in
        run|describe|replay|chain)
          local skill_list
          skill_list=(${(f)"$(orion list --format=completion 2>/dev/null)"})
          _describe 'skills' skill_list
          ;;
        install|adapter)
          local adapters; adapters=('claude-code' 'cursor' 'codex' 'windsurf')
          _describe 'adapters' adapters
          ;;
      esac
      ;;
  esac
}

_orion "$@"
