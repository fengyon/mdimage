import axios from 'axios'
import { parseMdString } from './parse-md'
import { ensureDir } from 'fs-extra'
import { writeFileAsync } from '../shared/file-async'
import { getAbsolutePath } from '../shared/path-judge'
import path from 'path'
export const parseMdHttp = async (url: string): Promise<string> => {
  const fileBlob = await axios
    .get(url, {
      responseType: 'blob',
    })
    .then((res) => res.data)
  const fileText = await fileBlob.text()
  return parseMdString(fileText, url)
}

export const downloadHttpMd = async (fromUrl: string, toPath: string) => {
  const fileContent = await parseMdHttp(fromUrl)
  const writeToAbsolutePath = getAbsolutePath(toPath)
  await ensureDir(path.dirname(writeToAbsolutePath))
  return writeFileAsync(writeToAbsolutePath, fileContent, 'utf8')
}
