/**
 * AI 服务接口
 * 1. callAI - 调用后端 Ollama 对话
 * 2. startVoiceRecording / stopVoiceRecording - 长按录音（暂未接入 ASR，保留架构）
 * 3. playTTS - 文本转语音播报（调用后端 edge-tts）
 */

const { getAIReply } = require('../mock/ai-replies')

const BASE_URL = 'http://localhost:8001/api'

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
        timeout: 120000,
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

// ==================== 语音录音（长按模式）====================

let _recorderManager = null
let _isRecording = false

function _getRecorder() {
  if (!_recorderManager) {
    _recorderManager = wx.getRecorderManager()
    _recorderManager.onError((err) => {
      console.error('录音错误', err)
      _isRecording = false
    })
  }
  return _recorderManager
}

/**
 * 开始录音（长按触发）
 */
function startVoiceRecording(onStop) {
  const recorder = _getRecorder()
  _isRecording = true

  recorder.onStop((res) => {
    _isRecording = false
    if (onStop && typeof onStop === 'function') {
      onStop(res)
    }
  })

  recorder.start({
    duration: 60000,
    sampleRate: 16000,
    numberOfChannels: 1,
    encodeBitRate: 48000,
    format: 'mp3'
  })
}

/**
 * 停止录音（松开触发）
 */
function stopVoiceRecording() {
  if (_isRecording && _recorderManager) {
    _recorderManager.stop()
  }
}

function isRecording() {
  return _isRecording
}

// ==================== TTS 语音播报 ====================

let _ttsAudio = null

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
        const url = BASE_URL + res.data.url
        _ttsAudio = wx.createInnerAudioContext()
        _ttsAudio.src = url
        _ttsAudio.autoplay = true
        if (callbacks.onPlay) _ttsAudio.onPlay(callbacks.onPlay)
        if (callbacks.onEnded) _ttsAudio.onEnded(callbacks.onEnded)
        if (callbacks.onError) _ttsAudio.onError(callbacks.onError)
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
    _ttsAudio.stop()
    _ttsAudio.destroy()
    _ttsAudio = null
  }
}

function isTTSPlaying() {
  return _ttsAudio !== null
}

module.exports = {
  callAI,
  startVoiceRecording,
  stopVoiceRecording,
  isRecording,
  playTTS,
  stopTTS,
  isTTSPlaying
}
