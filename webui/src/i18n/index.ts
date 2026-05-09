import { registerLang } from './types'
import zh from './zh'
import en from './en'

registerLang('zh', zh, '中文')
registerLang('en', en, 'English')

export * from './types'
