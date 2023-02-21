import PACK from '../package.json'
import { Command, Option } from 'commander'
import chalk from 'chalk'
import { getAbsolutePath, isHttpPath } from './shared/path-judge'
import { downloadHttpMd } from './parse/get-md-http'
import { commandConfirm, dealValue, formatStrByArr, wrapLoading } from './shared/cli-utils'
import { wirteLocaleMd } from './shared/file-utils/markdown'
import {
  cliFields,
  ConfigOptions,
  CONFIG_FIELD,
  CONFIG_FIELD_SIMPLE,
  defaultOptions,
  FIELD_DESCRIPTION,
} from './shared/cli-utils/config/const'
import { getValidOptions, readOptionsFromFile, wirteOptionsToFile } from './shared/cli-utils/config'

const program = new Command()
program
  .command('parse [others...]')
  .description('转换md文件中的图片格式')
  .addOption(new Option(`-${CONFIG_FIELD_SIMPLE.from}, --${CONFIG_FIELD.from} <path>`, FIELD_DESCRIPTION.from))
  .addOption(new Option(`-${CONFIG_FIELD_SIMPLE.to}, --${CONFIG_FIELD.to} <path>`, FIELD_DESCRIPTION.to))
  .addOption(new Option(`-${CONFIG_FIELD_SIMPLE.imgto}, --${CONFIG_FIELD.imgto} <type>`, FIELD_DESCRIPTION.imgto))
  .action(async (others, cliOptions: ConfigOptions) => {
    const configOptions = await readOptionsFromFile()
    const options = getValidOptions({
      ...configOptions,
      ...cliOptions,
    })
    const { to, from, imgto } = options
    const isBase64 = true || imgto === 'base64'
    if (isBase64) {
      const absoluteFrom = getAbsolutePath(from)
      const absoluteTo = getAbsolutePath(to)
      const isConfirm = await commandConfirm(`确定要将${chalk.bold(absoluteFrom)}文件写入${chalk.bold(absoluteTo)}吗？`)
      if (!isConfirm) {
        console.log(`${chalk.gray('取消转换')}`)
        return
      }
      wrapLoading(isHttpPath(from) ? downloadHttpMd : wirteLocaleMd)(absoluteFrom, absoluteTo, options)
    } else if (isHttpPath(imgto)) {
      console.log('待支持')
    }
  })

// 配置设置
const configCommand = program.command('config').description('配置命令: set设置配置,get获取配置')

/**
 * 创建参数转换函数
 * @param field 命令字段
 * @returns 参数转换函数，将输入的字符串转成文字
 */
const createArgParser =
  (field: CONFIG_FIELD.maxDeep | CONFIG_FIELD.maxDirCount | CONFIG_FIELD.maxFileCount) => (value: string) =>
    (value && Number(value)) || defaultOptions[field]

configCommand
  .command('set [others...]')
  .description('获取转换的默认配置')
  .addOption(new Option(`-${CONFIG_FIELD_SIMPLE.from}, --${CONFIG_FIELD.from} <path>`, FIELD_DESCRIPTION.from))
  .addOption(new Option(`-${CONFIG_FIELD_SIMPLE.to}, --${CONFIG_FIELD.to} <path>`, FIELD_DESCRIPTION.to))
  .addOption(new Option(`-${CONFIG_FIELD_SIMPLE.imgto}, --${CONFIG_FIELD.imgto} <type>`, FIELD_DESCRIPTION.imgto))
  .addOption(
    new Option(
      `-${CONFIG_FIELD_SIMPLE.maxDeep}, --${CONFIG_FIELD.maxDeep} <number>`,
      FIELD_DESCRIPTION.maxDeep
    ).argParser(createArgParser(CONFIG_FIELD.maxDeep))
  )
  .addOption(
    new Option(
      `-${CONFIG_FIELD_SIMPLE.maxDirCount}, --${CONFIG_FIELD.maxDirCount} <number>`,
      FIELD_DESCRIPTION.maxDirCount
    ).argParser(createArgParser(CONFIG_FIELD.maxDirCount))
  )
  .addOption(
    new Option(
      `-${CONFIG_FIELD_SIMPLE.maxFileCount}, --${CONFIG_FIELD.maxFileCount} <number>`,
      FIELD_DESCRIPTION.maxFileCount
    ).argParser(createArgParser(CONFIG_FIELD.maxFileCount))
  )
  .action((others: string[], options: ConfigOptions) => {
    if (Object.values(options).filter(Boolean).length === 0) {
      program.error(chalk.red('请输入设置的选项'))
    } else {
      wirteOptionsToFile(options).then(
        () => console.log(chalk.green('配置成功')),
        (error) => program.error(chalk.red(`配置失败: ${error}`))
      )
    }
  })
// 配置获取
configCommand
  .command('get [others...]')
  .description('设置转换的默认配置')
  .addOption(new Option(`-${CONFIG_FIELD_SIMPLE.from}, --${CONFIG_FIELD.from}`, FIELD_DESCRIPTION.from))
  .addOption(new Option(`-${CONFIG_FIELD_SIMPLE.to}, --${CONFIG_FIELD.to}`, FIELD_DESCRIPTION.to))
  .addOption(new Option(`-${CONFIG_FIELD_SIMPLE.imgto}, --${CONFIG_FIELD.imgto}`, FIELD_DESCRIPTION.imgto))
  .addOption(new Option(`-${CONFIG_FIELD_SIMPLE.maxDeep}, --${CONFIG_FIELD.maxDeep}`, FIELD_DESCRIPTION.maxDeep))
  .addOption(
    new Option(`-${CONFIG_FIELD_SIMPLE.maxDirCount}, --${CONFIG_FIELD.maxDirCount}`, FIELD_DESCRIPTION.maxDirCount)
  )
  .addOption(
    new Option(`-${CONFIG_FIELD_SIMPLE.maxFileCount}, --${CONFIG_FIELD.maxFileCount}`, FIELD_DESCRIPTION.maxFileCount)
  )
  .action((others: string[], options: ConfigOptions) => {
    readOptionsFromFile().then(
      (validOptions) => {
        const isEmptyOptions = Object.values(options).filter(Boolean).length === 0
        const hasKey = (key: keyof ConfigOptions): boolean => isEmptyOptions || Boolean(options[key])
        console.log(
          formatStrByArr(
            cliFields
              .map(
                (field) =>
                  hasKey(field) && [chalk.cyan(field), dealValue(String(validOptions[field])), FIELD_DESCRIPTION[field]]
              )
              .filter(Boolean) as string[][]
          )
        )
      },
      (error) => program.error(chalk.red(`获取配置失败: ${error}`))
    )
  })

program
  .name(PACK.name)
  .description(`CLI to ${PACK.name}. ${PACK.description}`)
  .version(`${PACK.name}@${PACK.version}`, '-v,  --version')
  .usage('<command> [option]')

program.on('-h, --help', () => {
  console.log()
  console.log(`运行 ${chalk.cyan('mdimage <command> --help')} 查看更多信息`)
  console.log()
})
program.showHelpAfterError(true)
program.parse(process.argv)
