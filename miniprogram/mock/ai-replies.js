/**
 * 数字人 Mock 回复规则
 * 根据用户输入关键词匹配回复
 */

const replyRules = [
  {
    keywords: ['不粘', '粘锅', '粘'],
    reply: '不粘锅的秘诀来啦！主要有3点：\n1. 锅要烧热再倒油，油温七成热\n2. 食材表面水分要擦干\n3. 翻炒时用锅铲推而不是用力搅\n\n试试看，一定不会粘！'
  },
  {
    keywords: ['炒出汁', '出汁', '番茄汁', '多汁'],
    reply: '教你一个小技巧：\n🍅 番茄先在顶部划十字，用开水烫30秒后去皮\n🍳 切小块，更容易出汁\n🔥 中火慢炒，用锅铲按压帮助出汁\n✨ 加一点点糖可以提鲜哦！'
  },
  {
    keywords: ['嫩', '老', '口感', '柴'],
    reply: '让肉质变嫩的方法：\n🥩 切法要对：牛肉逆纹切，猪肉顺纹切\n🥛 腌制时加一点淀粉或小苏打\n⏰ 炒制时间不要太长\n🔥 大火快炒，锁住水分'
  },
  {
    keywords: ['咸', '太咸', '淡', '没味道', '调味'],
    reply: '调味小窍门：\n🧂 咸了：加一点糖或醋可以中和咸味\n💧 淡了：可以加少许生抽提味\n💡 炒菜时盐要最后放，这样味道更均匀\n❄️ 高汤代替水可以让菜品更有味道'
  },
  {
    keywords: ['火候', '大火', '小火', '中火'],
    reply: '火候掌握口诀：\n🔥 大火：适合快炒、爆炒、收汁，保持食材脆嫩\n⏳ 小火：适合炖煮、熬汤、炒糖色，慢慢入味\n🌡️ 中火：适合煎制、日常炒菜\n\n记住：热锅凉油不粘锅！'
  },
  {
    keywords: ['减肥', '减脂', '低卡', '热量', '健康'],
    reply: '健康烹饪建议：\n🥗 多用蒸、煮、炖的方式，少油少盐\n🥦 多吃蔬菜和优质蛋白\n🍚 主食可以用粗粮代替白米饭\n🍳 少吃油炸食品，清蒸和水煮是最好的\n\n推荐你试试蒜蓉西兰花和清蒸鲈鱼，低卡又美味！'
  },
  {
    keywords: ['刀工', '切', '切丝', '切块', '切丁'],
    reply: '切菜小技巧：\n🔪 切丝：先切片再切丝，食材要稳定不滑动\n🧅 切洋葱不流泪：洋葱放冰箱冷藏10分钟再切\n🥔 切土豆丝：切好后泡水去淀粉，炒出来才脆\n🔪 切肉：肉微冻状态最好切，可以先放冰箱冻20分钟'
  },
  {
    keywords: ['保存', '储存', '保鲜', '放多久'],
    reply: '食材保鲜小知识：\n🥬 绿叶菜：用厨房纸包裹，放保鲜袋冷藏，3-5天\n🥚 鸡蛋：大头朝上放，冷藏可保存3-4周\n🥩 生肉：分装小份冷冻，一个月内用完\n🍄 蘑菇：用纸袋装，不要用塑料袋，冷藏5-7天'
  }
]

// 默认回复（无关键词匹配时使用）
const defaultReplies = [
  '这个问题很好！你可以试着摇一摇，看看今天适合做什么菜~ 如果有具体做菜的问题，随时问我哦！',
  '嗯，让我想想... 你可以告诉我想做什么菜，我可以给你详细的步骤指导！',
  '我虽然是 Mock 模式，但基本的做菜问题都可以回答哦~ 试试问我关于火候、调味、食材处理的问题吧！'
]

/**
 * 根据用户消息获取 AI 回复
 */
function getAIReply(userMessage) {
  // 遍历关键词规则
  for (const rule of replyRules) {
    for (const keyword of rule.keywords) {
      if (userMessage.includes(keyword)) {
        // 模拟打字延迟
        return {
          text: rule.reply,
          delay: 800 + Math.random() * 1200
        }
      }
    }
  }

  // 如果匹配到菜品名，返回做菜步骤
  const dishes = require('./dishes').dishes
  const dish = dishes.find(d => userMessage.includes(d.name))
  if (dish) {
    let stepsText = `【${dish.name}】的做法：\n\n`
    dish.steps.forEach((step, i) => {
      stepsText += `${i + 1}. ${step.title}（${step.time}分钟）\n   ${step.desc}\n\n`
    })
    stepsText += `💡 小贴士：${dish.tips}`
    return { text: stepsText, delay: 1000 }
  }

  // 默认回复
  const defaultReply = defaultReplies[Math.floor(Math.random() * defaultReplies.length)]
  return { text: defaultReply, delay: 600 + Math.random() * 800 }
}

module.exports = { replyRules, defaultReplies, getAIReply }
