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
          '8cd8e26eeefbb266b50a0e3781cb6646eaf1885414fc2f14e39e5cfbbb02b67e'
        )
        done()
      })
    })
  })
})
