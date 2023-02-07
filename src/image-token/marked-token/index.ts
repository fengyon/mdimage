import { marked } from 'marked'
import { ImageToken, TokenItem } from '..'
import { base64Reg, httpReg } from '../../shared/path-judge/const'

export const pathSepReg = /[\/\\]/g

export const isParagraph = (lex: TokenItem) => lex?.type === 'paragraph'
export const isImgToken = (tokenItem: TokenItem) => tokenItem?.type === 'image'
export const isHttpImgToken = (tokenItem: TokenItem) =>
  isImgToken(tokenItem) && httpReg.test((tokenItem as ImageToken).href)
export const isBase64ImgToken = (tokenItem: TokenItem) =>
  isImgToken(tokenItem) && base64Reg.test((tokenItem as ImageToken).href)

// inlineTokens是否有image
export const hasImage = (inlineTokens: TokenItem[]) => inlineTokens?.some((item) => item?.type === 'image')
export const getLexerOptions = (): marked.MarkedOptions => {
  return {
    extensions: {
      block: [
        function (src: string) {
          return this.lexer.tokenizer.def(src)
        },
      ],
    },
  } as marked.MarkedOptions
}
