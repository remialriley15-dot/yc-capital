// YC Capital confirmation engine.
// Setup score = rule agreement, NOT probability of profit.
function ema(v,p){const k=2/(p+1);let e=v[0];for(let i=1;i<v.length;i++)e=v[i]*k+e*(1-k);return e}
function rsi(v,p=14){if(v.length<=p)return 50;let g=0,l=0;for(let i=v.length-p;i<v.length;i++){const d=v[i]-v[i-1];d>0?g+=d:l-=d}if(!l)return 100;const rs=(g/p)/(l/p);return 100-100/(1+rs)}
function atr(a,p=14){const x=a.slice(-Math.min(p+1,a.length));let s=0;for(let i=1;i<x.length;i++)s+=Math.max(x[i].high-x[i].low,Math.abs(x[i].high-x[i-1].close),Math.abs(x[i].low-x[i-1].close));return s/Math.max(1,x.length-1)}
function structure(a,n=20){const x=a.slice(-n-1,-1);return {high:Math.max(...x.map(v=>+v.high)),low:Math.min(...x.map(v=>+v.low))}}
function analyze(candles,higherTimeframeCandles=[]){
 if(!candles||candles.length<55)return {decision:'WAIT',confirmed:false,reason:'Need at least 55 closed candles',strength:0};
 const closes=candles.map(x=>+x.close), last=candles.at(-1), prev=candles.at(-2), price=+last.close;
 const e20=ema(closes,20),e50=ema(closes,50),r=rsi(closes),a=atr(candles),s=structure(candles);
 const h= higherTimeframeCandles.length>=55 ? higherTimeframeCandles.map(x=>+x.close):closes;
 const he20=ema(h,20),he50=ema(h,50);
 const bullChecks=[
  price>e20 && e20>e50, he20>he50, r>=52&&r<=68,
  price>s.high || (price>+prev.high && +last.close>+last.open),
  +last.close>+last.open, a>0
 ];
 const bearChecks=[
  price<e20 && e20<e50, he20<he50, r<=48&&r>=32,
  price<s.low || (price<+prev.low && +last.close<+last.open),
  +last.close<+last.open, a>0
 ];
 const bs=bullChecks.filter(Boolean).length, ss=bearChecks.filter(Boolean).length;
 let decision='WAIT', passed=Math.max(bs,ss);
 if(bs>=5 && bullChecks[0]&&bullChecks[1]&&bullChecks[2])decision='BUY';
 if(ss>=5 && bearChecks[0]&&bearChecks[1]&&bearChecks[2])decision='SELL';
 const strength=Math.round(passed/bullChecks.length*100);
 if(decision==='WAIT')return {decision,confirmed:false,strength,reason:'NO TRADE — waiting for trend, momentum, structure and candle confirmation to align',checks:{bull:bullChecks,bear:bearChecks},metrics:{ema20:e20,ema50:e50,rsi:r,atr:a}};
 const slDist=a*1.5, sl=decision==='BUY'?Math.min(price-slDist,s.low-a*.2):Math.max(price+slDist,s.high+a*.2);
 const risk=Math.abs(price-sl),tp1=decision==='BUY'?price+risk*2:price-risk*2,tp2=decision==='BUY'?price+risk*3:price-risk*3;
 return {decision,confirmed:true,strength,entry:price,sl,tp1,tp2,riskReward:'1:2 / 1:3',reason:'SETUP CONFIRMED — required trend, momentum and confirmation rules passed',checks:{bull:bullChecks,bear:bearChecks},metrics:{ema20:e20,ema50:e50,rsi:r,atr:a}};
}
window.YCCapitalEngine={analyze};

// UI demo remains clearly separated from live signals.
const setups=[{d:'BUY'},{d:'SELL'}];
document.getElementById('demoBtn').onclick=()=>{const s=setups[Math.floor(Math.random()*setups.length)],d=document.getElementById('decision');d.textContent=s.d;d.className='decision '+s.d.toLowerCase();['entry','sl','tp1','tp2'].forEach(id=>document.getElementById(id).textContent='DEMO');document.querySelector('.muted').textContent='DEMO UI ONLY — not a confirmed live trade';document.querySelector('.meter b').textContent='Demo';};
