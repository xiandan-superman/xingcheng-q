<script setup lang="ts">
import { ref } from 'vue'
import BloubBot from '@/components/BloubBot.vue'
import type { Block } from '@/bot/cycles'
import { cycleVersGif, cycleVersMp4, svgAutonome, telecharge, versPng } from '@/ui/capture'
import { cycleImages, cyclePas, BLANC, type FormatCycle } from '@/ui/export'

const samples: { id: string; title: string; note: string; cycle: Block[] }[] = [
  { id: 'rest', title: '平静 · 日常陪伴', note: '低频视线漂移与原生眨眼', cycle: [{ state: 'idle', duration: 3 }] },
  { id: 'invite', title: '邀请 · 可以开始', note: '睁大眼睛 → 眨眼 → 回到安静陪伴', cycle: [{ state: 'wide', duration: 1.8 }, { state: 'wink', duration: 1.2 }, { state: 'idle', duration: 1.4 }] },
  { id: 'loading', title: '加载 · 正在处理', note: '球体连续形变为三点并形成脉冲', cycle: [{ state: 'thinking', duration: 2.6 }, { state: 'idle', duration: 1.2 }] },
  { id: 'submitting', title: '提交 · 发送信号', note: '播放形变 → 短暂停驻 → 复原', cycle: [{ state: 'play', duration: 2.1 }, { state: 'idle', duration: 1.4 }] },
  { id: 'correct', title: '正确 · 对准星轨', note: '单次眨眼确认并平滑回正', cycle: [{ state: 'wink', duration: 1.6 }, { state: 'idle', duration: 1.4 }] },
  {
    id: 'needs-review',
    title: '待复习 · 重新理解',
    note: '睁大眼睛 → 思考三点 → 回到安静陪伴',
    cycle: [
      { state: 'wide', duration: 1.2 },
      { state: 'thinking', duration: 2.6 },
      { state: 'idle', duration: 1.2 }
    ]
  },
  { id: 'attention', title: '注意 · 重要信息', note: '球体整体形变为原生警示符号并复原', cycle: [{ state: 'alert', duration: 2.4 }, { state: 'idle', duration: 1.4 }] },
  { id: 'empty', title: '空状态 · 安静等待', note: '收束成小点、保持呼吸后复原', cycle: [{ state: 'sleep', duration: 2.4 }, { state: 'idle', duration: 1.4 }] },
  { id: 'offline', title: '离线 · 信号较远', note: '彗星收束 → 思考确认 → 回到完整角色', cycle: [{ state: 'comet', duration: 2.4 }, { state: 'thinking', duration: 2.6 }, { state: 'idle', duration: 1.4 }] },
  { id: 'notification', title: '通知 · 收到消息', note: '原生通知凹口、圆点和反向目光', cycle: [{ state: 'notify', duration: 2.2 }, { state: 'idle', duration: 1.4 }] },
  { id: 'transition', title: '转场 · 进入下一站', note: '球体收束成彗星并完整返回', cycle: [{ state: 'comet', duration: 2.4 }, { state: 'idle', duration: 1.4 }] },
  {
    id: 'daily-complete',
    title: '每日完成 · 星能收束',
    note: '播放形变 → 三维轨道 → 爆散 → 完整圆球',
    cycle: [
      { state: 'play', duration: 2 },
      { state: 'orbit', duration: 3.4 },
      { state: 'burst', duration: 2.4 },
      { state: 'idle', duration: 1.6 }
    ]
  }
  ,{ id: 'milestone', title: '里程碑 · 连续达成', note: '三维轨道 → 爆散粒子 → 完整收束', cycle: [{ state: 'orbit', duration: 3.4 }, { state: 'burst', duration: 2.6 }, { state: 'idle', duration: 1.5 }] }
  ,{ id: 'waiting-access', title: '等待权限 · 保持陪伴', note: '安静视线漂移，不制造庆祝暗示', cycle: [{ state: 'idle', duration: 3.2 }] }
]

const emotions = [
  { id: 'calm', title: '平静', expression: 'neutre', phrase: '在呢' },
  { id: 'focus', title: '专注', expression: 'attentif', phrase: '让我想想' },
  { id: 'curious', title: '好奇', expression: 'curieux', phrase: '发现新星' },
  { id: 'happy', title: '开心', expression: 'heureux', phrase: '这题对了' },
  { id: 'excited', title: '兴奋', expression: 'excite', phrase: '出发！' },
  { id: 'laughing', title: '大笑', expression: 'hilare', phrase: '太棒了' },
  { id: 'proud', title: '自豪', expression: 'fier', phrase: '稳稳拿下' },
  { id: 'confused', title: '疑惑', expression: 'confus', phrase: '再看一遍' },
  { id: 'sad', title: '难过', expression: 'triste', phrase: '我陪着你' },
  { id: 'sleepy', title: '疲惫', expression: 'somnolent', phrase: '稍微休息' },
  { id: 'gentle-reminder', title: '温和提醒', expression: 'surpris', phrase: '该充星能了' }
]

const exporting = ref('')
const failed = ref('')

async function exportSample(sample: (typeof samples)[number], format: FormatCycle) {
  if (exporting.value) return
  exporting.value = `${sample.id}-${format}`
  failed.value = ''
  const duration = sample.cycle.reduce((total, block) => total + block.duration, 0)
  const settings = { shape: 'cercle', color: 'xingcheng', expression: 'neutre' }
  try {
    const blob = format === 'gif'
      ? await cycleVersGif(settings, sample.cycle, 320, cycleImages(duration, 'gif'), cyclePas('gif'), BLANC)
      : await cycleVersMp4(settings, sample.cycle, 512, cycleImages(duration, 'mp4'), cyclePas('mp4'), BLANC)
    telecharge(blob, `xingcheng-q-${sample.id}.${format}`)
  } catch {
    failed.value = `${sample.id}-${format}`
  } finally {
    exporting.value = ''
  }
}

async function exportEmotion(event: MouseEvent, emotion: (typeof emotions)[number], format: 'png' | 'svg') {
  if (exporting.value) return
  exporting.value = `${emotion.id}-${format}`
  failed.value = ''
  try {
    const card = (event.currentTarget as HTMLElement).closest('.emotion-study')
    const svg = card?.querySelector('svg') as SVGSVGElement | null
    if (!svg) throw new Error('svg unavailable')
    const markup = svgAutonome(svg, 1024)
    const blob = format === 'png'
      ? await versPng(markup, 1024)
      : new Blob([markup], { type: 'image/svg+xml' })
    telecharge(blob, `xingcheng-q-emotion-${emotion.id}.${format}`)
  } catch {
    failed.value = `${emotion.id}-${format}`
  } finally {
    exporting.value = ''
  }
}
</script>

<template>
  <main class="role-board">
    <header class="role-board__header">
      <a href="#">返回播放器</a>
      <p>STAR ORANGE Q · MOTION STUDIES</p>
      <h1>星橙Q<br><span>角色状态扩展</span></h1>
      <div class="role-board__rule">只使用原 Bloub 引擎的连续形变、眼神、遮挡和缓动</div>
    </header>

    <section class="role-board__grid">
      <article v-for="sample in samples" :key="sample.id" class="role-study">
        <div class="role-study__stage">
          <BloubBot
            :cycle="sample.cycle"
            :size="430"
            color="xingcheng"
            shape="cercle"
            expression="neutre"
            :playing="false"
            :frozen-at="1"
            paper="#fff8ee"
          />
        </div>
        <div class="role-study__copy">
          <span>{{ sample.id }}</span>
          <h2>{{ sample.title }}</h2>
          <p>{{ sample.note }}</p>
          <div class="role-study__actions">
            <button type="button" :disabled="Boolean(exporting)" @click="exportSample(sample, 'gif')">
              {{ exporting === `${sample.id}-gif` ? '正在导出…' : '导出 GIF' }}
            </button>
            <button type="button" :disabled="Boolean(exporting)" @click="exportSample(sample, 'mp4')">
              {{ exporting === `${sample.id}-mp4` ? '正在导出…' : '导出 MP4' }}
            </button>
          </div>
          <p v-if="failed.startsWith(sample.id)" class="role-study__error">导出失败，请重试</p>
        </div>
      </article>
    </section>

    <section class="emotion-board">
      <div class="emotion-board__heading">
        <p>FOUNDATION EXPRESSIONS</p>
        <h2>十一个基础情绪</h2>
        <span>全部直接取自原引擎的眼神与头部姿态系统</span>
      </div>
      <div class="emotion-board__grid">
        <article v-for="emotion in emotions" :key="emotion.id" class="emotion-study">
          <div class="emotion-study__stage">
            <BloubBot
              :size="300"
              color="xingcheng"
              shape="cercle"
              :expression="emotion.expression"
              :frozen-at="1"
              paper="#fff8ee"
            />
          </div>
          <div class="emotion-study__copy">
            <span>{{ emotion.id }}</span>
            <h3>{{ emotion.title }}</h3>
            <p>{{ emotion.phrase }}</p>
            <div class="role-study__actions">
              <button type="button" :disabled="Boolean(exporting)" @click="exportEmotion($event, emotion, 'png')">导出 PNG</button>
              <button type="button" :disabled="Boolean(exporting)" @click="exportEmotion($event, emotion, 'svg')">导出 SVG</button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.role-board{min-height:100dvh;background:#fff8ee;color:#17191f;padding:42px 54px 72px;font-family:Inter,"PingFang SC",sans-serif}
.role-board__header{max-width:1320px;margin:0 auto 34px;position:relative}
.role-board__header>a{font-size:12px;color:#746f67;text-decoration:underline;text-underline-offset:3px}
.role-board__header>p{margin-top:42px;font-size:12px;letter-spacing:.18em;color:#ff6a1a;font-weight:700}
.role-board__header h1{font-size:clamp(54px,6vw,92px);line-height:.92;letter-spacing:-.065em;margin:14px 0 22px;font-weight:760}
.role-board__header h1 span{color:#ff6a1a}
.role-board__rule{display:inline-flex;border:1px solid #d9d0c5;border-radius:999px;padding:9px 15px;color:#625e58;font-size:13px;background:rgba(255,255,255,.55)}
.role-board__grid{max-width:1320px;margin:0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.role-study{border:1px solid #d9d0c5;border-radius:30px;overflow:hidden;background:rgba(255,255,255,.52);box-shadow:0 24px 65px rgba(74,41,13,.06)}
.role-study__stage{aspect-ratio:1;display:flex;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(circle at 50% 48%,#fffdf8 0,#fff8ee 66%,#f6ebdd 100%)}
.role-study__copy{border-top:1px solid #ded6cc;padding:22px 24px 26px;min-height:158px}
.role-study__copy span{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#ff6a1a;font-weight:750}
.role-study__copy h2{font-size:24px;letter-spacing:-.03em;margin:7px 0 8px}
.role-study__copy p{font-size:13px;line-height:1.65;color:#6d675f;margin:0}
.role-study__actions{display:flex;gap:8px;margin-top:18px}
.role-study__actions button{border:1px solid #d1c8bc;border-radius:999px;padding:8px 13px;background:#fffaf4;color:#17191f;font-size:12px;cursor:pointer;transition:transform .18s ease,border-color .18s ease}
.role-study__actions button:hover{transform:translateY(-1px);border-color:#ff6a1a}
.role-study__actions button:disabled{cursor:wait;opacity:.55}
.role-study__error{margin-top:8px!important;color:#c34122!important}
.emotion-board{max-width:1320px;margin:76px auto 0;border-top:1px solid #d9d0c5;padding-top:42px}
.emotion-board__heading p{font-size:11px;letter-spacing:.18em;color:#ff6a1a;font-weight:750;margin:0 0 8px}.emotion-board__heading h2{font-size:46px;letter-spacing:-.05em;margin:0}.emotion-board__heading span{display:block;color:#6d675f;margin-top:8px;font-size:13px}
.emotion-board__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:24px}.emotion-study{border:1px solid #d9d0c5;border-radius:24px;overflow:hidden;background:rgba(255,255,255,.52)}.emotion-study__stage{aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 48%,#fffdf8 0,#fff8ee 68%,#f6ebdd 100%)}.emotion-study__copy{padding:17px 18px 20px;border-top:1px solid #ded6cc}.emotion-study__copy>span{font-size:10px;letter-spacing:.14em;color:#ff6a1a;text-transform:uppercase;font-weight:750}.emotion-study__copy h3{font-size:20px;margin:5px 0 3px}.emotion-study__copy p{font-size:13px;color:#6d675f;margin:0}
@media(max-width:900px){.role-board{padding:24px 18px 48px}.role-board__grid{grid-template-columns:1fr}.role-study__stage{max-height:420px}}
</style>
