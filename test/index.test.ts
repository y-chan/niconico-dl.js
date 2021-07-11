import { BinaryLike, createHash } from 'crypto'

import NiconicoDL from '@/index'

function sha256Checksum(buf: BinaryLike): Buffer {
  return createHash('sha256').update(buf).digest()
}

jest.setTimeout(600 * 1000)

describe('Niconico-DL.js Test by Jest', () => {
  test('try download video and validate checksum', (done) => {
    const niconico = new NiconicoDL(
      // 【東方アレンジ】 U.N.オーエンは彼女なのか？ -MG & GXN- 【東方紅魔郷】
      'https://www.nicovideo.jp/watch/sm28353945',
      'low'
    )

    let allData = Buffer.alloc(0)
    void niconico.download().then((result) => {
      result.on('data', (data: Buffer) => {
        allData = Buffer.concat([allData, data])
      })
      result.on('finish', () => {
        niconico.stop()
        expect(sha256Checksum(allData).toString('hex')).toBe(
          '8496a27f98b51ab80bb134a916df5d4109535cfea2c62dc187526aa974370e9e'
        )
        done()
      })
    })
  })
})
