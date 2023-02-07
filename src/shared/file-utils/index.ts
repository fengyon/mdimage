import { existsSync, mkdirSync } from 'fs-extra'
import path from 'path'
import { ReadResult } from '../../types/read-dir-deep'

// 写入文件夹
export const writeDir = (toPath: string, { dirs, files }: ReadResult) => {
  const filePaths = files.map((file) => file.relativePath)
  dirs
    .filter(({ relativePath }) => !relativePath || filePaths.some((filePath) => filePath.includes(relativePath)))
    .forEach(
      ({ relativePath }) => !existsSync(path.join(toPath, relativePath)) && mkdirSync(path.join(toPath, relativePath))
    )
}
