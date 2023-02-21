import { ensureFile, existsSync, lstatSync, readFile, writeFile } from 'fs-extra'
import { configFilePath, ConfigOptions, defaultOptions } from './const'

export const getValidOptions = (options: ConfigOptions): ConfigOptions =>
  Object.keys(defaultOptions).reduce(
    (memo, key) => {
      if (options[key]) {
        memo[key] = options[key]
      }
      return memo
    },
    { ...defaultOptions } as ConfigOptions
  )

export const wirteOptionsToFile = async (options: ConfigOptions): Promise<void> => {
  await ensureFile(configFilePath)
  await writeFile(configFilePath, JSON.stringify({ ...defaultOptions, ...options }), 'utf8')
}

export const readOptionsFromFile = async (): Promise<ConfigOptions> => {
  let readedOptions = {}
  if (existsSync(configFilePath) && lstatSync(configFilePath).isFile()) {
    const result = await readFile(configFilePath, 'utf-8')
    readedOptions = JSON.parse(result)
  }
  return {
    ...defaultOptions,
    ...readedOptions,
  } as ConfigOptions
}
