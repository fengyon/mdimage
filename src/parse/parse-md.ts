import { Lexer } from 'marked'
import { dealEmpty } from '.'
import { getParagraphRaw, preloadImgAndTest } from '../image-token/file-io'
import { getLexerOptions, isParagraph } from '../image-token/marked-token'

const PROMISE_STATUS = {
  fulfilled: 'fulfilled',
  rejected: 'rejected',
  pending: 'pending',
}

// 获取originMd经过base64转换后的结果
const getParsedMdString = async (src: string, filepath: string) => {
  const originMd = dealEmpty(src)
  const lexer = new Lexer(getLexerOptions())
  const lexs = lexer.blockTokens(originMd, [])
  let result = ''
  let images = []
  for (let lexItem of lexs) {
    const raw = lexItem.raw || ''
    if (isParagraph(lexItem)) {
      const paragraphRaw = await getParagraphRaw(lexItem, filepath, images)
      result += paragraphRaw
    } else {
      result += raw
    }
  }
  if (images.length > 0) {
    result += `\n\n${images.map(({ imageId, base64Href }) => `[${imageId}]:${base64Href}`).join('\n\n')}`
    return result
  } else {
    return src
  }
}
// 将md文件内容转为base64的md
export const parseMdString = async (src: string, filepath: string) => {
  preloadImgAndTest(src, filepath)
  return getParsedMdString(src, filepath)
}
