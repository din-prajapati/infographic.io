# orion bash completion
# Install: source <(orion install --completion)
#      or: orion install --completion >> ~/.bashrc

_orion_completions() {
  local cur prev words cword
  _init_completion 2>/dev/null || {
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
  }

  local verbs="run install sync doctor list describe help replay chain next fleet migrate"

  case "${prev}" in
    orion)
      local skills
      skills=$(orion list --format=completion 2>/dev/null)
      COMPREPLY=( $(compgen -W "${verbs} ${skills}" -- "${cur}") )
      ;;
    run|describe|replay|chain)
      local skills
      skills=$(orion list --format=completion 2>/dev/null)
      COMPREPLY=( $(compgen -W "${skills}" -- "${cur}") )
      ;;
    install|adapter)
      COMPREPLY=( $(compgen -W "claude-code cursor codex windsurf" -- "${cur}") )
      ;;
    --backend)
      COMPREPLY=( $(compgen -W "claude codex api" -- "${cur}") )
      ;;
    --format)
      COMPREPLY=( $(compgen -W "text json completion" -- "${cur}") )
      ;;
    --profile)
      COMPREPLY=( $(compgen -W "core fullstack-ts planning-only" -- "${cur}") )
      ;;
    *)
      COMPREPLY=( $(compgen -W "${verbs}" -- "${cur}") )
      ;;
  esac
}

complete -F _orion_completions orion
