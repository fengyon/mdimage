import chalk from 'chalk'
import ora from 'ora'
import { getStrLength } from '../index'
import { COLUMN_SEP, ROW_SEP } from './const'
export const wrapLoading = <T extends (...args: any[]) => any>(fn: T): T => {
  return function wrapedLoading(...args) {
    const loadingInstance = ora({
      text: '加载中',
    })
    loadingInstance.start()
    const value = fn.apply(this, args)
    Promise.resolve(value).then(
      () => loadingInstance.succeed('操作成功'),
      (error) => loadingInstance.fail(`操作失败：${String(error)}`)
    )
    return value
  } as T
}

export const loadingPromise = <T extends Promise<any>>(promise: T): T => wrapLoading(() => promise)()
export const dealValue = (value: string, defaultValue = '<空值>') =>
  typeof value === 'string' ? (value ? chalk.green(value) : chalk.gray(defaultValue)) : value

// 格式化文字，用于输出对齐
export const formatStr = (str: string): string => {
  if (typeof str !== 'string') {
    return str
  }
  const lines = str.split(COLUMN_SEP)
  let validLines: string[][] = []
  let maxLengths: number[] = []
  lines.forEach((line) => {
    const rows = line.split(/\s+/).filter(Boolean)
    validLines.push(rows)
    rows.forEach((row, index) => {
      maxLengths[index] = Math.max(maxLengths[index] || 0, getStrLength(row))
    })
  })
  return validLines
    .map((line) =>
      line.map((row, rowIndex) => `${row}${ROW_SEP.repeat(maxLengths[rowIndex] - getStrLength(row))}`).join(ROW_SEP)
    )
    .join(COLUMN_SEP)
}
export interface FormatOption {
  rowSep?: string
  columnSep?: string
}

export const formatStrByArr = (array: string[][], options?: FormatOption) => {
  // 格式化文字，用于输出对齐
  if (!Array.isArray(array)) {
    return String(array)
  }
  const { rowSep = ROW_SEP, columnSep = COLUMN_SEP } = options || {}
  let maxLengths: number[] = []
  array.forEach((line) => {
    line.forEach((row, index) => {
      maxLengths[index] = Math.max(maxLengths[index] || 0, getStrLength(row))
    })
  })
  return array
    .map((line) =>
      line.map((row, rowIndex) => `${row}${ROW_SEP.repeat(maxLengths[rowIndex] - getStrLength(row))}`).join(rowSep)
    )
    .join(columnSep)
}
