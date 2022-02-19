import { App, Logger } from 'koishi'
import onebot from '@koishijs/plugin-adapter-onebot'
import SQLiteDatabase from '@koishijs/plugin-database-sqlite'
import * as respondent from '@koishijs/plugin-respondent'
import * as ventiVoiceOvers from '@fenglingbot/plugin-venti-voices-chinese'
import * as waitingForVenti from '@fenglingbot/plugin-waiting-for-venti'
import { join } from 'path'
import TestPlugin from './test'

const app = new App()

Logger.levels.base = process.env.NODE_ENV === 'debug' ? Logger.DEBUG : Logger.INFO

app.options.prefix = '#'
app.options.nickname = ['温迪', 'Venti', 'venti']

app
  .plugin(onebot, {
    protocol: 'ws',
    selfId: '123456789',
    endpoint: 'ws://127.0.0.1:6700',
  })
  .plugin(SQLiteDatabase, {
    path: join(process.cwd(), 'database.db')
  })
  .plugin(TestPlugin)
  .plugin(ventiVoiceOvers)
  .plugin(waitingForVenti)
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
  .start()
