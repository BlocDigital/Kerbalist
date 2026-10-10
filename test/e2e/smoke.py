"""Runs the real index.html headless against a stand-in Three.js and drives the UI. Usage: python test/e2e/smoke.py [path/to/index.html]
Needs: pip install playwright && playwright install chromium. Takes about a minute (it warps through a whole transfer window)."""
import re, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
HERE=Path(__file__).resolve().parent
STUB=(HERE/'three-stub.js').read_text()
URL=(Path(sys.argv[1]).resolve() if len(sys.argv)>1 else HERE.parents[1]/'index.html').as_uri()
res=[]
def check(n,c,x=''): res.append(bool(c)); print('PASS' if c else 'FAIL','-',n,x)
NB='\u2011'
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':2200,'height':1000}); pg=ctx.new_page()
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    ctx.route(re.compile(r'.*three(\.module)?(\.min)?\.js.*'), lambda r:r.fulfill(body=STUB, content_type='application/javascript'))
    ctx.route(re.compile(r'https://(fonts\.g|.*googleapis|cdnjs|.*buymeacoffee).*'), lambda r:r.abort())
    pg.goto(URL); pg.wait_for_timeout(5500)
    pg.select_option('#originSelect','Kerbin'); pg.select_option('#destSelect','Duna'); pg.click('#planBtn'); pg.wait_for_timeout(800)
    html=pg.inner_html('#transferResults'); txt=pg.inner_text('#transferResults')
    check('no page errors while planning', not errs, str(errs[:2]))
    check('ejection text uses the corrected wording', re.search(r'\d+\.\d\S* (ahead|behind) of (retrograde|prograde)', txt), re.search(r'\d+\.\d\S* (ahead|behind) of (retrograde|prograde)',txt).group(0))
    check('diagram has RG marker and no orange flame lines', '>RG<' in html and '#ffb830' not in html and 'stroke="#ff8c00"' not in html)
    check('card header renamed', 'EJECTION ANGLE (BURN POINT)' in txt.upper())
    tt=re.search(r'TRANSFER TIME\s*\n\s*([^\n]+)',txt,re.I).group(1); check('transfer time is the exact flight time (not Hohmann 302d)', not tt.startswith('302d'), tt)
    
    btns={x.inner_text().strip():x for x in pg.query_selector_all('#warpControls button')}
    def card(): return pg.inner_text('#transferResults')
    def countdown(): m=re.search(r'(T.minus [^\n]+|WINDOW OPEN NOW)',card()); return m.group(1) if m else None
    def days_left(c):
        c=(c or '').replace(NB,'-'); m=re.search(r'T-minus (?:(\d+)y )?(?:(\d+)d)?',c)
        return (int(m.group(1) or 0)*425+int(m.group(2) or 0)) if m else None
    def win(): m=re.search(r'Window opens at UT\s*\n?\s*([^\n]+)',card()); return m.group(1).strip() if m else None
    wins=[win()]; opened=False; flipped=False; stage=0; trace=[]
    btns['500,000x'].click()
    for i in range(4000):
        pg.wait_for_timeout(60); c=countdown(); d=days_left(c)
        if d is not None and d<120 and stage==0: btns['50,000x'].click(); stage=1
        if d is not None and d<12 and stage==1: btns['5,000x'].click(); stage=2
        if c=='WINDOW OPEN NOW': opened=True
        if c and (not trace or trace[-1]!=c) and (c=='WINDOW OPEN NOW' or (d is not None and d<12)): trace.append(c)
        w=win()
        if w and w!=wins[-1]: wins.append(w)
        if opened and d is not None and d>300: flipped=True; break
    btns['1x'].click()
    print('--- last readings before the window / open / roll-over:', [t.replace(NB,'-') for t in trace[:3]], '...', [t.replace(NB,'-') for t in trace[-3:]])
    print('--- "Window opens at UT" values seen:', wins)
    check('countdown reached WINDOW OPEN NOW', opened)
    check('then rolled to the NEXT window (hundreds of days away)', flipped)
    check('"Window opens at" held until the window passed, then changed exactly once', len(wins)==2, str(wins))
    ya=lambda s:(int(re.search(r'T\+(\d+)y',s).group(1))*425+int(re.search(r',(\d+)d',s).group(1)))
    if len(wins)==2: check('next window is one synodic period (~850-950 d) later', 850 < ya(wins[1])-ya(wins[0]) < 950, str(ya(wins[1])-ya(wins[0]))+' d')
    check('no page errors while warping', not errs, str(errs[:2]))
    for o,d in [('Kerbin','Eve'),('Kerbin','Jool'),('Duna','Kerbin')]:
        pg.select_option('#originSelect',o); pg.select_option('#destSelect',d); pg.click('#planBtn'); pg.wait_for_timeout(500)
        m=re.search(r'(\d+\.\d)\S* (ahead|behind) of (retrograde|prograde)',card())
        check(f'{o}->{d} plans without errors and shows a burn point', not errs and m, m.group(0) if m else '')
    print(f'\n{sum(res)}/{len(res)} passed'); b.close(); sys.exit(0 if all(res) else 1)
