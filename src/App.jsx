import { useState, useMemo, useCallback } from "react";

const CURRENCIES = [
  { code:"RUB", symbol:"₽",   name:"Россия" },
  { code:"KZT", symbol:"₸",   name:"Казахстан" },
  { code:"BYN", symbol:"Br",  name:"Беларусь" },
  { code:"UZS", symbol:"сўм", name:"Узбекистан" },
  { code:"UAH", symbol:"₴",   name:"Украина" },
  { code:"KGS", symbol:"с",   name:"Кыргызстан" },
  { code:"TJS", symbol:"SM",  name:"Таджикистан" },
  { code:"AZN", symbol:"₼",   name:"Азербайджан" },
  { code:"AMD", symbol:"֏",   name:"Армения" },
  { code:"GEL", symbol:"₾",   name:"Грузия" },
  { code:"MDL", symbol:"L",   name:"Молдова" },
  { code:"TMT", symbol:"T",   name:"Туркменистан" },
];

const PRINT_DEF = { 3:1004, 4:1188, 5:1372, 6:1556 };

const DEF_TARIFFS = [
  { name:"Прайм",    rev_all:6, rev_ind:2, foto_ind:7, foto_fr:3, foto_gr:2, foto_cls:2, ret_ind:true,  ret_fr:true,  ret_gr:true,  ret_cls:false },
  { name:"Комфорт",  rev_all:5, rev_ind:2, foto_ind:6, foto_fr:3, foto_gr:2, foto_cls:2, ret_ind:true,  ret_fr:true,  ret_gr:true,  ret_cls:false },
  { name:"Стандарт", rev_all:4, rev_ind:1, foto_ind:2, foto_fr:3, foto_gr:2, foto_cls:2, ret_ind:true,  ret_fr:true,  ret_gr:true,  ret_cls:false },
  { name:"Эконом",   rev_all:3, rev_ind:1, foto_ind:2, foto_fr:3, foto_gr:2, foto_cls:2, ret_ind:true,  ret_fr:true,  ret_gr:true,  ret_cls:false },
];

const C = {
  bg:"#090B0F", surface:"#10131A", card:"#141720", border:"#1E2330",
  c1:"#07ffc9", c2:"#07b9ff", text:"#ECF0F8", muted:"#6B7590", dim:"#3A4158",
};
const GRAD  = `linear-gradient(135deg,${C.c1},${C.c2})`;
const GRADT = `linear-gradient(90deg,${C.c1},${C.c2})`;

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{background:${C.bg};color:${C.text};font-family:'Rubik',sans-serif;font-size:14px;}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
  input[type=number]{-moz-appearance:textfield;}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:${C.bg};}
  ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}
  .layout{display:grid;grid-template-columns:370px 1fr;gap:18px;align-items:start;}
  @media(max-width:800px){
    .layout{grid-template-columns:1fr;}
    .left-panel{order:1;}
    .right-panel{order:2;}
    .two-col{grid-template-columns:1fr!important;}
    .hide-mobile{display:none!important;}
  }

  .sticky-col {
    position: sticky;
    left: 0;
    z-index: 2;
    background: #141720;
  }
  @media(max-width:768px){
    .two-col{grid-template-columns:1fr!important;}
    .left-panel,.right-panel{min-width:0!important;}
    .result-grid{grid-template-columns:1fr!important;}
    .tariff-qty{grid-template-columns:1fr 1fr!important;}
  }

  @media print{
    .np{display:none!important;}
    body{background:#fff;color:#000;}
    .pc{background:#fff!important;border:1px solid #ddd!important;}
    .pm{color:#333!important;}.pa{color:#0077aa!important;}
  }
`;

const fmt = (n,s) => isFinite(n) ? Math.round(n).toLocaleString("ru-RU")+"\u202f"+s : "—";
const pct = n => (n*100).toFixed(1)+"%";
const rnd = n => Math.round(n/100)*100;

function TT({ text, children }) {
  const [show, setShow] = useState(false);
  if (!text) return <>{children}</>;
  return (
    <span style={{position:"relative",display:"inline-flex",alignItems:"center"}}
      onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      {children}
      <span style={{
        display:"inline-flex",alignItems:"center",justifyContent:"center",
        width:15,height:15,borderRadius:"50%",fontSize:10,fontWeight:700,
        background:`${C.c2}33`,color:C.c2,cursor:"help",marginLeft:5,flexShrink:0,
      }}>?</span>
      {show && (
        <div style={{
          position:"absolute",left:0,top:"calc(100% + 6px)",zIndex:999,
          background:"#1A1F2E",border:`1px solid ${C.c2}55`,
          borderRadius:10,padding:"10px 14px",width:290,
          fontSize:12,color:"#C8D0E0",lineHeight:1.6,
          boxShadow:"0 8px 24px rgba(0,0,0,.5)",pointerEvents:"none",
        }}>{text}</div>
      )}
    </span>
  );
}

function Logo({ size=38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.c1}/>
          <stop offset="100%" stopColor={C.c2}/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#lg)"/>
      {[0,60,120,180,240,300].map(a=>{
        const r=a*Math.PI/180;
        return <line key={a} x1="50" y1="50" x2={50+50*Math.cos(r)} y2={50+50*Math.sin(r)} stroke={C.bg} strokeWidth="7"/>;
      })}
      <circle cx="50" cy="50" r="15" fill={C.bg}/>
    </svg>
  );
}

function Card({ children, style }) {
  return (
    <div className="pc" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"20px 22px",...style}}>
      {children}
    </div>
  );
}

function SecTitle({ children, icon, tip }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
      {icon && <span style={{fontSize:15}}>{icon}</span>}
      <span style={{fontWeight:600,fontSize:14,background:GRADT,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
        {children}
      </span>
      {tip && <TT text={tip}><span/></TT>}
    </div>
  );
}

function FR({ label, hint, tip, children }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
      <div style={{flex:1,paddingRight:10}}>
        <div style={{fontSize:13,color:C.text}} className="pm">
          <TT text={tip}>{label}</TT>
        </div>
        {hint && <div style={{fontSize:11,color:C.dim,marginTop:1}}>{hint}</div>}
      </div>
      <div style={{flexShrink:0}}>{children}</div>
    </div>
  );
}

function NI({ value, onChange, min=0, step=1, suffix, width=130 }) {
  return (
    <div style={{display:"flex",alignItems:"center",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden",width}}>
      <input type="number" value={value} min={min} step={step}
        onChange={e=>onChange(Number(e.target.value))}
        style={{background:"transparent",border:"none",color:C.text,fontSize:13,padding:"7px 10px",width:"100%",outline:"none",fontFamily:"'Rubik',sans-serif"}}/>
      {suffix && <span style={{padding:"0 8px",color:C.muted,fontSize:12,whiteSpace:"nowrap"}}>{suffix}</span>}
    </div>
  );
}

function Tog({ value, onChange }) {
  return (
    <button onClick={()=>onChange(!value)} style={{
      width:42,height:23,borderRadius:12,border:"none",cursor:"pointer",
      background:value?GRAD:C.border,position:"relative",transition:"background .2s",flexShrink:0,
    }}>
      <div style={{width:17,height:17,borderRadius:"50%",background:"#fff",position:"absolute",
        top:3,left:value?22:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.5)"}}/>
    </button>
  );
}

function Chips({ options, value, onChange }) {
  return (
    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
      {options.map(o=>(
        <button key={o.v} onClick={()=>onChange(o.v)} style={{
          padding:"4px 12px",borderRadius:16,cursor:"pointer",fontSize:12,
          fontFamily:"'Rubik',sans-serif",transition:"all .15s",
          border:`1px solid ${value===o.v?C.c1:C.border}`,
          background:value===o.v?`${C.c1}1A`:"transparent",
          color:value===o.v?C.c1:C.muted,
        }}>{o.l}</button>
      ))}
    </div>
  );
}

function RR({ label, val, accent, muted, large, tip }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}44`}}>
      <span style={{fontSize:13,color:muted?C.dim:C.muted}} className="pm"><TT text={tip}>{label}</TT></span>
      <span style={{
        fontSize:large?17:13,fontWeight:large?700:500,
        ...(accent?{background:GRADT,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}:{}),
        color:muted?C.dim:C.text,
      }} className={accent?"pa":"pm"}>{val}</span>
    </div>
  );
}

function SelfBlock({ children }) {
  return (
    <div style={{borderLeft:`2px solid ${C.c2}55`,paddingLeft:12,paddingTop:2,marginTop:2}}>
      {children}
    </div>
  );
}

// ── Все тексты подсказок ───────────────────────────────────────────────────
const T = {
  mgr_q:
    "Клиентский менеджер — участник команды, который ведёт заказ от первого контакта до сдачи альбомов: консультирует заказчика, оформляет договор, согласовывает макеты, оформляет заказ в типографии, контролирует сроки и качество. Если этот функционал выполняешь ты сам, то отключи тумблер и укажи, во сколько ты оцениваешь свои трудозатраты на это.",
  mgr_rate:
    "Укажи ставку клиентского менеджера за весь проект — от первого контакта с заказчиком до финальной сдачи альбомов.",
  mgr_self:
    "Укажи, во сколько ты оцениваешь свои трудозатраты на коммуникацию с заказчиком за весь проект.",
  ret_q:
    "Ретушёр выполняет базовую обработку всего отснятого материала (отбраковку неудачных снимков, цвето- и светокоррекцию) и детальную ретушь фотографий, которые войдут в макет. Если этот функционал выполняешь ты сам, то отключи тумблер и укажи, во сколько ты оцениваешь свои трудозатраты на это.",
  ret_base:
    "Ставка за базовую обработку с каждого часа съёмки. Включает: отбраковку неудачных снимков (расфокус, все моргнули и т.п.); цвето- и светокоррекцию; выравнивание горизонта; наращивание фона; удаление лишних предметов из кадра.",
  ret14:
    "Ставка за детальную ретушь одного фото до 4 человек в кадре. Включает: обработку кожи, работу с причёской, коррекцию фигуры при необходимости.",
  ret57:
    "Ставка за детальную ретушь одного группового фото — 5–7 человек в кадре. Включает: обработку кожи, работу с причёской, коррекцию фигуры при необходимости.",
  ret8:
    "Ставка за детальную ретушь одного фото с 8 и более людьми в кадре. Включает: обработку кожи, работу с причёской, коррекцию фигуры при необходимости.",
  des_q:
    "Дизайнер разрабатывает новый дизайн-макет, если это необходимо, и/или наполняет готовыми фотографиями уже готовый дизайн-макет. Если этот функционал выполняешь ты сам, то отключи тумблер и укажи, во сколько ты оцениваешь свои трудозатраты на это.",
  des_new:
    "Стоимость работы дизайнера по разработке нового макета одного разворота с нуля — на случай, если для этого заказа создаётся новый дизайн.",
  des_new_s:
    "Стоимость твоей работы по разработке нового макета одного разворота с нуля — на случай, если для этого заказа ты создаёшь новый дизайн.",
  des_fill:
    "Ставка дизайнера за наполнение одного разворота готового макета обработанными фотографиями детей.",
  des_fill_s:
    "Укажи, во сколько ты оцениваешь свои трудозатраты на наполнение одного разворота готового макета обработанными фотографиями детей.",
  photo_r:
    "Укажи ставку за фотосъёмку в чистом виде — без учёта стоимости дороги, ретуши, вёрстки макетов и прочих дополнительных работ.",
  photo_m:
    "Укажи, сколько времени в среднем тебе нужно, чтобы сделать одну хорошую фотографию для альбома — с учётом постановки, настройки света, пробных кадров для удачного ракурса.",
  coeff:
    "Укажи, с какой вероятностью одно и то же групповое фото используется в альбомах разных детей, изображённых на нём. Это нужно для расчёта средней стоимости ретуши на один альбом. Если не знаешь — оставь значение по умолчанию.",
  log_eq:
    "Примерные транспортные расходы на доставку оборудования (фон, осветители, стойки, реквизит и т.п.) до места съёмки и обратно. Если едешь общественным транспортом без крупного оборудования — заложи только стоимость проезда.",
  print:
    "Укажи ставки типографии на печать альбомов в зависимости от количества разворотов. Можно найти в прайсе типографии, с которой планируешь работать.",
  log_typo:
    "Стоимость доставки из типографии. Можно узнать в прайсе типографии — зависит от курьерской службы и адреса получения.",
  log_alb:
    "Укажи стоимость упаковки и отправки заказчику готовых альбомов после проведения контроля качества печати. Если ты не проводишь контроль качества готовых альбомов, а сразу напрямую указываешь адрес заказчика при оформлении доставки из типографии, то поставь в этом поле 0.",
  margin:
    "Маржинальность — это разница между выручкой от заказа и себестоимостью его выполнения. Не путай это с твоим доходом как фотографа — из этой суммы ты ещё должен будешь заплатить налоги, банковские комиссии, отложить на рекламу для получения новых заказов и на непредвиденные расходы, чтобы быть готовым к любым кризисным периодам. А также благодаря этой цифре у тебя будет возможность сделать заказчику скидку. Чем выше маржинальность — тем лучше выживаемость твоего фотобизнеса и выше шансы на развитие.",
  disc:
    "Укажи, какую скидку ты готов озвучить заказчику.",
  pay_svc:
    "Если у тебя подключены сервисы для приёма онлайн-оплаты (например, Яндекс Сплит, Робокасса, ЮКасса и другие) — включи тумблер.",
  pay_pct:
    "Укажи средний % комиссии всех подключенных платёжных сервисов.",
  new_des:
    "Включи тумблер, если для выполнения этого заказа потребуется разработка дизайн-макета с нуля.",
  cover:
    "Укажи, какой тип обложки будет использоваться для всех альбомов в заказе: индивидуальная с портретом каждого ребёнка или общая с фотографией всего класса.",
  teacher:
    "Укажи количество педагогов, которым планируется подарить альбом от класса, и количество разворотов в подарочном альбоме (обычно указывают только классного руководителя и минимальное количество разворотов). Если не хочешь включать подарочные альбомы в расчёт — укажи 0 в графе «Кол-во педагогов».",
  teacher_ret:
    "Укажи количество индивидуальных портретов одного педагога, входящих в альбомы (обычно 1–2 портрета классного руководителя включено во все альбомы в заказе). Эти фотографии попадут в альбомы детей, поэтому нужно указать количество даже если подарочный альбом не включается в расчёт.",
  rev_ind:
    "Укажи количество разворотов, состоящих из индивидуальных портретов ребёнка и его фотографий с друзьями (если включена индивидуальная обложка, то она здесь не учитывается).",
  tariff_photos:
    "Укажи количество фотографий разного типа, включённых в каждый тариф. Включи тумблер напротив фотографий, детальную ретушь которых хочешь включить в расчёт.",
  full_cost:
    "Полная себестоимость 1 альбома складывается из: переменных затрат (съёмка, ретушь, вёрстка и печать, рассчитанные на 1 альбом) и доли фиксированных затрат проекта (менеджер, логистика, подарочные альбомы и т.п.), делённой на общее количество альбомов.",
  ret_base_s: "Укажи свою ставку за базовую обработку материала с каждого часа съёмки. К базовой обработке относится: отбраковка неудачных снимков; цвето- и светокоррекция; выравнивание горизонта; наращивание фона; удаление мусора из кадра и т.п.",
  teachers:   "Укажи количество педагогов, которым планируется подарить альбом от класса, и количество разворотов в подарочном альбоме (обычно указывают только классного руководителя и минимальное количество разворотов). Если не хочешь включать подарочные альбомы в расчёт — в графе Кол-во педагогов укажи 0.",
  total_proj:
    "Включает: полную себестоимость всего проекта + налог на доход + комиссии платёжных сервисов (если подключены).",
  ret_base_s: "Укажи свою ставку за базовую обработку материала с каждого часа съёмки. К базовой обработке относится: отбраковка неудачных снимков; цвето- и светокоррекция; выравнивание горизонта; наращивание фона; удаление мусора из кадра и т.п.",
  teachers:   "Укажи количество педагогов, которым планируется подарить альбом от класса, и количество разворотов в подарочном альбоме (обычно указывают только классного руководителя и минимальное количество разворотов). Если не хочешь включать подарочные альбомы в расчёт — в графе Кол-во педагогов укажи 0.",
  total_proj:   "Полная себестоимость проекта плюс налог на доход и комиссии платёжных сервисов — то, что уходит до того, как у тебя в руках чистая прибыль.",
};

// ── Main ───────────────────────────────────────────────────────────────────
export default function App() {
  const [cur,      setCur]      = useState(CURRENCIES[0]);
  const [taxRate,  setTax]      = useState(8);
  const [markup,   setMarkup]   = useState(60);
  const [disc,     setDisc]     = useState(20);
  const [newDes,   setNewDes]   = useState(false);
  const [cover,    setCover]    = useState("individual");
  const [coeff,    setCoeff]    = useState(60);
  const [pMin,     setPMin]     = useState(1);

  const [hasMgr,  setHasMgr]  = useState(true);
  const [hasRet,  setHasRet]  = useState(true);
  const [hasDes,  setHasDes]  = useState(true);
  const [hasAcq,  setHasAcq]  = useState(false);
  const [hasPay,  setHasPay]  = useState(false);

  const [rPhoto,   setRPhoto]   = useState(3000);
  const [rMgr,     setRMgr]    = useState(10000);
  const [rMgrS,    setRMgrS]   = useState(5000);
  const [rRBase,   setRRBase]  = useState(1800);
  const [rRBaseS,  setRRBaseS] = useState(1200);
  const [rR14,     setRR14]    = useState(180);
  const [rR14S,    setRR14S]   = useState(120);
  const [rR57,     setRR57]    = useState(200);
  const [rR57S,    setRR57S]   = useState(150);
  const [rR8,      setRR8]     = useState(230);
  const [rR8S,     setRR8S]    = useState(170);
  const [rDNew,    setRDNew]   = useState(630);
  const [rDNewS,   setRDNewS]  = useState(400);
  const [rDFill,   setRDFill]  = useState(350);
  const [rDFillS,  setRDFillS] = useState(250);
  const [lEq,      setLEq]     = useState(6000);
  const [lTypo,    setLTypo]   = useState(1100);
  const [lAlb,     setLAlb]    = useState(8000);
  const [pp,       setPP]      = useState(PRINT_DEF);
  const [acqPct,   setAcqPct]  = useState(3);
  const [payPct,   setPayPct]  = useState(5);

  const [tariffs,  setTariffs] = useState(DEF_TARIFFS);
  const updT = useCallback((i,f,v)=>setTariffs(p=>p.map((t,x)=>x===i?{...t,[f]:typeof v==="boolean"?v:Number(v)}:t)),[]);
  const [qtys, setQtys] = useState([5,5,10,10]);
  const updQ = useCallback((i,v)=>setQtys(p=>p.map((q,x)=>x===i?Math.max(0,v):q)),[]);

  const [tCnt,        setTCnt]       = useState(1);
  const [tRevs,       setTRevs]      = useState(3);
  const [tRetPhotos,  setTRetPhotos] = useState(2);

  const sym   = cur.symbol;
  const total = qtys.reduce((a,b)=>a+b,0);
  const md=markup/100, td=taxRate/100, cd=coeff/100;

  const calc = useMemo(()=>{
    if(total===0) return null;
    const eRB  = hasRet?rRBase:rRBaseS;
    const eR14 = hasRet?rR14:rR14S;
    const eR57 = hasRet?rR57:rR57S;
    const eR8  = hasRet?rR8:rR8S;
    const eDN  = hasDes?rDNew:rDNewS;
    const eDF  = hasDes?rDFill:rDFillS;

    const shootHrs = tariffs.reduce((s,t,i)=>s+qtys[i]*(t.foto_ind+t.foto_fr+t.foto_gr+(t.foto_cls||0))*pMin/60,0);

    const vC = tariffs.map(t=>{
      const sh=(t.foto_ind+t.foto_fr+t.foto_gr+(t.foto_cls||0))*pMin/60*rPhoto;
      const re=(t.ret_ind?t.foto_ind*eR14:0)
              +(t.ret_fr ?t.foto_fr *eR14*(1-cd+cd/3):0)
              +(t.ret_gr ?t.foto_gr *eR57*(1-cd+cd/6):0)
              +(t.ret_cls?(t.foto_cls||0)*eR8/total:0);
      const di=t.rev_ind*eDF;
      const dc=cover==="individual"?eDF:0;
      const pr=pp[t.rev_all]??0;
      return {sh,re,di,dc,pr,tot:sh+re+di+dc+pr};
    });

    const fMgr = hasMgr?rMgr:rMgrS;
    const fPh  = shootHrs*rPhoto;
    const fRB  = shootHrs*eRB;
    const tRet = tRetPhotos*tCnt*eR14;
    const fDN  = newDes?(()=>{const mx=Math.max(...tariffs.filter((_,i)=>qtys[i]>0).map(t=>t.rev_all));return(mx+1)*eDN;})():0;
    const fDC  = (()=>{const ac=tariffs.filter((_,i)=>qtys[i]>0);if(!ac.length)return 0;const mx=Math.max(...ac.map(t=>t.rev_all-t.rev_ind));return mx*eDF+(cover==="common"?eDF:0);})();
    const tPr  = (pp[tRevs]??0)*tCnt;
    const tCv  = cover==="individual"?eDF*tCnt:0;
    const fTch = tPr+tCv;
    const fFix = fMgr+fPh+fRB+tRet+fDN+fDC+fTch+lEq+lAlb+lTypo;
    const fPA  = fFix/total;

    const fC  = vC.map(v=>v.tot+fPA);
    const pR  = fC.map(c=>rnd(c/(1-md)));
    const pD  = pR.map(p=>p*(1-disc/100));
    const prA  = pR.map((p,i)=>p-fC[i]);
    const prAD = pD.map((p,i)=>p-fC[i]);
    const revP = pR.reduce((s,p,i)=>s+p*qtys[i],0);
    const revF = pD.reduce((s,p,i)=>s+p*qtys[i],0);

    const tax=revF*td, acq=hasAcq?revF*acqPct/100:0, pay=hasPay?revF*payPct/100:0;
    const rEx=tax+acq+pay;
    const totC=vC.reduce((s,v,i)=>s+v.tot*qtys[i],0)+fFix;
    const np=revF-totC-rEx;
    const mg=revF>0?np/revF:0;
    const res=np*0.10, mkt=np*0.34, equip=np*0.15, edu=np*0.15;

    const pyMg=fMgr, pyPh=fPh;
    const pyRe=fRB+tRet+vC.reduce((s,v,i)=>s+v.re*qtys[i],0);
    const pyDe=fDN+fDC+vC.reduce((s,v,i)=>s+(v.di+v.dc)*qtys[i],0);
    const pyTyPrint=vC.reduce((s,v,i)=>s+v.pr*qtys[i],0)+tPr;
    const pyTy=pyTyPrint+lTypo;
    const pyLE=lEq, pyLA=lAlb;
    const pyTot=pyMg+pyPh+pyLE+pyRe+pyDe+pyTy+pyLA;

    return {vC,fC,pR,pD,prA,prAD,revP,revF,fPA,totC,tax,acq,pay,rEx,res,mkt,equip,edu,np,mg,pyMg,pyPh,pyRe,pyDe,pyTy,pyTyPrint,pyLE,pyLA,pyTot,shootHrs,lTypo};
  },[tariffs,qtys,hasMgr,hasRet,hasDes,hasAcq,hasPay,
     rPhoto,rMgr,rMgrS,rRBase,rRBaseS,rR14,rR14S,rR57,rR57S,rR8,rR8S,
     rDNew,rDNewS,rDFill,rDFillS,lEq,lAlb,lTypo,acqPct,payPct,
     md,td,disc,cd,pMin,pp,newDes,cover,tCnt,tRevs,tRetPhotos,total]);

  const PHOTO_ROWS = [
    {key:"foto_ind",retKey:"ret_ind",label:"Индивидуальные фото",         retLbl:"ретушь портретов"},
    {key:"foto_fr", retKey:"ret_fr", label:"Фото с друзьями (2–4 чел.)",  retLbl:"2–4 человека в кадре"},
    {key:"foto_gr", retKey:"ret_gr", label:"Групповые фото (5–7 чел.)",   retLbl:"5–7 человек в кадре"},
    {key:"foto_cls",retKey:"ret_cls",label:"Групповые фото (8+ чел.)",    retLbl:"8+ человек в кадре"},
  ];

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Rubik',sans-serif"}}>
      <style>{CSS}</style>

      {/* Header */}
      <header className="np" style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"18px 20px 16px"}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <img src="/logo.png" alt="ФотоДзен" style={{width:38,height:38,borderRadius:10,objectFit:"contain"}}/>
            <div>
              <div style={{fontSize:22,fontWeight:700,background:GRADT,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>ФотоДзен</div>
              <div style={{fontSize:10,color:C.dim,letterSpacing:".1em",textTransform:"uppercase"}}>Калькулятор выпускных фотоальбомов</div>
            </div>
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {CURRENCIES.map(c=>(
              <button key={c.code} onClick={()=>setCur(c)} style={{
                padding:"4px 11px",borderRadius:14,cursor:"pointer",fontSize:12,
                fontFamily:"'Rubik',sans-serif",transition:"all .15s",
                border:`1px solid ${cur.code===c.code?C.c1:C.border}`,
                background:cur.code===c.code?`${C.c1}18`:"transparent",
                color:cur.code===c.code?C.c1:C.muted,
              }}>{c.symbol} {c.name}</button>
            ))}
          </div>
        </div>
      </header>

      <div style={{maxWidth:1120,margin:"0 auto",padding:"20px 16px 60px"}}>
        <div className="layout">

          {/* ═══ LEFT ═══ */}
          <div className="left-panel">

            {/* Команда */}
            <Card style={{marginBottom:14}}>
              <SecTitle icon="👥">Команда</SecTitle>
              <FR label="Есть клиентский менеджер?" tip={T.mgr_q}><Tog value={hasMgr} onChange={setHasMgr}/></FR>
              {hasMgr
                ? <FR label="Ставка клиентского менеджера" hint={`${sym}/проект`} tip={T.mgr_rate}><NI value={rMgr} onChange={setRMgr} step={500} suffix={sym} width={135}/></FR>
                : <SelfBlock><FR label="Моя ставка за коммуникацию с заказчиком" hint={`${sym}/проект`} tip={T.mgr_self}><NI value={rMgrS} onChange={setRMgrS} step={500} suffix={sym} width={135}/></FR></SelfBlock>
              }
              <FR label="Есть ретушёр?" tip={T.ret_q}><Tog value={hasRet} onChange={setHasRet}/></FR>
              {hasRet ? <>
                <FR label="Базовая обработка" hint={`${sym}/час`} tip={T.ret_base}><NI value={rRBase} onChange={setRRBase} step={100} suffix={sym} width={135}/></FR>
                <FR label="Детальная ретушь 1–4 чел." hint={`${sym}/фото`} tip={T.ret14}><NI value={rR14} onChange={setRR14} step={10} suffix={sym} width={135}/></FR>
                <FR label="Детальная ретушь 5–7 чел." hint={`${sym}/фото`} tip={T.ret57}><NI value={rR57} onChange={setRR57} step={10} suffix={sym} width={135}/></FR>
                <FR label="Детальная ретушь 8+ чел." hint={`${sym}/фото`} tip={T.ret8}><NI value={rR8} onChange={setRR8} step={10} suffix={sym} width={135}/></FR>
              </> : <SelfBlock>
                <FR label="Моя ставка за базовую обработку" hint={`${sym}/час`} tip={T.ret_base_s}><NI value={rRBaseS} onChange={setRRBaseS} step={100} suffix={sym} width={135}/></FR>
                <FR label="Моя ставка за ретушь 1–4 чел." hint={`${sym}/фото`} tip={T.ret14}><NI value={rR14S} onChange={setRR14S} step={10} suffix={sym} width={135}/></FR>
                <FR label="Моя ставка за ретушь 5–7 чел." hint={`${sym}/фото`} tip={T.ret57}><NI value={rR57S} onChange={setRR57S} step={10} suffix={sym} width={135}/></FR>
                <FR label="Моя ставка за ретушь 8+ чел." hint={`${sym}/фото`} tip={T.ret8}><NI value={rR8S} onChange={setRR8S} step={10} suffix={sym} width={135}/></FR>
              </SelfBlock>}
              <FR label="Есть дизайнер?" tip={T.des_q}><Tog value={hasDes} onChange={setHasDes}/></FR>
              {hasDes ? <>
                <FR label="Разработка макета с нуля" hint={`${sym}/разворот`} tip={T.des_new}><NI value={rDNew} onChange={setRDNew} step={50} suffix={sym} width={135}/></FR>
                <FR label="Наполнение макета готовыми фотографиями" hint={`${sym}/разворот`} tip={T.des_fill}><NI value={rDFill} onChange={setRDFill} step={50} suffix={sym} width={135}/></FR>
              </> : <SelfBlock>
                <FR label="Моя ставка за вёрстку нового макета с нуля" hint={`${sym}/разворот`} tip={T.des_new_s}><NI value={rDNewS} onChange={setRDNewS} step={50} suffix={sym} width={135}/></FR>
                <FR label="Моя ставка за наполнение макета готовыми фото" hint={`${sym}/разворот`} tip={T.des_fill_s}><NI value={rDFillS} onChange={setRDFillS} step={50} suffix={sym} width={135}/></FR>
              </SelfBlock>}
            </Card>

            {/* Съёмка */}
            <Card style={{marginBottom:14}}>
              <SecTitle icon="📷">Съёмка</SecTitle>
              <FR label="Ставка фотографа" hint={`${sym}/час`} tip={T.photo_r}><NI value={rPhoto} onChange={setRPhoto} step={100} suffix={sym} width={135}/></FR>
              <FR label="Время на 1 фото" hint="минут" tip={T.photo_m}><NI value={pMin} onChange={setPMin} step={0.5} min={0.5} width={90}/></FR>
              <FR label="Коэф. совпадений групп. фото" hint="% (для фото с 2–4 и 5–7 чел. в кадре)" tip={T.coeff}><NI value={coeff} onChange={setCoeff} step={5} min={0} max={100} suffix="%" width={90}/></FR>
            </Card>

            {/* Логистика */}
            <Card style={{marginBottom:14}}>
              <SecTitle icon="🚚">Логистика и типография</SecTitle>
              <FR label="Доставка оборудования до места съёмки" hint={`${sym}/проект`} tip={T.log_eq}><NI value={lEq} onChange={setLEq} step={500} suffix={sym} width={135}/></FR>
              <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
                <div style={{fontSize:13,color:C.text,marginBottom:8,display:"flex",alignItems:"center"}} className="pm">
                  <TT text={T.print}>Цена печати в типографии ({sym}/альбом)</TT>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:7}}>
                  {[3,4,5,6].map(r=>(
                    <div key={r}>
                      <div style={{fontSize:11,color:C.dim,marginBottom:3,textAlign:"center"}}>{r} разв.</div>
                      <input type="number" value={pp[r]} min={0} step={50}
                        onChange={e=>setPP(p=>({...p,[r]:Number(e.target.value)}))}
                        style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,padding:"5px 4px",textAlign:"center",outline:"none",fontFamily:"'Rubik',sans-serif"}}/>
                    </div>
                  ))}
                </div>
              </div>
              <FR label="Доставка альбомов из типографии" hint={`${sym}/проект`} tip={T.log_typo}><NI value={lTypo} onChange={setLTypo} step={100} suffix={sym} width={135}/></FR>
              <FR label="Упаковка и доставка альбомов заказчику" hint={`${sym}/проект`} tip={T.log_alb}><NI value={lAlb} onChange={setLAlb} step={500} suffix={sym} width={135}/></FR>
            </Card>

            {/* Финансы */}
            <Card>
              <SecTitle icon="💰">Финансы и налоги</SecTitle>
              <FR label="Налог на доход" hint="% от выручки"><NI value={taxRate} onChange={setTax} step={1} min={0} max={50} suffix="%" width={90}/></FR>
              <FR label="Целевая маржинальность" hint="доля прибыли в цене" tip={T.margin}><NI value={markup} onChange={setMarkup} step={1} min={1} max={99} suffix="%" width={90}/></FR>
              <FR label="Скидка заказчику" tip={T.disc}><NI value={disc} onChange={setDisc} step={1} min={0} max={50} suffix="%" width={90}/></FR>
              <FR label="Подключён эквайринг?"><Tog value={hasAcq} onChange={setHasAcq}/></FR>
              {hasAcq && <FR label="Комиссия эквайринга" hint="%"><NI value={acqPct} onChange={setAcqPct} step={0.5} suffix="%" width={90}/></FR>}
              <FR label="Платёжные сервисы?" tip={T.pay_svc}><Tog value={hasPay} onChange={setHasPay}/></FR>
              {hasPay && <FR label="Комиссия платёжных сервисов" hint="%" tip={T.pay_pct} tip={T.pay_pct}><NI value={payPct} onChange={setPayPct} step={0.5} suffix="%" width={90}/></FR>}
            </Card>
          </div>

          {/* ═══ RIGHT ═══ */}
          <div className="right-panel">

            {/* Параметры проекта */}
            <Card style={{marginBottom:14}}>
              <SecTitle icon="🎓">Параметры проекта</SecTitle>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}} className="two-col">
                <div>
                  <FR label="Новый дизайн с нуля?" tip={T.new_des} tip={T.new_des}><Tog value={newDes} onChange={setNewDes}/></FR>
                  <FR label="Тип обложки" tip={T.cover}>
                    <Chips value={cover} onChange={setCover} options={[{v:"individual",l:"Инд."},{v:"common",l:"Общая"}]}/>
                  </FR>
                </div>
                <div>
                  <div style={{fontSize:12,color:C.c1,fontWeight:500,marginBottom:8}}><TT text={T.teachers}>🎁 Подарочные альбомы педагогам</TT></div>
                  <FR label="Кол-во педагогов"><NI value={tCnt} onChange={setTCnt} min={0} width={70}/></FR>
                  <FR label="Разворотов в альбоме">
                    <Chips value={tRevs} onChange={setTRevs} options={[3,4].map(v=>({v,l:String(v)}))}/>
                  </FR>
                  <FR label="Портретных фото педагога для ретуши" hint="шт. на педагога" tip={T.teacher_ret} tip={T.teacher_ret}>
                    <NI value={tRetPhotos} onChange={setTRetPhotos} min={0} step={1} width={70}/>
                  </FR>
                </div>
              </div>
            </Card>

            {/* Состав тарифов */}
            <Card style={{marginBottom:14}}>
              <SecTitle icon="📋">Состав тарифов</SecTitle>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr>
                      <th className="sticky-col" style={{textAlign:"left",padding:"5px 8px",color:C.muted,fontWeight:400,borderBottom:`1px solid ${C.border}`,background:C.card}}>Параметр</th>
                      {tariffs.map((t,i)=>(
                        <th key={i} style={{padding:"5px 8px",color:C.c1,fontWeight:500,borderBottom:`1px solid ${C.border}`,textAlign:"center",minWidth:78}}>{t.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="sticky-col" style={{padding:"4px 8px",color:C.muted,borderBottom:`1px solid ${C.border}33`,minWidth:130,background:C.card}}>Разворотов всего</td>
                      {tariffs.map((t,i)=>(
                        <td key={i} style={{padding:"3px 5px",textAlign:"center",borderBottom:`1px solid ${C.border}33`}}>
                          <input type="number" value={t.rev_all} min={1}
                            onChange={e=>updT(i,"rev_all",e.target.value)}
                            style={{width:52,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,padding:"4px 5px",textAlign:"center",outline:"none",fontFamily:"'Rubik',sans-serif"}}/>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="sticky-col" style={{padding:"4px 8px",color:C.muted,borderBottom:`1px solid ${C.border}33`,minWidth:130,background:C.card}}>
                        <TT text={T.rev_ind}>Инд. разворотов</TT>
                      </td>
                      {tariffs.map((t,i)=>(
                        <td key={i} style={{padding:"3px 5px",textAlign:"center",borderBottom:`1px solid ${C.border}33`}}>
                          <input type="number" value={t.rev_ind} min={0}
                            onChange={e=>updT(i,"rev_ind",e.target.value)}
                            style={{width:52,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,padding:"4px 5px",textAlign:"center",outline:"none",fontFamily:"'Rubik',sans-serif"}}/>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* Subheader between two table sections */}
              <div style={{padding:"6px 8px 4px",fontSize:11,color:C.c2,fontWeight:500,borderBottom:`1px solid ${C.border}`,background:C.card,marginTop:0}}>
                <TT text={T.tariff_photos}>Количество фотографий, включённых в тариф</TT>
                <div style={{color:C.dim,fontSize:10,marginTop:2}}>ретушь вкл/выкл</div>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr>
                      <th className="sticky-col" style={{padding:"5px 8px",background:C.card,borderBottom:`1px solid ${C.border}`}}></th>
                      {tariffs.map((t,i)=>(
                        <th key={i} style={{padding:"5px 8px",color:C.c1,fontWeight:500,borderBottom:`1px solid ${C.border}`,textAlign:"center",minWidth:78}}>{t.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PHOTO_ROWS.map(row=>(
                      <tr key={row.key}>
                        <td className="sticky-col" style={{padding:"4px 8px",color:C.muted,borderBottom:`1px solid ${C.border}33`,minWidth:130,background:C.card}}>
                          <div>{row.label}</div>
                          <div style={{fontSize:10,color:C.dim}}>{row.retLbl}</div>
                        </td>
                        {tariffs.map((t,i)=>(
                          <td key={i} style={{padding:"3px 5px",textAlign:"center",borderBottom:`1px solid ${C.border}33`}}>
                            <input type="number" value={t[row.key]||0} min={0}
                              onChange={e=>updT(i,row.key,e.target.value)}
                              style={{width:44,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,padding:"3px 4px",textAlign:"center",outline:"none",fontFamily:"'Rubik',sans-serif",display:"block",margin:"0 auto 4px"}}/>
                            <button
                              onClick={()=>updT(i,row.retKey,!t[row.retKey])}
                              title={t[row.retKey]?"Ретушь включена":"Ретушь не включена"}
                              style={{
                                width:44,height:20,borderRadius:10,border:"none",cursor:"pointer",
                                background:t[row.retKey]?GRAD:C.border,
                                position:"relative",transition:"background .2s",display:"block",margin:"0 auto",
                              }}>
                              <div style={{
                                width:14,height:14,borderRadius:"50%",background:"#fff",
                                position:"absolute",top:3,
                                left:t[row.retKey]?27:3,transition:"left .2s",
                              }}/>
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{fontSize:11,color:C.dim,marginTop:8}}>
                Тумблер под количеством фото — включает детальную ретушь этого типа в себестоимость тарифа
              </div>
            </Card>

            {/* Заказ */}
            <Card style={{marginBottom:14}}>
              <SecTitle icon="🎒" tip="Укажи количество альбомов в каждом тарифе, которое нужно включить в расчёт">Количество альбомов</SecTitle>
              <div className="tariff-qty" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                {tariffs.map((t,i)=>(
                  <div key={i} style={{textAlign:"center"}}>
                    <div style={{fontSize:12,color:C.c1,marginBottom:6,fontWeight:500}}>{t.name}</div>
                    <input type="number" value={qtys[i]} min={0}
                      onChange={e=>updQ(i,Number(e.target.value))}
                      style={{width:"100%",textAlign:"center",background:C.surface,
                        border:`1px solid ${qtys[i]>0?C.c1+"55":C.border}`,
                        borderRadius:8,color:C.text,fontSize:18,fontWeight:700,
                        padding:"10px 4px",outline:"none",fontFamily:"'Rubik',sans-serif"}}/>
                    {calc&&qtys[i]>0&&<div style={{fontSize:11,color:C.muted,marginTop:3}}>{pct(qtys[i]/total)}</div>}
                  </div>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:12,padding:"8px 0",borderTop:`1px solid ${C.border}`}}>
                <span style={{fontSize:13,color:C.muted}}>Итого альбомов</span>
                <span style={{fontSize:16,fontWeight:700}}>{total}</span>
              </div>
              {calc && (
                <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderTop:`1px solid ${C.border}44`}}>
                  <span style={{fontSize:12,color:C.muted}}>⏱ Расчётное время съёмки</span>
                  <strong style={{fontSize:12,color:C.text}}>{calc.shootHrs.toFixed(1)} ч</strong>
                </div>
              )}
            </Card>

            {/* ─── Результаты ─── */}
            {calc ? (<>
              <Card style={{marginBottom:14}}>
                <SecTitle icon="📊">Себестоимость и цены по тарифам</SecTitle>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead>
                      <tr>
                        <th className="sticky-col" style={{textAlign:"left",padding:"6px 10px",color:C.muted,fontWeight:400,borderBottom:`1px solid ${C.border}`,background:C.card}}>Показатель</th>
                        {tariffs.map((t,i)=>(
                          <th key={i} style={{padding:"6px 10px",color:qtys[i]>0?C.c1:C.dim,fontWeight:500,borderBottom:`1px solid ${C.border}`,textAlign:"right"}}>
                            {t.name}{qtys[i]>0?` ×${qtys[i]}`:""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {label:"Переменные затраты / альбом",         vals:calc.vC.map(v=>fmt(v.tot,sym)), muted:true},
                        {label:"Фиксированные затраты / альбом",          vals:tariffs.map(()=>fmt(calc.fPA,sym)), muted:true},
                        {label:<TT text={T.full_cost}>Полная себестоимость 1 альбома</TT>, vals:calc.fC.map(c=>fmt(c,sym)), bold:true},
                        {label:"Рекомендованная цена 1 альбома",  vals:calc.pR.map(p=>fmt(p,sym)), accent:true},
                        {label:`Цена со скидкой${disc>0?" "+disc+"%":""}`, vals:calc.pD.map(p=>fmt(p,sym))},
                        {label:"Маржинальность 1 альбома (план)", vals:calc.prA.map(p=>fmt(p,sym))},
                        {label:"Маржинальность 1 альбома (факт)", vals:calc.prAD.map(p=>fmt(p,sym))},
                      ].map((row,ri)=>(
                        <tr key={ri} style={{background:row.accent?`${C.c1}08`:""}}>
                          <td className={`sticky-col pm`} style={{padding:"6px 10px",color:row.accent?C.c1:row.bold?C.text:C.muted,fontWeight:row.bold||row.accent?600:400,borderBottom:`1px solid ${C.border}22`,background:row.accent?"#0D1A18":C.card}}><TT text={row.tip}>{row.label}</TT></td>
                          {row.vals.map((v,i)=>(
                            <td key={i} align="right" style={{padding:"6px 10px",color:row.accent?C.c1:row.muted?C.muted:C.text,fontWeight:row.bold||row.accent?600:400,borderBottom:`1px solid ${C.border}22`,opacity:qtys[i]===0?.4:1}} className={row.accent?"pa":"pm"}>{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}} className="two-col">
                <Card>
                  <SecTitle icon="💼">Итоги проекта</SecTitle>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 90px 90px",gap:"0 8px",marginBottom:2}}>
                    <div/>
                    <div style={{fontSize:11,color:C.dim,textAlign:"right"}}>без скидки</div>
                    <div style={{fontSize:11,color:C.c1,textAlign:"right"}}>со скидкой</div>
                  </div>
                  {[
                    {label:"Выручка",       a:fmt(calc.revP,sym), b:fmt(calc.revF,sym)},
                    {label:"Себестоимость", a:fmt(calc.totC,sym), b:fmt(calc.totC,sym)},
                  ].map(r=>(
                    <div key={r.label} style={{display:"grid",gridTemplateColumns:"1fr 90px 90px",gap:"0 8px",padding:"6px 0",borderBottom:`1px solid ${C.border}44`,alignItems:"center"}}>
                      <span style={{fontSize:13,color:C.muted}} className="pm">{r.label}</span>
                      <span style={{fontSize:13,textAlign:"right"}} className="pm">{r.a}</span>
                      <span style={{fontSize:13,textAlign:"right",color:C.c1}} className="pa">{r.b}</span>
                    </div>
                  ))}
                  <div style={{marginTop:6}}>
                    <RR label="Налог на доход" val={fmt(calc.tax,sym)} muted/>
                    {hasAcq && <RR label="Эквайринг" val={fmt(calc.acq,sym)} muted/>}
                    {hasPay && <RR label="Платёжные сервисы" val={fmt(calc.pay,sym)} muted/>}
                  </div>
                  <div style={{marginTop:6,paddingTop:6,borderTop:`1px solid ${C.border}44`}}>
                    <RR label={<TT text={T.total_proj}>Итого затраты и налоги</TT>} val={fmt(calc.totC+calc.rEx,sym)} muted/>
                  </div>
                  <div style={{marginTop:4,paddingTop:8,borderTop:`1px solid ${C.c1}33`}}>
                    <RR label="Чистая прибыль" val={fmt(calc.np,sym)} accent large tip="Не путай это с твоим личным доходом. Используй эту сумму на развитие своего фотобизнеса и привлечение новых заказов. Ниже приведены рекомендации по использованию прибыли. А твой личный доход рассчитан в блоке «Распределение затрат»."/>
                    <RR label="Маржинальность проекта" val={pct(calc.mg)} accent/>
                  </div>
                  <div style={{
                    background:`${C.c1}0E`,border:`1px solid ${C.c1}30`,
                    borderRadius:10,padding:"11px 14px",fontSize:12,color:C.c1,lineHeight:1.7,marginTop:12,
                  }}>
                    <strong>Позаботься о будущих заказах —<br/>отложи из прибыли:</strong>
                    <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
                      {[
                        {icon:"🛡",label:"Подушка безопасности", sub:"10% от прибыли", val:calc.res},
                        {icon:"📣",label:"Маркетинг",            sub:"34% от прибыли", val:calc.mkt},
                        {icon:"📷",label:"На технику",           sub:"15% от прибыли", val:calc.equip},
                        {icon:"📚",label:"На обучение",          sub:"15% от прибыли", val:calc.edu},
                      ].map(({icon,label,sub,val})=>(
                        <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                          <div>
                            <div>{icon} {label}</div>
                            <div style={{fontSize:10,opacity:.7}}>{sub}</div>
                          </div>
                          <strong style={{whiteSpace:"nowrap",marginLeft:8}}>{fmt(val,sym)}</strong>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:10,paddingTop:8,borderTop:`1px solid ${C.c1}33`,fontSize:12,fontStyle:"italic",opacity:.85}}>
                      Остальное отложи на отпуск и реализацию своих творческих идей 🎨
                    </div>
                  </div>
                </Card>

                <Card>
                  <SecTitle icon="🤝">Распределение затрат</SecTitle>

                  {/* Часть 1: Доходы команды */}
                  {(hasMgr || hasRet || hasDes) && <>
                    <div style={{fontSize:12,fontWeight:600,color:C.c1,marginBottom:4,marginTop:2}}>Доходы команды</div>
                    {hasMgr && <RR label="Клиентский менеджер" val={fmt(calc.pyMg,sym)}/>}
                    {hasRet && <RR label="Ретушёр (базовая + детальная обработка)" val={fmt(calc.pyRe,sym)}/>}
                    {hasDes && <RR label="Дизайнер (вёрстка + наполнение макетов)" val={fmt(calc.pyDe,sym)}/>}
                  </>}

                  {/* Часть 2: Мой личный доход */}
                  <div style={{fontSize:12,fontWeight:600,color:C.c1,marginBottom:4,marginTop:10}}>Мой личный доход</div>
                  <RR label="За съёмку" val={fmt(calc.pyPh,sym)}/>
                  {!hasMgr && <RR label="За коммуникацию с заказчиком" val={fmt(calc.pyMg,sym)}/>}
                  {!hasRet && <RR label="За обработку фотографий" val={fmt(calc.pyRe,sym)}/>}
                  {!hasDes && <RR label="За вёрстку альбомов" val={fmt(calc.pyDe,sym)}/>}
                  <div style={{marginTop:4,paddingTop:6,borderTop:`1px solid ${C.border}44`}}>
                    <RR label="Итого мой доход"
                      val={fmt(calc.pyPh + (!hasMgr?calc.pyMg:0) + (!hasRet?calc.pyRe:0) + (!hasDes?calc.pyDe:0), sym)}
                      accent tip="Эту сумму ты можешь потратить на жизнь."/>
                  </div>

                  {/* Часть 3: Расходы на печать и логистику */}
                  <div style={{fontSize:12,fontWeight:600,color:C.c1,marginBottom:4,marginTop:10}}>Расходы на печать и логистику</div>
                  <RR label="Доставка оборудования до места съёмки" val={fmt(calc.pyLE,sym)}/>
                  <RR label="Типография (печать альбомов)" val={fmt(calc.pyTyPrint,sym)}/>
                  <RR label="Доставка альбомов мне из типографии" val={fmt(calc.lTypo,sym)}/>
                  <RR label="Доставка альбомов от меня заказчику" val={fmt(calc.pyLA,sym)}/>
                  <div style={{marginTop:4,paddingTop:6,borderTop:`1px solid ${C.border}44`}}>
                    <RR label="Итого печать и логистика"
                      val={fmt(calc.pyLE+calc.pyTy+calc.pyLA,sym)} accent/>
                  </div>

                </Card>
              </div>

              <div style={{textAlign:"center"}} className="np">
                <button onClick={()=>window.print()} style={{
                  padding:"12px 36px",background:GRAD,border:"none",borderRadius:10,
                  color:C.bg,fontSize:14,fontWeight:700,fontFamily:"'Rubik',sans-serif",
                  cursor:"pointer",letterSpacing:".04em",
                }}>📥 Скачать PDF</button>
                <div style={{fontSize:11,color:C.dim,marginTop:5}}>
                  Браузер откроет диалог печати → выбери «Сохранить как PDF»
                </div>
              </div>
            </>) : (
              <Card>
                <div style={{textAlign:"center",padding:"36px 0",color:C.dim}}>
                  <img src="/logo.png" alt="ФотоДзен" style={{width:48,height:48,borderRadius:12,objectFit:"contain"}}/><br/><br/>
                  <div style={{fontSize:14}}>Укажи количество альбомов по тарифам — и увидишь полный расчёт</div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
