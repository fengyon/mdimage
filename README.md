## mdimage 转换md文件中图片的脚本

### 用途

  将md文件中的本地图片转为base64，**目前开发中，仅能自用**

### 1. 安装mdimage

```shell
npm install mdimage -g
```

### 2. 转换

```shell
mdimage parse -f origin -t parsed 
# -f, --from <path>   转换后的md文件存放目录
# -t, --to <path>     需要转换的md文件源目录
```

### 3. 配置

```shell
mdimage config set -f ./ -t parsed -md 10 -mdc 100 -mfc 100
# -f, --from <path>              转换后的md文件存放目录
# -t, --to <path>                需要转换的md文件源目录
# -md, --maxDeep <number>        读取文件的最大深度
# -mdc, --maxDirCount <number>   读取目录的最大数量
# -mfc, --maxFileCount <number>  读取md文件的最大数量
```
