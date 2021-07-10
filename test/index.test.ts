import { BinaryLike, createHash } from 'crypto'

import NiconicoDL from '@/index'

function sha256Checksum(buf: BinaryLike): Buffer {
  return createHash('sha256').update(buf).digest()
}

jest.setTimeout(600 * 1000)

describe('Niconico-DL.js Test by Jest', () => {
  test('try download video and validate checksum', (done) => {
    // 【東方アレンジ】 U.N.オーエンは彼女なのか？ -MG & GXN- 【東方紅魔郷】
    const niconico = new NiconicoDL('https://www.nicovideo.jp/watch/sm28353945')

    let allData = Buffer.alloc(0)
    void niconico.download().then((result) => {
      result.on('data', (data: Buffer) => {
        allData = Buffer.concat([allData, data])
      })
      result.on('finish', () => {
        niconico.stop()
        expect(sha256Checksum(allData).toString('hex')).toBe(
          'e18eca95b60adde111e581304a1ce3bf39a5784bdebd7433a789faf5b1e1802b'
        )
        done()
      })
    })
  })
})
