import * as fs from 'fs'

import NiconicoDL from '@/index'

const niconico = new NiconicoDL(
  // 【東方アレンジ】 U.N.オーエンは彼女なのか？ -MG & GXN- 【東方紅魔郷】
  'https://www.nicovideo.jp/watch/sm28353945',
  'middle'
)

let videoId = ''
void niconico.getVideoInfo().then((info) => (videoId = info.id))
void niconico.download().then((result) => {
  result.pipe(fs.createWriteStream(`${videoId}.mp4`))
  result.on('finish', () => {
    // stop heart beat
    niconico.stop()
  })
})
