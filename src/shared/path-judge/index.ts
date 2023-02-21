import path from 'path'
import { base64Reg, httpReg } from './const'

/**
 * 是否是http链接
 * @param path
 * @returns
 */
export const isHttpPath = (path: string) => httpReg.test(path)

/**
 * 是否是base64链接
 * @param path
 * @returns
 */
export const isBase64Path = (path: string) => base64Reg.test(path)

export const getAbsolutePath = (relativePath: string): string => {
  if (path.isAbsolute(relativePath)) {
    return relativePath
  } else {
    return path.join(process.cwd(), relativePath)
  }
}
