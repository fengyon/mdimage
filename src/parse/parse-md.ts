import { Lexer } from 'marked'
import { readdirDeep } from '../shared/read-dir-deep'
const path = require('path')

const getLexerOptions = () => {
  return {
    extensions: {
      block: [
        function (src) {
          return this.lexer.tokenizer.def(src)
        },
      ],
    },
  }
}
import fs from 'fs'
import { readFileAsync, writeFileAsync } from '../shared/file-async'
import { ImageItem } from '../types/parse-md'
import { ReadResult } from '../types/read-dir-deep'
import { retryInError } from '../shared/retry-error'
import { base64Reg, httpReg } from '../shared/path-judge/const'
import { getAbsolutePath, isHttpPath } from '../shared/path-judge'
const isHttp = (tokenItem) => httpReg.test(tokenItem.href)
const isBase64 = (tokenItem) => base64Reg.test(tokenItem.href)
const getFilePath = (tokenItem, filepath) => {
  const posixHref = tokenItem.href
  const href = posixHref.replaceAll(path.posix.sep, path.sep)
  // 本地链接
  const absolutePath = path.isAbsolute(href) ? href : path.join(path.dirname(filepath), href)
  return absolutePath
}
const isLocalFile = (tokenItem, filepath) => fs.existsSync(getFilePath(tokenItem, filepath))
const PROMISE_STATUS = {
  fulfilled: 'fulfilled',
  rejected: 'rejected',
  pending: 'pending',
}
// base64的缓存 path -> Promise<string>
const base64Map = Object.create(null)
// 获取图片的重试次数
const retryCount = 5
// 将href转为base64
const parseHrefToBase64 = async (tokenItem, filepath: string) => {
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
        Promise.resolve(readFileAsync(absolutePath)).then(
          (bufferResult) =>
            `data:image/${path.extname(absolutePath).replace('.', '')};base64,${bufferResult.toString('base64')}`
        ),
      retryCount
    )
    base64Map[absolutePath] = result
    return result
  }
}
// 需要转换的token, 只转换本地文件与网络文件
const needParse = (tokenItem, filepath) => {
  if (tokenItem?.type !== 'image') return false
  if (!tokenItem.raw) return false
  if (!tokenItem.href) return false
  // base64，不处理
  if (isBase64(tokenItem)) return false
  // http链接，返回true
  if (isHttp(tokenItem)) return true
  // 只处理本地文件
  return isLocalFile(tokenItem, filepath)
}

const dealEmpty = (src: string): string =>
  src.replace(/^( *)(\t+)/gm, (_, leading, tabs) => leading + '    '.repeat(tabs.length))

// inlineTokens是否有image
const hasImage = (inlineTokens) => inlineTokens?.some((item) => item?.type === 'image')

const isParagraph = (lex) => lex?.type === 'paragraph'
// 检查raw是否为原内容，并预加载图片文件
const preloadImgAndTest = (src: string, filepath: string) => {
  const originMd = dealEmpty(src)
  let testRaw = ''
  const lexs = new Lexer(getLexerOptions()).blockTokens(originMd)
  lexs.forEach((lexItem) => {
    const raw = lexItem.raw || ''
    if (isParagraph(lexItem)) {
      const inlineTokens = new Lexer().inlineTokens(lexItem.raw)
      if (hasImage(inlineTokens)) {
        inlineTokens.forEach((tokenItem) => {
          if (needParse(tokenItem, filepath)) {
            parseHrefToBase64(tokenItem, filepath)
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

// 将当前的token加入到images
const getNextImage = async (inlineTokenItem, filepath: string, images: ImageItem[]): Promise<ImageItem> => {
  const imageIdPrefix = 'md-img-to-base64-fengyon-id'
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

const getParagraphRaw = async (lexItem, filepath: string, images: ImageItem[]): Promise<string> => {
  const raw = lexItem.raw || ''
  const inlineTokens = new Lexer().inlineTokens(lexItem.raw)
  if (hasImage(inlineTokens)) {
    let imageRaw = ''
    for (let tokenItem of inlineTokens) {
      const inlineTokenRaw = tokenItem.raw || ''
      if (needParse(tokenItem, filepath)) {
        // raw = raw.replace(tokenItem.raw.trim(), replaceValue)
        const imageObj = await getNextImage(tokenItem, filepath, images)
        if (!images.includes(imageObj)) {
          images.push(imageObj)
        }
        const replaceValue = `![${tokenItem.text}][${imageObj.imageId}]`
        imageRaw += replaceValue
      } else {
        imageRaw += inlineTokenRaw
      }
    }
    return imageRaw
  }
  return raw
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
// 读取md文件
export const readMdFromOrigin = async (fromPath: string): Promise<ReadResult> => {
  const { dirs, files } = await readdirDeep(fromPath, {
    shouldReadFile(fileInfo) {
      return path.extname(fileInfo.absolutePath) === '.md'
    },
  })
  return { dirs, files }
}
// 写入文件夹
export const writeDir = (toPath: string, { dirs, files }: ReadResult) => {
  const filePaths = files.map((file) => file.relativePath)
  dirs
    .filter(({ relativePath }) => !relativePath || filePaths.some((filePath) => filePath.includes(relativePath)))
    .forEach(
      ({ relativePath }) =>
        !fs.existsSync(path.join(toPath, relativePath)) && fs.mkdirSync(path.join(toPath, relativePath))
    )
}
// 将文件写入目标文件夹
export const writeFileToParsed = async (toPath: string, { files }: ReadResult) => {
  let index = 0
  return Promise.all(
    files.map(async ({ result, absolutePath, relativePath }) => {
      const content = result.toString('utf-8')
      const parsedMd = await parseMdString(content, absolutePath)
      // console.log(`${path.basename(absolutePath)}读取成功： `, absolutePath)
      const writeToAbsolutePath = path.join(toPath, relativePath)
      await writeFileAsync(writeToAbsolutePath, parsedMd, 'utf8')
      console.log(
        `${++index}: ${path.basename(writeToAbsolutePath)}写入成功： `,
        `${writeToAbsolutePath} -> ${absolutePath}\n`
      )
    })
  )
}

export const wirteLocaleMd = async (from: string, to: string) => {
  const fromPath = getAbsolutePath(from)
  const toPath = getAbsolutePath(to)
  console.log({ fromPath, toPath })
  const readedResult = await readMdFromOrigin(fromPath)
  console.log(`origin读取完毕: ${fromPath}\n`)
  writeDir(toPath, readedResult)
  console.log(`目标文件夹写入完毕: ${toPath}\n`)
  try {
    const results = await writeFileToParsed(toPath, readedResult)
    console.log(`转换完成，${results.length}个文件，全部写入 ${toPath} \n`)
  } catch (error) {
    console.error('转换失败')
    console.error(error)
  }
}
