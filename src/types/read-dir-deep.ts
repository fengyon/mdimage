import { Stats } from 'fs'

export type FileStats = Stats & {
  isFile(): true
  isDirectory(): false
}
export type DirectoryStats = Stats & {
  isFile(): false
  isDirectory(): true
}
export interface FileInfo {
  absolutePath: string
  relativePath: string
  fileType: FileStats
}
export type FileResult = FileInfo & {
  result: Buffer
}
export interface DirectoryInfo {
  absolutePath: string
  relativePath: string
  fileType: DirectoryStats
}
export type DirectoryResult = DirectoryInfo & {
  result: string[]
}

export interface ReadHooks {
  shouldReadDir?: (a: DirectoryInfo) => Promise<boolean> | boolean
  shouldReadFile?: (a: FileInfo) => Promise<boolean> | boolean
}
export interface ReadResult {
  dirs: DirectoryResult[]
  files: FileResult[]
}
