import { readdir, readFile, writeFile } from 'fs'
import { promisify } from 'util'

export const readFileAsync = promisify(readFile)
export const writeFileAsync = promisify(writeFile)
export const readdirAsync = promisify(readdir)
