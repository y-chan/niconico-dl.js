# Release Note

## 1.1.0 - Selectable stream format(old or new) and gettable video owner info
  - This library is using "node-fetch" library.
    The "node-fetch" library's response body return "NodeJS.ReadableStream"(old format stream).
    However, current major readable stream format is "internal.Readable"(new format stream).
    Therefore, you have made it possible to select the stream format(by wrap function in the "internal.Readable")
  - It is now included in the video information that the owner information of video.
  - Removed debug log which I forgot to remove

## 1.0.1 - Selectable video and audio quality
  - If you want to use in the streaming(ex. discord bot in voice channels),
    you can choose low quality video/audio. This allows low latency streaming.
  - Removed codes which don't need.

## 1.0.0 - First Release
  - We can download niconico video on node js.
  - This library is very simple and very lightweight.
    - Dependencies are only 2 libraries.(node-fetch and node-html-parser)
    - Only about less 500 lines of code(only main code, exclude test and example)
