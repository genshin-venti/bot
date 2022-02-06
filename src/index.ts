import { App } from 'koishi'
import onebot from '@koishijs/plugin-adapter-onebot'
import * as respondent from '@koishijs/plugin-respondent'
import * as ventiVoiceOvers from './Venti-Voices-Chinese'

const app = new App()

app
  .plugin(onebot, {
    protocol: 'ws',
    selfId: '123456789',
    endpoint: 'ws://127.0.0.1:6700',
  })
  .plugin(respondent, {
    rules: [
      {
        match: '欸嘿',
        reply: '欸嘿',
      },
      {
        match: '诶嘿',
        reply: '诶嘿',
      },
    ],
  })
  .plugin(ventiVoiceOvers)
  .start()
