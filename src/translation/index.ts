import { getLanguage } from 'obsidian'
import en from './en'
import zhSimplified from './zh-simplified'
import zhTraditional from './zh-traditional'


type TranslationStrings = typeof en
const locales: Record<string, TranslationStrings> = {
  en,
  zh: zhSimplified,
  'zh-CN': zhSimplified,
  'zh-TW': zhTraditional,
}

const locale = getLanguage()
const language = locale.slice(0, 2)

export const strings = locales[locale] ?? locales[language] ?? locales.en
