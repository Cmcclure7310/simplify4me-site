from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

ROOT = Path(__file__).resolve().parents[1]
EXT = ROOT / 'extension'
OUT = ROOT / 'dist' / 'store-assets'
ICON_DIR = EXT / 'icons'
OUT.mkdir(parents=True, exist_ok=True)
ICON_DIR.mkdir(parents=True, exist_ok=True)

BG = (6, 16, 31)
BG2 = (10, 20, 40)
PANEL = (12, 26, 48)
PANEL2 = (8, 18, 35)
TEXT = (237, 248, 255)
MUTED = (139, 160, 183)
CYAN = (103, 232, 249)
MINT = (94, 234, 212)
VIOLET = (196, 181, 253)
LINE = (39, 57, 78)
WHITE = (248, 250, 252)
INK = (23, 32, 51)
SLATE = (71, 85, 105)

FONT_DIR = Path('/usr/share/fonts/truetype/dejavu')

def font(size, bold=False, mono=False):
    if mono:
        p = FONT_DIR / ('DejaVuSansMono-Bold.ttf' if bold else 'DejaVuSansMono.ttf')
    else:
        p = FONT_DIR / ('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf')
    return ImageFont.truetype(str(p), size)


def gradient(size, c1=BG, c2=BG2):
    w, h = size
    im = Image.new('RGB', size)
    px = im.load()
    for y in range(h):
        for x in range(w):
            t = min(1, max(0, (x / max(1, w-1)) * .32 + (y / max(1, h-1)) * .68))
            px[x, y] = tuple(round(c1[i]*(1-t) + c2[i]*t) for i in range(3))
    return im


def glow(im, xy, radius, color, alpha=60):
    layer = Image.new('RGBA', im.size, (0,0,0,0))
    d = ImageDraw.Draw(layer)
    x, y = xy
    d.ellipse((x-radius, y-radius, x+radius, y+radius), fill=(*color, alpha))
    layer = layer.filter(ImageFilter.GaussianBlur(radius//2))
    return Image.alpha_composite(im.convert('RGBA'), layer)


def rr(draw, box, radius=18, fill=PANEL, outline=LINE, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def txt(draw, xy, value, size, color=TEXT, bold=False, anchor=None, spacing=4):
    draw.multiline_text(xy, value, font=font(size,bold), fill=color, anchor=anchor, spacing=spacing)


def fit_lines(draw, text, max_width, f):
    words = text.split()
    lines, line = [], ''
    for word in words:
        test = (line + ' ' + word).strip()
        if draw.textbbox((0,0), test, font=f)[2] <= max_width:
            line = test
        else:
            if line: lines.append(line)
            line = word
    if line: lines.append(line)
    return lines


def paragraph(draw, xy, text, max_width, size=18, color=MUTED, line_gap=8, bold=False):
    f = font(size,bold)
    lines = fit_lines(draw,text,max_width,f)
    x,y=xy
    height=size+line_gap
    for i,line in enumerate(lines):
        draw.text((x,y+i*height),line,font=f,fill=color)
    return y+len(lines)*height


def mark(draw, x, y, size=50):
    draw.rounded_rectangle((x,y,x+size,y+size),radius=max(9,size//3),fill=CYAN)
    txt(draw,(x+size/2,y+size/2),'S4',max(9,size//4),(5,18,27),True,'mm')


def top_brand(draw, title, subtitle, width=1280):
    mark(draw,72,55,50)
    txt(draw,(136,57),'Simplify 4 Me',20,TEXT,True)
    txt(draw,(136,84),subtitle,11,MUTED)
    draw.line((72,125,width-72,125),fill=LINE,width=1)


def footer_badges(draw, labels, y=742):
    x=72
    for label in labels:
        f=font(11,True)
        tw=draw.textbbox((0,0),label,font=f)[2]
        box=(x,y,x+tw+28,y+30)
        draw.rounded_rectangle(box,radius=15,fill=(11,29,43),outline=(28,73,77),width=1)
        txt(draw,(x+14,y+15),label,11,MINT,True,'lm')
        x+=tw+40


def base_store(subtitle='Private reading assistant for Chrome'):
    im=gradient((1280,800))
    im=glow(im,(1080,70),280,VIOLET,42)
    im=glow(im,(160,350),290,MINT,28)
    d=ImageDraw.Draw(im)
    top_brand(d,'Simplify 4 Me',subtitle)
    return im,d


def screenshot1():
    im,d=base_store('Highlight difficult text. Understand it in one click.')
    txt(d,(72,166),'Hard text.',50,TEXT,True)
    txt(d,(72,222),'Clear meaning.',50,MINT,True)
    paragraph(d,(72,292),'Select confusing text on a webpage and get simpler wording, key points, or hard-word help without leaving the page.',520,18,MUTED)
    # browser panel
    rr(d,(650,160,1208,684),24,(240,244,248),(66,83,102),1)
    d.rounded_rectangle((650,160,1208,205),radius=24,fill=(222,229,237))
    d.rectangle((650,183,1208,205),fill=(222,229,237))
    for i in range(3): d.ellipse((672+i*18,178,680+i*18,186),fill=(156,169,184))
    d.rounded_rectangle((748,172,1178,193),radius=8,fill=(248,250,252))
    txt(d,(764,182),'example.com / policy update',8,(131,146,163),anchor='lm')
    txt(d,(684,236),'A procedure that should be easier to read',25,INK,True)
    paragraph(d,(684,282),'Prior to the implementation of the revised procedure, personnel are required to ascertain whether the documentation is sufficient and subsequently provide assistance to individuals who require clarification.',470,14,SLATE,6)
    # simulated selected highlight
    d.rounded_rectangle((764,354,1124,381),radius=5,fill=(204,251,241))
    txt(d,(772,367),'ascertain whether the documentation is sufficient',11,(15,118,110),True,'lm')
    # result card
    rr(d,(746,420,1174,650),18,(8,16,32),(62,100,122),1)
    mark(d,766,440,32)
    txt(d,(810,440),'Simplify 4 Me',13,TEXT,True)
    txt(d,(810,459),'Clear mode • private on-device',8,MUTED)
    tabs=[('Simpler',True),('Key Points',False),('Hard Words',False)]
    x=766
    for label,on in tabs:
        w={'Simpler':73,'Key Points':84,'Hard Words':88}[label]
        d.rounded_rectangle((x,482,x+w,508),radius=8,fill=MINT if on else (13,26,46),outline=None if on else LINE)
        txt(d,(x+w/2,495),label,8,(5,18,27) if on else MUTED,True,'mm');x+=w+7
    rr(d,(766,522,1154,606),12,(4,12,27),(30,48,68),1)
    paragraph(d,(780,538),'Before the revised procedure starts, staff must find out whether the documentation is enough and later help people who need clarification.',350,11,TEXT,5)
    txt(d,(780,626),'Copy',9,CYAN,True)
    txt(d,(1110,626),'Replace',9,MINT,True,'rm')
    footer_badges(d,['NO ACCOUNT','NO API KEY','ON-DEVICE CORE'])
    im.convert('RGB').save(OUT/'screenshot-1-simplify.png')


def screenshot2():
    im,d=base_store('A calm reading view for busy pages.')
    txt(d,(72,165),'Quick Read',50,TEXT,True)
    txt(d,(72,222),'removes the clutter.',44,MINT,True)
    paragraph(d,(72,286),'Open many article-style pages in a focused layout. Adjust the theme and text size, simplify the wording, extract key points, or listen aloud.',480,18,MUTED)
    rr(d,(590,154,1208,694),22,(7,15,30),(43,65,88),1)
    # reader toolbar
    d.line((590,215,1208,215),fill=(32,49,68),width=1)
    mark(d,610,169,31); txt(d,(652,185),'Quick Read',11,TEXT,True,'lm')
    controls=['Original','Simpler','Key Points','Focus','Listen','A−','A+']
    x=760
    for c in controls:
        w=54 if c not in ['Key Points'] else 65
        d.rounded_rectangle((x,174,x+w,202),radius=8,fill=(17,31,52),outline=(39,57,78))
        txt(d,(x+w/2,188),c,7,MUTED,True,'mm');x+=w+6
    txt(d,(683,254),'Making difficult information easier to read',28,TEXT,True)
    txt(d,(683,294),'841 words  •  about 4 min  •  Detailed reading',9,MUTED)
    body='Long articles often mix useful information with navigation, sidebars, repeated links, and visually distracting elements. Quick Read creates a calmer text-first view so you can keep your place and choose how much reading help you want.'
    paragraph(d,(683,334),body,430,14,(195,211,225),9)
    txt(d,(683,487),'Choose your reading experience',19,TEXT,True)
    paragraph(d,(683,522),'Switch between the original and a locally simplified version. Use Key Points when you need the essential sentences first.',430,13,(174,193,210),8)
    # small theme cards
    for i,(name,fill,ink) in enumerate([('Midnight',(8,18,35),TEXT),('Warm',(244,234,215),(47,43,37)),('Light',(248,250,252),INK)]):
        x=683+i*143
        d.rounded_rectangle((x,616,x+130,658),radius=11,fill=fill,outline=(75,89,107))
        txt(d,(x+65,637),name,9,ink,True,'mm')
    footer_badges(d,['ORIGINAL','SIMPLER','KEY POINTS','LISTEN'])
    im.convert('RGB').save(OUT/'screenshot-2-quick-read.png')


def screenshot3():
    im,d=base_store('Four reading tools. One clean popup.')
    txt(d,(72,168),'Everything useful.',47,TEXT,True)
    txt(d,(72,222),'Nothing noisy.',47,MINT,True)
    paragraph(d,(72,292),'Simplify 4 Me keeps the main controls close: Simplify, Quick Read, Focus, Listen, reading strength, and two optional page tools.',475,18,MUTED)
    # enlarged popup
    rr(d,(735,150,1138,690),24,(7,16,31),(48,69,93),1)
    mark(d,762,178,47);txt(d,(823,180),'Simplify 4 Me',18,TEXT,True);txt(d,(823,205),'Make the web easier to read.',10,MUTED)
    d.rounded_rectangle((762,241,930,268),radius=14,fill=(10,25,40),outline=(28,50,65));d.ellipse((775,251,783,259),fill=MINT);txt(d,(792,255),'Ready on this page',8,MUTED,anchor='lm')
    cards=[('✦','Simplify','Selected text'),('⚡','Quick Read','Clean page view'),('◎','Focus','Follow one block'),('◖','Listen','Selection or page')]
    for i,(ico,title,sub) in enumerate(cards):
        col=i%2;row=i//2;x=762+col*178;y=288+row*86
        rr(d,(x,y,x+168,y+76),14,(10,24,43),(31,52,72),1)
        d.rounded_rectangle((x+11,y+14,x+42,y+45),radius=9,fill=(10,41,52));txt(d,(x+26,y+29),ico,12,CYAN,True,'mm')
        txt(d,(x+53,y+18),title,10,TEXT,True);txt(d,(x+53,y+39),sub,7,MUTED)
    rr(d,(762,470,1110,566),15,(9,22,40),(31,50,70),1);txt(d,(776,486),'HOW SIMPLE?',8,MINT,True);txt(d,(776,508),'Light     Clear     Simple',10,TEXT,True)
    d.rounded_rectangle((850,529,932,553),radius=8,fill=MINT);txt(d,(891,541),'Clear',8,(5,18,27),True,'mm')
    rr(d,(762,578,1110,652),15,(9,22,40),(31,50,70),1);txt(d,(776,592),'Complexity Lens',9,TEXT,True);txt(d,(776,610),'Underline difficult words',7,MUTED);txt(d,(776,628),'Always help on this site',9,TEXT,True)
    d.rounded_rectangle((1062,589,1097,609),radius=10,fill=(22,68,67));d.ellipse((1079,592,1094,607),fill=MINT)
    footer_badges(d,['LIGHT','CLEAR','SIMPLE','KEYBOARD SHORTCUTS'])
    im.convert('RGB').save(OUT/'screenshot-3-popup.png')


def screenshot4():
    im,d=base_store('Stay with one paragraph. Spot difficult wording.')
    txt(d,(72,166),'Focus on the part',45,TEXT,True)
    txt(d,(72,218),'you are reading.',45,MINT,True)
    paragraph(d,(72,282),'Focus Mode visually follows one readable block. Complexity Lens underlines difficult words it can explain — without wrapping or rewriting the page text.',500,18,MUTED)
    rr(d,(640,160,1208,686),22,(247,249,252),(66,83,102),1)
    txt(d,(681,204),'Understanding a complicated notice',27,INK,True)
    paras=[
      'This document provides comprehensive information regarding the implementation of a revised process and the requirements that apply to participating individuals.',
      'Prior to proceeding, participants must ascertain whether the documentation is sufficient. Any discrepancy should be addressed promptly before the next step begins.',
      'Subsequently, the organization will evaluate the information and provide assistance when additional clarification is required.'
    ]
    y=269
    for i,p in enumerate(paras):
        if i==1:
            d.rounded_rectangle((665,y-14,1182,y+111),radius=13,fill=(241,253,250),outline=(45,212,191),width=3)
            # subtle dim outside is suggested by grey first/third
            color=(36,56,70)
        else: color=(133,145,157)
        paragraph(d,(684,y),p,470,14,color,8);y+=140
    # underlines on hard words
    for x1,x2,yy in [(685,777,273),(907,1005,273),(812,873,410),(923,1018,410),(686,775,549)]: d.line((x1,yy+21,x2,yy+21),fill=(20,184,166),width=2)
    rr(d,(879,603,1167,655),13,(8,18,35),(50,87,96),1);txt(d,(896,619),'ascertain',10,TEXT,True);txt(d,(968,619),'→  find out',10,MINT,True);txt(d,(896,638),'find out or confirm',8,MUTED)
    footer_badges(d,['FOCUS MODE','COMPLEXITY LENS','NO PAGE REWRITE'])
    im.convert('RGB').save(OUT/'screenshot-4-focus-lens.png')


def screenshot5():
    im,d=base_store('Your reading stays yours.')
    txt(d,(72,170),'Private by design.',50,TEXT,True)
    txt(d,(72,229),'Useful by default.',45,MINT,True)
    paragraph(d,(72,296),'The core reading engine ships inside the extension. No required account, no API key, no cloud AI backend, no downloaded language model, and no behavioral analytics service.',520,18,MUTED)
    # shield / architecture panel
    rr(d,(700,160,1208,672),24,(8,18,35),(40,64,86),1)
    d.ellipse((851,210,1057,416),fill=(10,43,53),outline=(70,187,178),width=2)
    # shield polygon
    shield=[(954,250),(1016,274),(1005,344),(954,386),(903,344),(892,274)]
    d.polygon(shield,fill=(11,77,77),outline=MINT)
    txt(d,(954,314),'S4',36,MINT,True,'mm')
    txt(d,(954,448),'ON-DEVICE CORE',11,MINT,True,'mm')
    rows=[('Account required','No'),('API key','No'),('Cloud AI backend','No'),('Remote JavaScript','No'),('Behavioral analytics','No')]
    y=482
    for label,value in rows:
        txt(d,(795,y),label,10,MUTED);txt(d,(1112,y),value,10,MINT,True,'rm');d.line((795,y+20,1112,y+20),fill=(30,48,68),width=1);y+=34
    footer_badges(d,['LOCAL SIMPLIFICATION','LOCAL SETTINGS','CLEAR DISCLOSURES'])
    im.convert('RGB').save(OUT/'screenshot-5-private.png')


def small_promo():
    im=gradient((440,280));im=glow(im,(382,20),150,VIOLET,48);im=glow(im,(40,240),150,MINT,34);d=ImageDraw.Draw(im)
    mark(d,28,27,49);txt(d,(91,31),'Simplify 4 Me',17,TEXT,True);txt(d,(91,55),'READING ASSISTANT',8,MINT,True)
    txt(d,(28,105),'Hard text.',34,TEXT,True);txt(d,(28,146),'Clear meaning.',34,MINT,True)
    paragraph(d,(28,197),'Highlight • Simplify • Understand',350,12,MUTED)
    d.rounded_rectangle((320,216,411,249),radius=16,fill=(9,34,43),outline=(46,105,105));txt(d,(365,232),'PRIVATE',9,MINT,True,'mm')
    im.convert('RGB').save(OUT/'small-promo-440x280.png')


def marquee():
    im=gradient((1400,560));im=glow(im,(1190,40),260,VIOLET,45);im=glow(im,(160,500),260,MINT,32);d=ImageDraw.Draw(im)
    mark(d,64,54,56);txt(d,(134,58),'Simplify 4 Me',21,TEXT,True);txt(d,(134,87),'PRIVATE READING ASSISTANT',9,MINT,True)
    txt(d,(64,171),'Hard text.',58,TEXT,True);txt(d,(64,238),'Clear meaning.',58,MINT,True)
    paragraph(d,(64,325),'Simplify difficult webpage text, extract key points, remove reading clutter, and listen aloud — with an on-device core and no account required.',600,17,MUTED,8)
    # compact result UI on right
    rr(d,(830,104,1328,466),25,(8,18,35),(48,75,99),1)
    mark(d,859,132,39);txt(d,(911,135),'Simplify 4 Me',16,TEXT,True);txt(d,(911,157),'Clear mode • private on-device',9,MUTED)
    for i,(name,on) in enumerate([('Simpler',1),('Key Points',0),('Hard Words',0)]):
        x=859+i*104;d.rounded_rectangle((x,199,x+95,230),radius=9,fill=MINT if on else (13,27,47),outline=None if on else LINE);txt(d,(x+47,214),name,8,(5,18,27) if on else MUTED,True,'mm')
    rr(d,(859,253,1298,356),13,(4,12,27),(29,48,68),1)
    paragraph(d,(877,272),'Before the procedure starts, staff must find out whether the documentation is enough and help anyone who needs clarification.',400,12,TEXT,7)
    txt(d,(877,397),'NO ACCOUNT',9,MINT,True);txt(d,(990,397),'NO API KEY',9,MINT,True);txt(d,(1092,397),'ON-DEVICE CORE',9,MINT,True)
    im.convert('RGB').save(OUT/'marquee-1400x560.png')


def icon_source(size=512):
    scale=4
    im=Image.new('RGBA',(size,size),(0,0,0,0));d=ImageDraw.Draw(im)
    margin=int(size*.06);radius=int(size*.24)
    # outer dark tile
    d.rounded_rectangle((margin,margin,size-margin,size-margin),radius=radius,fill=(7,16,31,255),outline=(49,78,101,255),width=max(2,size//128))
    # inner gradient manually
    inner=Image.new('RGBA',(size,size),(0,0,0,0));idraw=ImageDraw.Draw(inner)
    box=(int(size*.16),int(size*.16),int(size*.84),int(size*.84))
    for i in range(box[3]-box[1]):
        t=i/max(1,(box[3]-box[1]-1));
        if t<.55:
            u=t/.55;c=tuple(round(CYAN[j]*(1-u)+MINT[j]*u) for j in range(3))
        else:
            u=(t-.55)/.45;c=tuple(round(MINT[j]*(1-u)+VIOLET[j]*u) for j in range(3))
        idraw.line((box[0],box[1]+i,box[2],box[1]+i),fill=(*c,255),width=1)
    mask=Image.new('L',(size,size),0);md=ImageDraw.Draw(mask);md.rounded_rectangle(box,radius=int(size*.20),fill=255)
    inner.putalpha(mask);im=Image.alpha_composite(im,inner);d=ImageDraw.Draw(im)
    f=font(int(size*.27),True)
    d.text((size/2,size/2),'S4',font=f,fill=(5,18,27),anchor='mm',stroke_width=max(0,size//256),stroke_fill=(5,18,27))
    return im


def icons():
    master=icon_source(512)
    master.save(OUT/'icon-master-512.png')
    for size in [16,32,48,128]:
        master.resize((size,size),Image.Resampling.LANCZOS).save(ICON_DIR/f'icon{size}.png')


def validate():
    expected={
      'screenshot-1-simplify.png':(1280,800),'screenshot-2-quick-read.png':(1280,800),'screenshot-3-popup.png':(1280,800),'screenshot-4-focus-lens.png':(1280,800),'screenshot-5-private.png':(1280,800),'small-promo-440x280.png':(440,280),'marquee-1400x560.png':(1400,560)
    }
    for name,size in expected.items():
        with Image.open(OUT/name) as im:
            assert im.size==size,(name,im.size,size)
    for size in [16,32,48,128]:
        with Image.open(ICON_DIR/f'icon{size}.png') as im: assert im.size==(size,size)


if __name__=='__main__':
    icons();screenshot1();screenshot2();screenshot3();screenshot4();screenshot5();small_promo();marquee();validate();print('Generated and validated Simplify 4 Me artwork.')
