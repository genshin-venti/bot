# 温迪留声机

基于 Koishi 开发的温迪机器人，更多功能还没画出饼。

该项目仅供学习使用。

项目中一切原神相关资源（包括但不限于文本、图片、视频、音频）版权均由米哈游所有。

## 运行

环境：nodejs v12+

首先需要自行安装并启动 cqhttp 服务，参考：[go-cqhttp](https://docs.go-cqhttp.org/guide/)、[@koishijs/plugin-adapter-onebot](https://koishi.js.org/plugins/adapter/onebot.html)

然后，修改 `src/index.ts` 中 `onebot` 相关配置，对应自己的 cqhttp 服务。

最后，安装并启动项目：
（这里使用pnpm，你也可以自己换成npm/yarn）
```shell
$ git clone https://gitee.com/iFrankStudio/genshin-venti-bot.git
$ cd genshin-venti-bot
$ pnpm i
$ pnpm start
```