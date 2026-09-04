from __future__ import annotations

import hashlib
import json
import math
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path('/Users/ljj/Documents/ChatGPT/量子星橙')
SRC = ROOT / '.playwright-cli'
PACK = ROOT / '小程序/量子星橙-开工包/04-设计/星橙Q-角色资产包-V2'
FONT = '/System/Library/Fonts/STHeiti Medium.ttc'
FONT_LIGHT = '/System/Library/Fonts/STHeiti Light.ttc'
CREAM = '#FFF8EE'
INK = '#17191F'
MUTED = '#716A62'
ORANGE = '#FF6A1A'

SEMANTICS = [
    'rest', 'invite', 'loading', 'submitting', 'correct', 'needs-review',
    'attention', 'empty', 'offline', 'notification', 'transition',
    'daily-complete', 'milestone', 'waiting-access'
]
EMOTIONS = [
    ('calm', '平静', '在呢'), ('focus', '专注', '让我想想'),
    ('curious', '好奇', '发现新星'), ('happy', '开心', '这题对了'),
    ('excited', '兴奋', '出发！'), ('laughing', '大笑', '太棒了'),
    ('proud', '自豪', '稳稳拿下'), ('confused', '疑惑', '再看一遍'),
    ('sad', '难过', '我陪着你'),
    ('sleepy', '疲惫', '稍微休息'), ('gentle-reminder', '温和提醒', '该充星能了')
]
PEAK = {
    'rest': .38, 'invite': .24, 'loading': .35, 'submitting': .34,
    'correct': .25, 'needs-review': .46, 'attention': .28, 'empty': .34,
    'offline': .30, 'notification': .30, 'transition': .28,
    'daily-complete': .62, 'milestone': .55, 'waiting-access': .40,
}
SEMANTIC_TITLES = {
    'rest':'平静陪伴','invite':'邀请开始','loading':'正在处理','submitting':'提交答案',
    'correct':'回答正确','needs-review':'待复习','attention':'重要提示','empty':'暂无内容',
    'offline':'网络离线','notification':'收到消息','transition':'页面转场',
    'daily-complete':'今日完成','milestone':'阶段达成','waiting-access':'等待授权'
}

def font(size: int, light=False):
    return ImageFont.truetype(FONT_LIGHT if light else FONT, size)

def ensure_dirs():
    for p in [
        'assets/semantic/gif', 'assets/semantic/mp4', 'assets/semantic/static',
        'assets/emotions/png', 'assets/emotions/svg', 'assets/standard',
        'assets/stickers', 'assets/share-cards', 'assets/posters',
        'assets/scene-actions', 'assets/core-motion', 'assets/guidelines', 'docs'
    ]:
        (PACK / p).mkdir(parents=True, exist_ok=True)

def copy_engine_assets():
    for sid in SEMANTICS:
        for ext in ('gif', 'mp4'):
            src = SRC / f'xingcheng-q-{sid}.{ext}'
            if not src.exists():
                raise FileNotFoundError(src)
            shutil.copy2(src, PACK / f'assets/semantic/{ext}/xingcheng-q-{sid}.{ext}')
    for eid, _, _ in EMOTIONS:
        for ext in ('png', 'svg'):
            src = SRC / f'xingcheng-q-emotion-{eid}.{ext}'
            if not src.exists():
                raise FileNotFoundError(src)
            shutil.copy2(src, PACK / f'assets/emotions/{ext}/xingcheng-q-emotion-{eid}.{ext}')

def rgba(path: Path):
    return Image.open(path).convert('RGBA')

def fit(im: Image.Image, box: tuple[int, int]):
    out = im.copy()
    out.thumbnail(box, Image.Resampling.LANCZOS)
    return out

def place(canvas: Image.Image, im: Image.Image, xy: tuple[int, int]):
    canvas.alpha_composite(im, xy)

def gradient_disc(size: int):
    im = Image.new('RGBA', (size, size))
    px = im.load()
    stops = [(0.0, (255,154,34)), (.52, (255,106,26)), (1.0, (240,68,36))]
    for y in range(size):
        for x in range(size):
            t = max(0, min(1, (x + y*.45) / (size*1.45)))
            a,b = stops[0],stops[1]
            if t > .52: a,b=stops[1],stops[2]
            u=(t-a[0])/(b[0]-a[0])
            c=tuple(round(a[1][i]*(1-u)+b[1][i]*u) for i in range(3))
            alpha = 255 if (x-size/2)**2+(y-size/2)**2 <= (size/2-1)**2 else 0
            px[x,y]=(*c,alpha)
    return im

def extract_peaks():
    for sid in SEMANTICS:
        im = Image.open(PACK / f'assets/semantic/gif/xingcheng-q-{sid}.gif')
        n = getattr(im, 'n_frames', 1)
        im.seek(min(n-1, round((n-1)*PEAK[sid])))
        frame = im.convert('RGBA')
        frame.save(PACK / f'assets/semantic/static/xingcheng-q-{sid}.png')
        frame.convert('RGB').save(PACK / f'assets/semantic/static/xingcheng-q-{sid}.webp', 'WEBP', quality=92, method=6)

def semantic_overview():
    w,h=1600,1800
    c=Image.new('RGBA',(w,h),CREAM); d=ImageDraw.Draw(c)
    d.text((60,50),'星橙Q · 14 个产品语义状态',font=font(48),fill=INK)
    d.text((62,116),'所有画面取自 Bloub 引擎关键帧',font=font(22,True),fill=MUTED)
    for i,sid in enumerate(SEMANTICS):
        col,row=i%4,i//4; x=45+col*390; y=180+row*400
        d.rounded_rectangle((x,y,x+365,y+365),30,fill='#FFFDF8',outline='#DED2C5',width=2)
        role=fit(rgba(PACK/f'assets/semantic/static/xingcheng-q-{sid}.png'),(270,270))
        place(c,role,(x+(365-role.width)//2,y+20))
        d.text((x+24,y+298),SEMANTIC_TITLES[sid],font=font(25),fill=INK)
        d.text((x+24,y+337),sid,font=font(15,True),fill=ORANGE)
    c.convert('RGB').save(PACK/'01-原引擎14状态板.jpg',quality=95)

def standard_assets():
    calm = rgba(PACK / 'assets/emotions/png/xingcheng-q-emotion-calm.png')
    small = rgba(SRC / 'xingcheng-q-avatar-small.png')
    for n in (32, 64, 128, 256, 512, 1024):
        source = small if n <= 128 else calm
        fit(source, (n,n)).save(PACK / f'assets/standard/xingcheng-q-avatar-{n}.png')
    base = Image.new('RGBA', (1024,1024), CREAM)
    place(base, calm, (0,0))
    base.convert('RGB').save(PACK / 'assets/standard/xingcheng-q-avatar-cream.jpg', quality=95)
    shutil.copy2(PACK / 'assets/emotions/svg/xingcheng-q-emotion-calm.svg', PACK / 'assets/standard/xingcheng-q-avatar.svg')

def sticker_pack():
    contact = Image.new('RGB', (1340, 1340), CREAM)
    for i,(eid,title,phrase) in enumerate(EMOTIONS):
        c = Image.new('RGBA', (640,640), CREAM)
        d = ImageDraw.Draw(c)
        d.rounded_rectangle((12,12,628,628), 54, fill='#FFFDF8', outline='#E2D8CB', width=2)
        role=fit(rgba(PACK/f'assets/emotions/png/xingcheng-q-emotion-{eid}.png'), (425,425))
        place(c,role,((640-role.width)//2,38))
        bbox=d.textbbox((0,0),phrase,font=font(56))
        d.text(((640-(bbox[2]-bbox[0]))/2,493),phrase,font=font(56),fill=INK)
        d.text((320,575),f'{title} · STAR ORANGE Q',font=font(16,True),fill=MUTED,anchor='mm')
        c.convert('RGB').save(PACK/f'assets/stickers/xingcheng-q-sticker-{eid}.png',quality=96)
        thumb=fit(c,(620,620)).convert('RGB')
        x=20+(i%2)*660; y=20+(i//2)*330
        thumb.thumbnail((310,310),Image.Resampling.LANCZOS)
        contact.paste(thumb,(x,y))
        contact.paste(thumb,(x+320,y)) if False else None
    # grille de quatre colonnes, dimensionnee selon le catalogue
    rows=math.ceil(len(EMOTIONS)/4)
    contact=Image.new('RGB',(1320,20+rows*325),CREAM)
    for i,(eid,_,_) in enumerate(EMOTIONS):
        s=Image.open(PACK/f'assets/stickers/xingcheng-q-sticker-{eid}.png').convert('RGB').resize((310,310),Image.Resampling.LANCZOS)
        contact.paste(s,(20+(i%4)*325,20+(i//4)*325))
    contact.save(PACK/'assets/stickers/00-十一情绪表情包总览.jpg',quality=94)

def action_frame(base: Image.Image, kind: str, phase: float):
    S=2; c=Image.new('RGBA',(640*S,640*S),CREAM); d=ImageDraw.Draw(c)
    role=fit(base,(430*S,430*S)); place(c,role,((640*S-role.width)//2,66*S))
    hand=gradient_disc(74*S)
    if kind=='write':
        bob=math.sin(phase*math.tau)*7*S
        place(c,hand,(428*S,int(390*S+bob)))
        place(c,fit(hand,(58*S,58*S)),(177*S,405*S))
        x,y=471*S,int((409)*S+bob)
        angle=-24+math.sin(phase*math.tau)*5
        pen=Image.new('RGBA',(42*S,170*S)); pd=ImageDraw.Draw(pen)
        pd.rounded_rectangle((11*S,5*S,31*S,145*S),10*S,fill=INK)
        pd.polygon([(11*S,145*S),(31*S,145*S),(21*S,166*S)],fill=ORANGE)
        pen=pen.rotate(angle,resample=Image.Resampling.BICUBIC,expand=True)
        place(c,pen,(x-pen.width//2,y-pen.height//2))
        d.line((185*S,510*S,(390+phase*62)*S,510*S),fill='#D4C6B8',width=4*S)
    elif kind=='wave':
        a=-38+math.sin(phase*math.tau)*22
        arm=Image.new('RGBA',(170*S,170*S))
        place(arm,hand,(45*S,18*S)); place(arm,fit(hand,(58*S,58*S)),(28*S,83*S))
        arm=arm.rotate(a,resample=Image.Resampling.BICUBIC,expand=True)
        place(c,arm,(425*S,175*S))
    else:
        lift=math.sin(phase*math.pi)*12*S
        place(c,hand,(168*S,int(415*S-lift)))
        place(c,hand,(398*S,int(415*S-lift)))
        d.rounded_rectangle((205*S,int(402*S-lift),435*S,int(508*S-lift)),20*S,fill='#FFFDF8',outline='#D8CBBB',width=3*S)
        d.text((320*S,int(456*S-lift)),'完成',font=font(30*S),fill=INK,anchor='mm')
    return c.resize((640,640),Image.Resampling.LANCZOS).convert('RGB')

def scene_actions():
    bases={
      'write':rgba(PACK/'assets/emotions/png/xingcheng-q-emotion-focus.png'),
      'wave':rgba(PACK/'assets/emotions/png/xingcheng-q-emotion-happy.png'),
      'present':rgba(PACK/'assets/emotions/png/xingcheng-q-emotion-proud.png')}
    names={'write':'answer-writing','wave':'wave-invite','present':'present-result'}
    overview=Image.new('RGB',(1940,660),CREAM)
    for i,(kind,base) in enumerate(bases.items()):
        frames=[action_frame(base,kind,k/35) for k in range(36)]
        frames[0].save(PACK/f'assets/scene-actions/xingcheng-q-{names[kind]}.gif',save_all=True,append_images=frames[1:],duration=55,loop=0,optimize=True)
        frames[9].save(PACK/f'assets/scene-actions/xingcheng-q-{names[kind]}.png',quality=96)
        overview.paste(frames[9],(10+i*645,10))
    overview.save(PACK/'assets/scene-actions/00-场景动作总览.jpg',quality=94)

def jump_pose(base: Image.Image, t: float, size: int):
    """Un saut unique : anticipation, envol, reception, puis pose stable."""
    if t < .14:
        u=t/.14; y=12*u; sx=1+.045*u; sy=1-.055*u
    elif t < .50:
        u=(t-.14)/.36; y=12-92*math.sin(math.pi*u); sx=1-.025*math.sin(math.pi*u); sy=1+.05*math.sin(math.pi*u)
    elif t < .68:
        u=(t-.50)/.18; bump=math.sin(math.pi*u); y=10*bump; sx=1+.055*bump; sy=1-.065*bump
    else:
        y=0; sx=sy=1
    role=fit(base,(int(size*.69),int(size*.69)))
    role=role.resize((max(1,int(role.width*sx)),max(1,int(role.height*sy))),Image.Resampling.LANCZOS)
    c=Image.new('RGB',(size,size),CREAM)
    x=(size-role.width)//2; yy=int(size*.13+y)-(role.height-int(size*.69))//2
    c.paste(role,(x,yy),role)
    return c

def core_motion():
    out=PACK/'assets/core-motion'; out.mkdir(parents=True,exist_ok=True)
    shutil.copy2(PACK/'assets/semantic/gif/xingcheng-q-rest.gif',out/'xingcheng-q-idle-blink.gif')
    shutil.copy2(PACK/'assets/semantic/mp4/xingcheng-q-rest.mp4',out/'xingcheng-q-idle-blink.mp4')
    # 跳跃使用明确的弯月笑眼，避免窄直眼在运动中读成严肃。
    base=rgba(PACK/'assets/emotions/png/xingcheng-q-emotion-laughing.png')
    gif=[jump_pose(base,i/59,640) for i in range(60)]
    gif[0].save(out/'xingcheng-q-happy-jump.gif',save_all=True,append_images=gif[1:],duration=50,loop=0,optimize=True)
    gif[24].save(out/'xingcheng-q-happy-jump.png',quality=96)
    with tempfile.TemporaryDirectory() as td:
        td=Path(td)
        for i in range(90): jump_pose(base,i/89,512).save(td/f'{i:04d}.png')
        subprocess.run(['ffmpeg','-loglevel','error','-y','-framerate','30','-i',str(td/'%04d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',str(out/'xingcheng-q-happy-jump.mp4')],check=True)

def share_card(filename, eyebrow, title, body, role_id, accent=ORANGE):
    c=Image.new('RGBA',(1200,630),CREAM); d=ImageDraw.Draw(c)
    d.rounded_rectangle((34,34,1166,596),48,fill='#FFFDF8',outline='#E3D8CB',width=2)
    d.text((92,92),eyebrow,font=font(22),fill=accent)
    d.text((92,146),title,font=font(62),fill=INK)
    d.multiline_text((96,244),body,font=font(27,True),fill=MUTED,spacing=14)
    d.text((96,518),'量子星橙 · 和星橙Q一起，把知识变成自己的星图',font=font(20,True),fill=INK)
    role=fit(rgba(PACK/f'assets/emotions/png/xingcheng-q-emotion-{role_id}.png'),(470,470))
    place(c,role,(690,78)); c.convert('RGB').save(PACK/f'assets/share-cards/{filename}.jpg',quality=96)

def posters():
    specs=[
      ('1x1',1200,1200,'把今天的知识\n点亮成星图','happy'),
      ('3x4',1200,1600,'每天进步一点\n星光就多一点','proud'),
      ('9x16',1080,1920,'和星橙Q一起\n开始今天的探索','curious'),
      ('16x9',1600,900,'知识不是终点，是下一颗星的坐标','focus')]
    for sid,w,h,title,eid in specs:
        c=Image.new('RGBA',(w,h),CREAM); d=ImageDraw.Draw(c)
        margin=int(min(w,h)*.065)
        d.text((margin,margin),'QUANTUM STAR ORANGE',font=font(max(18,int(w*.018))),fill=ORANGE)
        size=max(50,int(min(w,h)*.065))
        d.multiline_text((margin,margin+70),title,font=font(size),fill=INK,spacing=int(size*.35))
        role=fit(rgba(PACK/f'assets/emotions/png/xingcheng-q-emotion-{eid}.png'),(int(w*.68),int(h*.58)))
        place(c,role,((w-role.width)//2,int(h*.36)))
        d.text((margin,h-margin),'量子星橙  ×  星橙Q',font=font(max(20,int(w*.021)),True),fill=MUTED)
        c.convert('RGB').save(PACK/f'assets/posters/xingcheng-q-poster-{sid}.jpg',quality=96)

def guidelines_visual():
    c=Image.new('RGB',(1600,980),CREAM); d=ImageDraw.Draw(c)
    d.text((70,58),'星橙Q · 主体与配件边界',font=font(48),fill=INK)
    d.text((72,126),'圆球本体始终是识别中心；道具只在动作需要时短暂出现。',font=font(24,True),fill=MUTED)
    calm=fit(rgba(PACK/'assets/emotions/png/xingcheng-q-emotion-calm.png'),(430,430))
    blocks=[('标准主体','默认使用','calm'),('场景动作','短暂出现','action'),('禁止常驻','不新增固定肢体','bad')]
    for i,(a,b,k) in enumerate(blocks):
        x=60+i*515
        d.rounded_rectangle((x,205,x+480,900),38,fill='#FFFDF8',outline='#DED2C5',width=2)
        if k=='action': im=Image.open(PACK/'assets/scene-actions/xingcheng-q-answer-writing.png').convert('RGB').resize((430,430),Image.Resampling.LANCZOS)
        else:
            bg=Image.new('RGBA',(430,430),CREAM); place(bg,calm,((430-calm.width)//2,0)); im=bg.convert('RGB')
        c.paste(im,(x+25,250))
        d.text((x+34,720),a,font=font(32),fill=INK)
        d.text((x+34,768),b,font=font(21,True),fill=MUTED)
        if k=='bad':
            d.line((x+70,300,x+405,635),fill='#D9492E',width=16)
            d.line((x+405,300,x+70,635),fill='#D9492E',width=16)
    c.save(PACK/'assets/guidelines/主体与配件边界.jpg',quality=95)

def make_share_assets():
    share_card('01-开始学习','TODAY · START','准备好了吗？','和星橙Q一起，点亮今天的第一颗知识星。','curious')
    share_card('02-每日完成','TODAY · COMPLETE','今日星能已收集','你完成了今天的学习，继续保持这束光。','happy')
    share_card('03-连续达成','STREAK · MILESTONE','连续学习 7 天','稳定的每一天，正在连成你的知识星轨。','proud')
    share_card('04-温和复习','REVIEW · READY','有一颗星等你重访','花几分钟再看一遍，记忆会变得更清晰。','gentle-reminder')
    posters()

def manifest():
    files=[]
    for p in sorted(PACK.rglob('*')):
        if p.is_file() and p.name not in ('manifest.json',):
            files.append({'path':str(p.relative_to(PACK)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    (PACK/'manifest.json').write_text(json.dumps({'version':'2.0.0','source':'Bloub engine','files':files},ensure_ascii=False,indent=2),encoding='utf-8')

if __name__=='__main__':
    ensure_dirs(); copy_engine_assets(); extract_peaks(); semantic_overview(); standard_assets(); sticker_pack(); scene_actions(); core_motion(); make_share_assets(); guidelines_visual(); manifest()
    print(f'Built {len(list(PACK.rglob("*")))} entries in {PACK}')
