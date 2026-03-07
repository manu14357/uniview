import { UvEdCommandStack } from '../uniview-editor'
import { UvApI18n, UvApLocale } from './uniview-ap-i18n'
import enCommand from './uniview-en/uniview-command'
import enJig from './uniview-en/uniview-jig'
import enMain from './uniview-en/uniview-main'
import zhCommand from './uniview-zh/uniview-command'
import zhJig from './uniview-zh/uniview-jig'
import zhMain from './uniview-zh/uniview-main'

// Register core locale messages
UvApI18n.mergeLocaleMessage('en', {
  command: enCommand,
  jig: enJig,
  main: enMain
})
UvApI18n.mergeLocaleMessage('zh', {
  command: zhCommand,
  jig: zhJig,
  main: zhMain
})

export const cmdDescription = (groupName: string, cmdName: string) => {
  const key = `command.${groupName}.${cmdName}`
  return UvApI18n.t(key)
}

export const sysCmdDescription = (name: string) => {
  return cmdDescription(UvEdCommandStack.SYSTEMT_COMMAND_GROUP_NAME, name)
}

export const userCmdDescription = (name: string) => {
  return cmdDescription(UvEdCommandStack.DEFAUT_COMMAND_GROUP_NAME, name)
}

export { UvApI18n, type UvApLocale }
