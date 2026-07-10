function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inlineMarkdown(value) {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

function renderMarkdown(source) {
  const lines = String(source || '').split(/\r?\n/)
  const output = []
  const paragraphStyle = 'margin:0 0 10rpx;'
  const listStyle = 'margin:6rpx 0 10rpx;padding-left:34rpx;'
  const listItemStyle = 'margin-bottom:7rpx;'
  let listType = ''

  const closeList = () => {
    if (listType) output.push('</' + listType + '>')
    listType = ''
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim()
    const ordered = line.match(/^\d+[.、]\s*(.+)$/)
    const bullet = line.match(/^[-*]\s+(.+)$/)
    const heading = line.match(/^#{1,3}\s+(.+)$/)

    if (ordered || bullet) {
      const nextType = ordered ? 'ol' : 'ul'
      if (listType !== nextType) {
        closeList()
        listType = nextType
        output.push('<' + listType + ' style="' + listStyle + '">')
      }
      output.push('<li style="' + listItemStyle + '">' + inlineMarkdown((ordered || bullet)[1]) + '</li>')
      return
    }

    closeList()
    if (!line) output.push('<br/>')
    else if (heading) output.push('<p style="' + paragraphStyle + '"><strong>' + inlineMarkdown(heading[1]) + '</strong></p>')
    else output.push('<p style="' + paragraphStyle + '">' + inlineMarkdown(line) + '</p>')
  })
  closeList()
  return output.join('')
}

Component({
  properties: {
    message: {
      type: String,
      value: ''
    },
    isUser: {
      type: Boolean,
      value: false
    },
    showAvatar: {
      type: Boolean,
      value: true
    },
    avatarUrl: {
      type: String,
      value: '/images/ai-chef-v2.png'
    }
  },
  data: { renderedMessage: '' },
  observers: {
    'message, isUser': function(message, isUser) {
      this.setData({ renderedMessage: isUser ? renderMarkdown(String(message || '').replace(/[*#]/g, '')) : renderMarkdown(message) })
    }
  }
})
