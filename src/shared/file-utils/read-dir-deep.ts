import { lstatSync } from 'fs'
import path from 'path'
import { DirectoryInfo, DirectoryStats, FileInfo, FileStats, ReadHooks, ReadResult } from '../../types/read-dir-deep'
import { readdirAsync, readFileAsync } from '../file-async'
export const sepReg = /[\\\/]/g
export const getSysPath = (somepath: string): string => somepath.replace(sepReg, path.sep)
export const getRelativePath = (absolutePath: string, basePath: string): string =>
  getSysPath(absolutePath)
    .replace(getSysPath(basePath), '')
    .replace(/(^[\\\/])|([\\\/]$)/, '')

export const sortByRelative = <T extends { relativePath: string }>(a: T, b: T): number =>
  a.relativePath.length - b.relativePath.length

/**
 * 读取所有的文件
 * @param  absolutePath 绝对路径
 * @param  hooks
 * @returns
 */
export const readdirDeep = async (rootPath: string, hooks: ReadHooks = {}): Promise<ReadResult> => {
  const shouldReadDir = (dirInfo: DirectoryInfo) => !hooks.shouldReadDir || hooks.shouldReadDir(dirInfo)
  const shouldReadFile = (fileInfo: FileInfo) => !hooks.shouldReadFile || hooks.shouldReadFile(fileInfo)
  let result: ReadResult = {
    dirs: [],
    files: [],
  }
  const toRead = async (absolutePath: string): Promise<void> => {
    const fileType = lstatSync(absolutePath)
    if (fileType.isDirectory()) {
      const dirInfo: DirectoryInfo = {
        absolutePath,
        relativePath: getRelativePath(absolutePath, rootPath),
        fileType: fileType as DirectoryStats,
      }
      const isShouldReadDir = await shouldReadDir(dirInfo)
      if (!isShouldReadDir) {
        return
      }
      const files = await readdirAsync(absolutePath)
      result.dirs.push({
        ...dirInfo,
        result: files,
      })
      await Promise.all(files.map((filename) => toRead(path.join(absolutePath, filename))))
    } else if (fileType.isFile()) {
      const fileInfo: FileInfo = {
        absolutePath,
        relativePath: getRelativePath(absolutePath, rootPath),
        fileType: fileType as FileStats,
      }
      const isShouldReadFile = await shouldReadFile(fileInfo)
      if (!isShouldReadFile) {
        return
      }
      const fileBuffer = await readFileAsync(absolutePath)
      result.files.push({
        ...fileInfo,
        result: fileBuffer,
      })
    } else {
      throw Error(`error the file wasn't read ${absolutePath}`)
    }
  }
  await toRead(rootPath)
  result.dirs.sort(sortByRelative)
  result.files.sort(sortByRelative)
  return result
}
