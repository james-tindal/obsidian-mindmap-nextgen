import { getLanguage } from 'obsidian'
import en from './en'
import zhSimplified from './zh-simplified'
import zhTraditional from './zh-traditional'


// Information about Obsidian locale strings here:
// https://github.com/obsidianmd/obsidian-translations#existing-languages
// 'zh' is simplified Chinese, 'zh-TW' is traditional Chinese

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
