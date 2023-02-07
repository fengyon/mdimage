import { existsSync, readFile } from 'fs-extra'
import { Lexer } from 'marked'
import path from 'path'
import { ImageToken, TokenItem } from '..'
import { dealEmpty } from '../../parse'
import { httpReg } from '../../shared/path-judge/const'
import { retryInError } from '../../shared/retry-error'
import { getLexerOptions, hasImage, isImgToken, isParagraph, pathSepReg } from '../marked-token'

import { ImageItem } from '../../types/parse-md'

// base64的缓存 path -> Promise<string>
const base64Map = Object.create(null)

export const getFilePath = (tokenItem: ImageToken, filepath: string) => {
  const posixHref = tokenItem.href
  const href = posixHref.replace(pathSepReg, path.sep)
  // 本地链接
  const absolutePath = path.isAbsolute(href) ? href : path.join(path.dirname(filepath), href)
  return absolutePath
}
export const isLocalImgToken = (tokenItem: TokenItem, filepath: string) =>
  isImgToken(tokenItem) && existsSync(getFilePath(tokenItem as ImageToken, filepath))

// 将href转为base64
export const parseHrefToBase64 = async (tokenItem: ImageToken, filepath: string) => {
  const posixHref = tokenItem.href
  if (httpReg.test(posixHref)) {
    // http链接
  } else {
    const absolutePath = getFilePath(tokenItem, filepath)
    if (base64Map[absolutePath]) {
      return base64Map[absolutePath]
    }
    const result = retryInError(
      () =>
        Promise.resolve(readFile(absolutePath)).then(
          (bufferResult) =>
            `data:image/${path.extname(absolutePath).replace('.', '')};base64,${bufferResult.toString('base64')}`
        ),
      5 // 重试5次
    )
    base64Map[absolutePath] = result
    return result
  }
}

// 将当前的token加入到images
const getNextImage = async (inlineTokenItem: ImageToken, filepath: string, images: ImageItem[]): Promise<ImageItem> => {
  const imageIdPrefix = 'mdimage-transfer-img-to-base64-id'
  const parsedBase64 = await parseHrefToBase64(inlineTokenItem, filepath)
  const exsitImage = images.find(({ base64Href }) => base64Href === parsedBase64)
  if (exsitImage) {
    return exsitImage
  }
  return {
    imageId: `${imageIdPrefix}${images.length}`,
    base64Href: parsedBase64,
  }
}

export const getParagraphRaw = async (lexItem: TokenItem, filepath: string, images: ImageItem[]): Promise<string> => {
  const raw = lexItem.raw || ''
  const inlineTokens = new Lexer().inlineTokens(lexItem.raw)
  if (hasImage(inlineTokens)) {
    let imageRaw = ''
    for (let tokenItem of inlineTokens) {
      const inlineTokenRaw = tokenItem.raw || ''
      if (isLocalImgToken(tokenItem, filepath)) {
        const imageObj = await getNextImage(tokenItem as ImageToken, filepath, images)
        if (!images.includes(imageObj)) {
          images.push(imageObj)
        }
        const replaceValue = `![${(tokenItem as ImageToken).text}][${imageObj.imageId}]`
        imageRaw += replaceValue
      } else {
        imageRaw += inlineTokenRaw
      }
    }
    return imageRaw
  }
  return raw
}

// 检查raw是否为原内容，并预加载图片文件
export const preloadImgAndTest = (src: string, filepath: string) => {
  const originMd = dealEmpty(src)
  let testRaw = ''
  const lexs = new Lexer(getLexerOptions()).blockTokens(originMd, [])
  lexs.forEach((lexItem) => {
    const raw = lexItem.raw || ''
    if (isParagraph(lexItem)) {
      const inlineTokens = new Lexer().inlineTokens(lexItem.raw)
      if (hasImage(inlineTokens)) {
        inlineTokens.forEach((tokenItem) => {
          if (isLocalImgToken(tokenItem, filepath)) {
            parseHrefToBase64(tokenItem as ImageToken, filepath)
          }
        })
        testRaw += inlineTokens.map((item) => item.raw || '').join('')
        return
      }
    }
    testRaw += raw
  })
  if (testRaw !== originMd) {
    throw Error(`raw并不相等，丢失了信息： ${filepath}`)
  } else {
    console.log('   测试信息：token.raw是原内容，相加无误')
  }
}
