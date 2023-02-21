import { writeFile } from 'fs-extra'
import path from 'path'
import { writeDir } from '..'
import { pathSepReg } from '../../../image-token/marked-token'
import { parseMdString } from '../../../parse/parse-md'
import { DirectoryInfo, FileInfo, ReadResult } from '../../../types/read-dir-deep'
import { ConfigOptions } from '../../cli-utils/config/const'
import { getAbsolutePath } from '../../path-judge'
import { readdirDeep } from '../read-dir-deep'
// 将文件写入目标文件夹
export const writeFileToParsed = async (toPath: string, { files }: ReadResult) => {
  let index = 0
  return Promise.all(
    files.map(async ({ result, absolutePath, relativePath }) => {
      const content = result.toString('utf-8')
      const parsedMd = await parseMdString(content, absolutePath)
      const writeToAbsolutePath = path.join(toPath, relativePath)
      await writeFile(writeToAbsolutePath, parsedMd, 'utf8')
      console.log(
        `${++index}: ${path.basename(writeToAbsolutePath)}写入成功： `,
        `${writeToAbsolutePath} -> ${absolutePath}\n`
      )
    })
  )
}
// 读取md文件
export const readMdFromOrigin = async (fromPath: string, readOptions: ConfigOptions): Promise<ReadResult> => {
  let fileCount = 0,
    dirCount = 0
  const checkDeep = ({ absolutePath, relativePath }: FileInfo | DirectoryInfo): boolean => {
    const length = relativePath.match(pathSepReg)?.length || 0
    if (readOptions.maxDeep && length > readOptions.maxDeep) {
      throw Error(`正在读取的 ${absolutePath} 超出${readOptions.maxDeep}层`)
    } else {
      return true
    }
  }
  const { dirs, files } = await readdirDeep(fromPath, {
    shouldReadFile: (fileInfo) => {
      const { absolutePath } = fileInfo
      checkDeep(fileInfo)

      const isMd = typeof absolutePath === 'string' && absolutePath.endsWith('.md')
      if (!isMd) {
        return false
      }

      if (readOptions.maxFileCount && ++fileCount > readOptions.maxFileCount) {
        throw Error(`读取的${fromPath}中md文件超过${readOptions.maxFileCount}个`)
      }
      return true
    },
    shouldReadDir(fileInfo) {
      checkDeep(fileInfo)
      if (readOptions.maxDirCount && ++dirCount > readOptions.maxDirCount) {
        throw Error(`读取的${fromPath}中的目录超过${readOptions.maxDirCount}个`)
      }
      return true
    },
  })
  return { dirs, files }
}
// 转换本地的md文件
export const wirteLocaleMd = async (from: string, to: string, readOptions: ConfigOptions) => {
  const fromPath = getAbsolutePath(from)
  const toPath = getAbsolutePath(to)

  const readedResult = await readMdFromOrigin(fromPath, readOptions)
  if (readedResult.files?.length > 0) {
    writeDir(toPath, readedResult)
    const results = await writeFileToParsed(toPath, readedResult)
    console.log(`转换完成，${results.length}个文件，全部写入 ${toPath} \n`)
  } else {
    console.log('没有文件需要写入')
  }
}
