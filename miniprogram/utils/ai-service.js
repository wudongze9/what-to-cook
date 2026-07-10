/**
 * AI 服务接口
 * 1. callAI - 调用后端 Ollama 对话
 * 2. startVoiceRecognition / stopVoiceRecognition - 语音识别（微信官方 WechatSI 插件，中文 ASR）
 * 3. playTTS - 文本转语音播报（调用后端 edge-tts）
 */

const { getAIReply } = require('../mock/ai-replies')
const runtime = require('../config/env')

const BASE_URL = runtime.API_BASE_URL
const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '')

/**
 * 调用 AI 获取回复（通过后端 Ollama）
 */
async function callAI(userMessage, context = []) {
  try {
    const res = await new Promise((resolve, reject) => {
      wx.request({
        url: BASE_URL + '/chat',
        method: 'POST',
        data: { message: userMessage, context },
        header: { 'Content-Type': 'application/json' },
        timeout: runtime.STREAM_TIMEOUT,
        success: (r) => {
          if (r.statusCode === 200 && r.data && r.data.reply) {
            resolve(r.data.reply)
          } else {
            reject(r)
          }
        },
        fail: reject
      })
    })
    return { text: res, delay: 200 }
  } catch (err) {
    console.warn('[callAI] 后端调用失败，降级到本地 mock', err)
    return getAIReply(userMessage)
  }
}

// ==================== 语音识别（微信 WechatSI 插件）====================

let _recognizer = null
let _isRecognizing = false
let _callbacks = null

function _getRecognizer() {
  if (!_recognizer) {
    let plugin = null
    try {
      plugin = requirePlugin('WechatSI')
      _recognizer = plugin.getRecordRecognitionManager()
    } catch (err) {
      console.warn('[ASR] WechatSI plugin unavailable, voice input falls back to typing.')
      return null
    }

    _recognizer.onRecognize = (res) => {
      // 识别过程中的中间结果
      if (_callbacks && _callbacks.onRecognize && res && res.result) {
        _callbacks.onRecognize(res.result)
      }
    }

    _recognizer.onStop = (res) => {
      _isRecognizing = false
      const text = (res && res.result) ? res.result : ''
      if (_callbacks && _callbacks.onStop) {
        _callbacks.onStop(text)
      }
      _callbacks = null
    }

    _recognizer.onStart = () => {
      _isRecognizing = true
    }

    _recognizer.onError = (err) => {
      _isRecognizing = false
      console.error('[ASR] 识别错误', err)
      if (_callbacks && _callbacks.onError) {
        _callbacks.onError(err)
      }
      _callbacks = null
    }
  }
  return _recognizer
}

/**
 * 开始语音识别（点击触发，非长按）
 * @param {object} callbacks - { onRecognize, onStop, onError }
 *   onRecognize(text) - 中间识别结果（实时显示）
 *   onStop(text) - 最终识别结果
 *   onError(err) - 错误
 */
function startVoiceRecognition(callbacks = {}) {
  const mgr = _getRecognizer()
  if (!mgr) {
    if (callbacks.onError) {
      callbacks.onError({ message: 'WechatSI plugin unavailable' })
    }
    return
  }
  _callbacks = callbacks
  try {
    mgr.start({ lang: 'zh_CN', duration: 60000 })
  } catch (err) {
    _isRecognizing = false
    _callbacks = null
    if (callbacks.onError) {
      callbacks.onError(err)
    }
  }
}

/**
 * 停止语音识别（再次点击触发，会触发 onStop 回调）
 */
function stopVoiceRecognition() {
  if (_isRecognizing && _recognizer) {
    try {
      _recognizer.stop()
    } catch (err) {
      _isRecognizing = false
      if (_callbacks && _callbacks.onError) {
        _callbacks.onError(err)
      }
      _callbacks = null
    }
  }
}

function isRecognizing() {
  return _isRecognizing
}

// ==================== TTS 语音播报 ====================

let _ttsAudio = null

function _resolveAudioUrl(data) {
  if (!data) return ''
  if (data.url && /^https?:\/\//.test(data.url)) return data.url
  if (data.url) return API_ORIGIN + data.url
  if (data.filename) return BASE_URL + '/chat/tts-file/' + encodeURIComponent(data.filename)
  return ''
}

/**
 * 播报文本（TTS）
 * @param {string} text - 要播报的文本
 * @param {object} callbacks - { onPlay, onEnded, onError }
 */
function playTTS(text, callbacks = {}) {
  if (!text || !text.trim()) return

  // 停止上一次播放
  stopTTS()

  // 先请求后端合成
  wx.request({
    url: BASE_URL + '/chat/tts',
    method: 'POST',
    data: { text },
    header: { 'Content-Type': 'application/json' },
    timeout: 60000,
    success: (res) => {
      if (res.statusCode === 200 && res.data && res.data.success) {
        const url = _resolveAudioUrl(res.data)
        if (!url) {
          if (callbacks.onError) callbacks.onError({ message: 'empty audio url' })
          return
        }
        _ttsAudio = wx.createInnerAudioContext()
        _ttsAudio.src = url
        _ttsAudio.autoplay = true
        if (callbacks.onPlay) _ttsAudio.onPlay(callbacks.onPlay)
        _ttsAudio.onEnded(() => {
          const done = callbacks.onEnded
          stopTTS()
          if (done) done()
        })
        _ttsAudio.onError((err) => {
          const fail = callbacks.onError
          stopTTS()
          if (fail) fail(err)
        })
      } else {
        console.warn('[TTS] 合成失败', res.data)
        if (callbacks.onError) callbacks.onError(res.data)
      }
    },
    fail: (err) => {
      console.warn('[TTS] 请求失败', err)
      if (callbacks.onError) callbacks.onError(err)
    }
  })
}

/**
 * 停止 TTS 播报
 */
function stopTTS() {
  if (_ttsAudio) {
    try {
      _ttsAudio.stop()
      _ttsAudio.destroy()
    } catch (err) {
      console.warn('[TTS] audio cleanup skipped', err)
    }
    _ttsAudio = null
  }
}

function isTTSPlaying() {
  return _ttsAudio !== null
}

module.exports = {
  callAI,
  startVoiceRecognition,
  stopVoiceRecognition,
  isRecognizing,
  playTTS,
  stopTTS,
  isTTSPlaying
}
