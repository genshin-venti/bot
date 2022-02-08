import { Context, segment } from 'koishi'
import { indexOf, random, shuffle } from 'lodash'
import { join } from 'path'
import { data, Voice } from './ogg'

export const name = 'venti-voice-overs'

const _keys = new Set<string>()
let lastVoice: Voice

data.forEach((item) => {
  item.keys.forEach((key) => _keys.add(key))
})

export function findKeysInText(text: string) {
  const res: string[] = []
  _keys.forEach((key) => {
    const reg = new RegExp(key, 'i')
    if (reg.test(text)) res.push(key)
  })
  return res
}

export function findVoicesByKeys(keys: string[]) {
  const res: Voice[] = []
  data.forEach((o) => {
    keys.forEach((k) => {
      if (indexOf(o.keys, k) >= 0) res.push(o)
    })
  })
  return res
}

export function getFileUrl(filename: string) {
  return 'file:///' + join(__dirname, 'ogg', filename + '.ogg')
}

export function apply(ctx: Context) {
  ctx.middleware((session, next) => {
    if (!session.onebot?.canSendRecord()) return next()

    const message = session.content?.trim()
    if (!message) return next()

    const welcome = /欢迎入群/
    if (welcome.test(message)) {
      const welcomeVoice = findVoicesByKeys(['初次见面'])
      session.sendQueued(
        segment('audio', { file: getFileUrl(welcomeVoice[0].audio) })
      )
      return next()
    }

    const matchVenti = /(温迪)|(巴巴托斯)|(风神)|(吟游诗人)|(吹笛人)|(卖唱的)/
    if (!matchVenti.test(message)) return next()

    const matchLast = /(啥)|(听不清)|(翻译)/
    if (matchLast.test(message)) {
      session.sendQueued(lastVoice.details || '欸嘿，你什么也没有听见哦')
      return next()
    }

    const keys = findKeysInText(message)
    const matchedVoices = shuffle(findVoicesByKeys(keys))
    if (matchedVoices.length > 0) {
      const i = random(0, matchedVoices.length - 1, false)
      session.sendQueued(
        segment('audio', { file: getFileUrl(matchedVoices[i].audio) })
      )
      lastVoice = matchedVoices[i]
    }
    return next()
  })
}
