import fetch from 'node-fetch'
import { parse } from 'node-html-parser'
import Timeout = NodeJS.Timeout

interface NiconicoAPIData {
  media: {
    delivery: {
      movie: {
        session: {
          videos: string[]
          audios: string[]
          heartbeatLifetime: number
          recipeId: string
          priority: number
          urls: {
            isWellKnownPort: boolean
            isSsl: boolean
            [key: string]: any
          }[]
          token: string
          signature: string
          contentId: string
          authTypes: {
            http: string
          }
          contentKeyTimeout: number
          serviceUserId: string
          playerId: string
          [key: string]: any
        }
        [key: string]: any
      }
      [key: string]: any
    }
    [key: string]: any
  }
  video: VideoInfo
  [key: string]: any
}

export interface VideoInfo {
  id: string
  title: string
  description: string
  count: {
    view: number
    comment: number
    mylist: number
    like: number
  }
  duration: number
  thumbnail: {
    url: string
    middleUrl: string
    largeUrl: string
    player: string
    ogp: string
  }
  rating: {
    isAdult: boolean
  }
  registerdAt: string
  isPrivate: boolean
  isDeleted: boolean
  isNoBanner: boolean
  isAuthenticationRequired: boolean
  isEmbedPlayerAllowed: boolean
  viewer: null
  watchableUserTypeForPayment: string
  commentableUserTypeForPayment: string
  [key: string]: any
}

interface HeartBeatData {
  session: {
    content_type: string
    content_src_id_sets: {
      content_src_ids: {
        src_id_to_mux: {
          video_src_ids: string[]
          audio_src_ids: string[]
        }
      }[]
    }[]
    timing_constraint: string
    keep_method: {
      heartbeat: {
        lifetime: number
      }
    }
    recipe_id: string
    priority: number
    protocol: {
      name: string
      parameters: {
        http_parameters: {
          parameters: {
            http_output_download_parameters: {
              use_well_known_port: 'yes' | 'no'
              use_ssl: 'yes' | 'no'
              transfer_preset: string
            }
          }
        }
      }
    }
    content_uri: string
    session_operation_auth: {
      session_operation_auth_by_signature: {
        token: string
        signature: string
      }
    }
    content_id: string
    content_auth: {
      auth_type: string
      content_key_timeout: number
      service_id: string
      service_user_id: string
    }
    client_info: {
      player_id: string
    }
  }
}

interface NiconicoAPIResponceSession {
  session: HeartBeatData['session'] & {
    id: string
  }
}

type DownloadQuality = 'high' | 'middle' | 'low'

const niconicoRegexp = RegExp(
  // https://github.com/ytdl-org/youtube-dl/blob/a8035827177d6b59aca03bd717acb6a9bdd75ada/youtube_dl/extractor/niconico.py#L162
  'https?://(?:www\\.|secure\\.|sp\\.)?nicovideo\\.jp/watch/(?<id>(?:[a-z]{2})?[0-9]+)'
)

const headers = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': 'https://www.nicovideo.jp',
  Connection: 'keep-alive',
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.72 Safari/537.36 Edg/89.0.774.45',
  Accept: '*/*',
  'Accept-Encoding': 'gzip, deflate, br',
  Origin: 'https://www.nicovideo.jp',
  'Sec-Fetch-Site': 'cross-site',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
  Referer: 'https://www.nicovideo.jp/',
  'Accept-Language': 'ja,en;q=0.9,en-GB;q=0.8,en-US;q=0.7',
}

export function isValidURL(url: string) {
  return niconicoRegexp.test(url)
}

class NiconicoDL {
  private videoURL: string
  private data: NiconicoAPIData | undefined
  private heartBeat: Timeout | undefined
  private result: NiconicoAPIResponceSession | undefined
  private heartBeatBeforeTime: number = 0
  private quality: DownloadQuality

  constructor(url: string, quality: DownloadQuality = 'high') {
    if (!isValidURL(url)) {
      throw Error('Invalid url')
    }
    this.videoURL = url
    this.quality = quality
  }

  async getVideoInfo(): Promise<VideoInfo> {
    const videoSiteDom = parse(
      await (await fetch(this.videoURL, { headers })).text()
    )
    const matchResult = videoSiteDom
      .querySelectorAll('div')
      .filter((a) => a.rawAttributes.id === 'js-initial-watch-data')
    if (matchResult.length === 0) {
      throw Error('Failed get video site html...')
    }
    const patterns = {
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x60;': '`',
    }
    const fixedString = matchResult[0].rawAttributes['data-api-data'].replace(
      /&(lt|gt|amp|quot|#x27|#x60);/g,
      function (match) {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return patterns[match]
      }
    )
    this.data = JSON.parse(fixedString) as NiconicoAPIData
    return this.data.video
  }

  async prepareHeartBeat(): Promise<HeartBeatData> {
    if (!this.data) {
      await this.getVideoInfo()
    }
    const session = (this.data as NiconicoAPIData).media.delivery.movie.session
    let videoQualityNum = 0
    if (session.videos.length > 1) {
      if (this.quality === 'low') {
        videoQualityNum = session.videos.length - 1
      } else {
        session.videos.forEach((video, index) => {
          if (
            (video.includes('720') && this.quality === 'high') ||
            (video.includes('480') && this.quality === 'middle')
          ) {
            videoQualityNum = index
          }
        })
      }
    }
    return {
      session: {
        content_type: 'movie',
        content_src_id_sets: [
          {
            content_src_ids: [
              {
                src_id_to_mux: {
                  video_src_ids: [session.videos[videoQualityNum]],
                  audio_src_ids: [session.audios[0]],
                },
              },
            ],
          },
        ],
        timing_constraint: 'unlimited',
        keep_method: {
          heartbeat: {
            lifetime: session.heartbeatLifetime,
          },
        },
        recipe_id: session.recipeId,
        priority: session.priority,
        protocol: {
          name: 'http',
          parameters: {
            http_parameters: {
              parameters: {
                http_output_download_parameters: {
                  use_well_known_port: session.urls[0].isWellKnownPort
                    ? 'yes'
                    : 'no',
                  use_ssl: session.urls[0].isSsl ? 'yes' : 'no',
                  transfer_preset: '',
                },
              },
            },
          },
        },
        content_uri: '',
        session_operation_auth: {
          session_operation_auth_by_signature: {
            token: session.token,
            signature: session.signature,
          },
        },
        content_id: session.contentId,
        content_auth: {
          auth_type: session.authTypes.http,
          content_key_timeout: session.contentKeyTimeout,
          service_id: 'nicovideo',
          service_user_id: session.serviceUserId,
        },
        client_info: {
          player_id: session.playerId,
        },
      },
    }
  }

  async startHeartBeat(): Promise<void> {
    const heartBeatData = await this.prepareHeartBeat()
    this.result = (
      JSON.parse(
        await (
          await fetch('https://api.dmc.nico/api/sessions?_format=json', {
            method: 'POST',
            headers,
            body: JSON.stringify(heartBeatData),
          })
        ).text()
      ) as { data: NiconicoAPIResponceSession }
    ).data
    const session_id = this.result.session.id
    this.heartBeatBeforeTime = Math.floor(new Date().getTime() / 1000)
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.heartBeat = setInterval(async () => {
      const now = Math.floor(new Date().getTime() / 1000)
      if (now > this.heartBeatBeforeTime + 30) {
        const res = await fetch(
          `https://api.dmc.nico/api/sessions/${session_id}?_format=json&_method=PUT`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(this.result),
          }
        )
        if (res.status == 201 || res.status == 200) {
          this.result = (
            JSON.parse(await res.text()) as { data: NiconicoAPIResponceSession }
          ).data
        } else {
          throw Error
        }
        this.heartBeatBeforeTime = now
      }
    }, 1000)
  }

  async getDownloadLink(): Promise<string> {
    if (!this.heartBeat) {
      await this.startHeartBeat()
    }
    return (this.result as NiconicoAPIResponceSession).session.content_uri
  }

  async download(): Promise<NodeJS.ReadableStream> {
    const url = await this.getDownloadLink()
    const mp4Headers = Object.assign(headers, { 'Content-Type': 'video/mp4' })
    const res = await fetch(url.toString(), {
      headers: mp4Headers,
    })
    return res.body
  }

  stop(): void {
    if (this.heartBeat) {
      clearInterval(this.heartBeat)
    }
  }
}

export default NiconicoDL
