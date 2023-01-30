import path from 'path'
import { base64Reg, httpReg } from './const'

export const isHttpPath = (path: string) => httpReg.test(path)

export const isBase64Path = (path: string) => base64Reg.test(path)

export const getAbsolutePath = (relativePath: string): string => {
  if (path.isAbsolute(relativePath)) {
    return relativePath
  } else {
    return path.join(process.cwd(), relativePath)
  }
}
