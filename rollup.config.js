/* eslint-disable @typescript-eslint/no-var-requires */
import json from '@rollup/plugin-json'
// import babel from '@rollup/plugin-babel')
// import { cleandir } from 'rollup-plugin-cleandir')
import { nodeResolve } from '@rollup/plugin-node-resolve'
// import tsConfig from './tsconfig.ts')
import commonjs from '@rollup/plugin-commonjs'
import externals from 'rollup-plugin-node-externals'
import typescript from '@rollup/plugin-typescript'
import tsConfig from './tsconfig.js'

const banner = `
/**
 * marked - a markdown parser
 * Copyright (c) 2022-${new Date().getFullYear()}, Fengyon. (MIT Licensed)
 * https://github.com/fengyon/mdimage
 */
var navigator = {};
`

export default [
  {
    input: './src/cli.ts',
    output: {
      file: 'lib/cli.esm.js',
      format: 'esm',
      banner,
    },
  },
  {
    input: './src/cli.ts',
    output: {
      file: 'lib/cli.umd.js',
      format: 'umd',
      name: 'mdimage',
      banner,
    },
  },
  {
    input: './src/cli.ts',
    output: {
      file: 'lib/cli.cjs',
      format: 'cjs',
      name: 'mdimage',
      banner,
    },
  },
].map((item) => ({
  plugins: [
    // 自动将dependencies依赖声明为外部依赖
    // externals({ devDeps: false }),
    typescript(),
    nodeResolve({
      extensions: ['.js', '.ts', '.json'],
      modulesOnly: true,
      preferredBuiltins: false,
    }),
    commonjs({ extensions: ['.js', '.ts'] }), // the ".ts" extension is required
    json(),
    // cleandir('./lib'),
  ],
  ...item,
}))
