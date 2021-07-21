# Release Note

## 1.1.3 - Fix miss
  - Removed debug log which I forgot to remove.

## 1.1.2 - Fix miss
  -  Fix issue which is stop heartbeat automatically option wasn't optional.

## 1.1.1 - Fix publish miss
  - Sorry, the following features weren't included in the previous version...
    - Included in the video information that the owner information of video.
  - Prevented from publication of mistake build files(add "prepare" script to package.json).
  - Stop heartbeat automatically(you can select the option not to stop heartbeat automatically).

## 1.1.0 - Selectable stream format(old or new) and gettable video owner info
  - This library is using "node-fetch" library.
    The "node-fetch" library's response body return "NodeJS.ReadableStream"(old format stream).
    However, current major readable stream format is "internal.Readable"(new format stream).
    Therefore, you have made it possible to select the stream format(by wrap function in the "internal.Readable").
  - It is now included in the video information that the owner information of video.
  - Removed debug log which I forgot to remove.

## 1.0.1 - Selectable video and audio quality
  - If you want to use in the streaming(ex. discord bot in voice channels),
    you can choose low quality video/audio. This allows low latency streaming.
  - Removed codes which don't need.

## 1.0.0 - First Release
  - You can download niconico video on node js.
  - This library is very simple and very lightweight.
    - Dependencies are only 2 libraries(node-fetch and node-html-parser).
    - Only about less 500 lines of code(only main code, exclude test and example).
