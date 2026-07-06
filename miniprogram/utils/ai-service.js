/**
 * AI 服务接口
 * 当前使用本地 Mock 匹配，后续可替换为真实 AI API
 *
 * 替换方式：将 callAI 函数改为调用真实 API 即可
 * 示例：
 *   const res = await wx.request({
 *     url: 'https://your-ai-api.com/chat',
 *     method: 'POST',
 *     data: { messages: [...], query: userMessage }
 *   })
 *   return res.data.reply
 */

const { getAIReply } = require('../mock/ai-replies')

/**
 * 调用 AI 获取回复
 * @param {string} userMessage - 用户问题
 * @param {Array} context - 上下文消息历史
 * @returns {Promise<{text: string, delay: number}>}
 */
async function callAI(userMessage, context = []) {
  // TODO: 替换为真实 AI API 调用
  // 当前使用 Mock 匹配
  return getAIReply(userMessage)
}

/**
 * 语音识别（使用微信同声传译插件或云开发能力）
 * 当前使用 wx.getRecorderManager 录制，后续可对接语音识别 API
 */
function startVoiceRecognition() {
  return new Promise((resolve, reject) => {
    const recorderManager = wx.getRecorderManager()

    recorderManager.onStart(() => {
      console.log('开始录音')
    })

    recorderManager.onStop((res) => {
      const { tempFilePath } = res
      if (!tempFilePath) {
        reject(new Error('录音失败'))
        return
      }
      // TODO: 将 tempFilePath 上传到语音识别服务
      // 示例：wx.uploadFile({ url: 'asr-api', filePath: tempFilePath })
      // 当前返回提示
      resolve('语音识别功能需要对接语音识别 API（如腾讯云 ASR）')
    })

    recorderManager.onError((err) => {
      reject(err)
    })

    // 开始录音
    recorderManager.start({
      duration: 60000, // 最长 60 秒
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3'
    })

    // 2 秒后自动停止（演示用，实际应改为长按结束）
    setTimeout(() => {
      recorderManager.stop()
    }, 2000)
  })
}

module.exports = {
  callAI,
  startVoiceRecognition
}