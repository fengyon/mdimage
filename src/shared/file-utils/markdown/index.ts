import { writeFile } from 'fs-extra'
import path from 'path'
import { writeDir } from '..'
import { parseMdString } from '../../../parse/parse-md'
import { ReadResult } from '../../../types/read-dir-deep'
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
export const readMdFromOrigin = async (fromPath: string): Promise<ReadResult> => {
  const { dirs, files } = await readdirDeep(fromPath, {
    shouldReadFile: ({ absolutePath }) => typeof absolutePath === 'string' && absolutePath.endsWith('.md'),
  })
  return { dirs, files }
}
// 转换本地的md文件
export const wirteLocaleMd = async (from: string, to: string) => {
  const fromPath = getAbsolutePath(from)
  const toPath = getAbsolutePath(to)

  const readedResult = await readMdFromOrigin(fromPath)
  writeDir(toPath, readedResult)
  const results = await writeFileToParsed(toPath, readedResult)
  console.log(`转换完成，${results.length}个文件，全部写入 ${toPath} \n`)
}
