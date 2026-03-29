import { useState, useEffect, useRef } from "react";

const CAT_GASTO = ["Necesidades básicas","Transporte","Gasto extra","Gasto hormiga","Gastos fijos","Cuidado personal"];
const CAT_INGRESO = ["Sueldo","Freelance","Inversión","Regalo","Bono","Otro"];
const CAT_INV = ["Plazo fijo","Acciones","Cripto","FCI","Dólares","Inmueble","Otro"];
const CAT_AHORRO = ["Ahorro general","Fondo de emergencia","Vacaciones","Tecnología","Ropa","Otro"];
const MONEDAS = ["ARS","USD"];
const TABS = ["Inicio","Ingresos","Gastos","Ahorro","Proyectos","Inversiones","Reportes","Config"];
const ICONS = {Inicio:"◉",Ingresos:"↑",Gastos:"↓",Ahorro:"♦",Proyectos:"★",Inversiones:"▲",Reportes:"≡",Config:"⚙"};
const COLORS = ["#6c8ef7","#f7704f","#4fbe8a","#f7c44f","#a77cf7","#f74f9e","#4fd4f7","#50e3c2","#ff6b6b"];
const CAT_COLORS = {"Necesidades básicas":"#6c8ef7","Transporte":"#f7704f","Gasto extra":"#f74f9e","Gasto hormiga":"#f7c44f","Gastos fijos":"#a77cf7","Cuidado personal":"#4fbe8a"};

const fmtARS = n => new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n||0);
const fmtUSD = n => new Intl.NumberFormat("es-AR",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(n||0);
const fmt = (n,m) => m==="USD" ? fmtUSD(n) : fmtARS(n);
const fmtShort = (n,m="ARS") => {
  if(!n) return m==="USD"?"US$0":"$0";
  const s = m==="USD"?"US$":"$";
  if(Math.abs(n)>=1000000) return `${s}${(n/1000000).toFixed(1)}M`;
  if(Math.abs(n)>=1000) return `${s}${(n/1000).toFixed(0)}K`;
  return fmt(n,m);
};
const today = () => new Date().toISOString().split("T")[0];
const thisMonth = () => new Date().toISOString().slice(0,7);
const thisWeek = () => { const d=new Date(); d.setDate(d.getDate()-d.getDay()); return d.toISOString().split("T")[0]; };
const thisYear = () => new Date().getFullYear().toString();

const D = {
  bg:"#0f0f13", surface:"#1a1a24", surface2:"#22223a", border:"#2a2a40",
  text:"#f0f0ff", textMuted:"#7878a0", accent:"#6c8ef7", green:"#4fbe8a",
  red:"#f7704f", yellow:"#f7c44f", purple:"#a77cf7",
};
const isDesktop = () => window.innerWidth >= 768;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${D.bg}; color: ${D.text}; font-family: 'Inter', sans-serif; }
  input, select, textarea { font-family:'Inter',sans-serif; font-size:15px; background:${D.surface2}; color:${D.text}; border:1px solid ${D.border}; border-radius:10px; padding:11px 14px; outline:none; width:100%; transition:border-color .2s; }
  input:focus, select:focus { border-color:${D.accent}; }
  select option { background:${D.surface2}; }
  button { font-family:'Inter',sans-serif; cursor:pointer; }
  .slide-in { animation: slideIn .25s ease; }
  @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @media (min-width: 768px) {
    .app-container { max-width: 900px !important; }
    .desktop-grid { display: grid !important; grid-template-columns: 340px 1fr; gap: 24px; align-items: start; }
    .desktop-hide { display: none !important; }
    .desktop-list { font-size: 14px; }
  }
`;

async function notionCall(token,method,path,body){
  const res=await fetch(`/api/notion?path=${path}`,{method,headers:{"Authorization":`Bearer ${token}`,"Notion-Version":"2022-06-28","Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});
  return res.json();
}

function PieChart({data}){
  const ref=useRef();
  useEffect(()=>{
    if(!ref.current||!data?.length||!window.Chart) return;
    if(ref.current._chart) ref.current._chart.destroy();
    ref.current._chart=new window.Chart(ref.current.getContext("2d"),{
      type:"doughnut",
      data:{labels:data.map(d=>d.label),datasets:[{data:data.map(d=>d.value),backgroundColor:data.map((d,i)=>d.color||COLORS[i%COLORS.length]),borderWidth:0,hoverOffset:6}]},
      options:{responsive:false,cutout:"68%",plugins:{legend:{display:false},tooltip:{callbacks:{label:i=>`${i.label}: ${fmtARS(i.raw)}`},backgroundColor:D.surface2,titleColor:D.text,bodyColor:D.textMuted,borderColor:D.border,borderWidth:1}}}
    });
  },[data]);
  if(!data?.length) return <p style={{color:D.textMuted,fontSize:13,textAlign:"center",padding:"1rem"}}>Sin datos</p>;
  const total=data.reduce((s,d)=>s+d.value,0);
  return(
    <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap",padding:"4px 0"}}>
      <div style={{position:"relative",width:140,height:140,flexShrink:0}}>
        <canvas ref={ref} width={140} height={140}/>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
          <p style={{fontSize:10,color:D.textMuted,margin:0}}>Total</p>
          <p style={{fontSize:13,fontWeight:600,color:D.text,margin:0}}>{fmtShort(total)}</p>
        </div>
      </div>
      <div style={{flex:1,minWidth:140}}>
        {data.map((d,i)=>(
          <div key={d.label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
            <span style={{width:8,height:8,borderRadius:2,background:d.color||COLORS[i%COLORS.length],flexShrink:0,display:"inline-block"}}/>
            <span style={{flex:1,fontSize:12,color:D.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.label}</span>
            <span style={{fontSize:12,fontWeight:500,color:D.text}}>{Math.round(d.value/total*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({data,color=D.accent,moneda="ARS"}){
  const ref=useRef();
  useEffect(()=>{
    if(!ref.current||!data?.length||!window.Chart) return;
    if(ref.current._chart) ref.current._chart.destroy();
    ref.current._chart=new window.Chart(ref.current.getContext("2d"),{
      type:"bar",
      data:{labels:data.map(d=>d.label),datasets:[{data:data.map(d=>d.value),backgroundColor:color+"99",borderRadius:8,borderSkipped:false}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:i=>fmt(i.raw,moneda)},backgroundColor:D.surface2,titleColor:D.text,bodyColor:D.textMuted,borderColor:D.border,borderWidth:1}},scales:{y:{ticks:{callback:v=>fmtShort(v,moneda),color:D.textMuted,font:{size:10}},grid:{color:D.border+"55"},border:{display:false}},x:{grid:{display:false},ticks:{color:D.textMuted,font:{size:10},autoSkip:false,maxRotation:45},border:{display:false}}}}
    });
  },[data]);
  if(!data?.length) return <p style={{color:D.textMuted,fontSize:13,textAlign:"center",padding:"1rem"}}>Sin datos</p>;
  return <div style={{position:"relative",height:180}}><canvas ref={ref}/></div>;
}

function LineChart({data,color=D.accent,moneda="ARS"}){
  const ref=useRef();
  useEffect(()=>{
    if(!ref.current||!data?.length||!window.Chart) return;
    if(ref.current._chart) ref.current._chart.destroy();
    ref.current._chart=new window.Chart(ref.current.getContext("2d"),{
      type:"line",
      data:{labels:data.map(d=>d.label),datasets:[{data:data.map(d=>d.value),borderColor:color,backgroundColor:color+"22",tension:0.4,fill:true,pointRadius:5,pointBackgroundColor:color,pointBorderColor:D.bg,pointBorderWidth:2}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:i=>fmt(i.raw,moneda)},backgroundColor:D.surface2,titleColor:D.text,bodyColor:D.textMuted,borderColor:D.border,borderWidth:1}},scales:{y:{ticks:{callback:v=>fmtShort(v,moneda),color:D.textMuted,font:{size:10}},grid:{color:D.border+"55"},border:{display:false}},x:{grid:{display:false},ticks:{color:D.textMuted,font:{size:10}},border:{display:false}}}}
    });
  },[data]);
  if(!data?.length) return <p style={{color:D.textMuted,fontSize:13,textAlign:"center",padding:"1rem"}}>Sin datos</p>;
  return <div style={{position:"relative",height:180}}><canvas ref={ref}/></div>;
}

function SwipeRow({record,type,onEdit,onDelete,color}){
  const [offset,setOffset]=useState(0);
  const [desktop,setDesktop]=useState(isDesktop());
  const startX=useRef(null);
  const isDragging=useRef(false);

  useEffect(()=>{
    const handler=()=>setDesktop(isDesktop());
    window.addEventListener("resize",handler);
    return()=>window.removeEventListener("resize",handler);
  },[]);

  const onTouchStart=e=>{ startX.current=e.touches[0].clientX; isDragging.current=false; };
  const onTouchMove=e=>{
    if(startX.current===null) return;
    const dx=e.touches[0].clientX-startX.current;
    if(Math.abs(dx)>8) isDragging.current=true;
    if(dx<0) setOffset(Math.max(dx,-130));
    else if(offset<0) setOffset(Math.min(0,offset+(dx*0.3)));
  };
  const onTouchEnd=()=>{ if(offset<-50) setOffset(-130); else setOffset(0); startX.current=null; };

  if(desktop) return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${D.border}33`}}>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:14,fontWeight:500,margin:"0 0 4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{record.titulo}</p>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {(record.categoria||record.tipo)&&<span style={{fontSize:11,background:(color||D.accent)+"22",color:color||D.accent,padding:"2px 8px",borderRadius:20,fontWeight:500}}>{record.categoria||record.tipo}</span>}
          <span style={{fontSize:12,color:D.textMuted}}>{record.persona?`${record.persona} · `:""}{record.fecha}</span>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:16}}>
        <span style={{fontWeight:600,color:color||D.accent,whiteSpace:"nowrap",fontSize:15}}>{fmt(record.monto||record.acumulado,record.moneda)}</span>
        <button onClick={()=>onEdit(record,type)} title="Editar" style={{background:D.accent+"22",border:`1px solid ${D.accent}44`,borderRadius:8,padding:"6px 10px",color:D.accent,fontSize:13,fontWeight:500}}>✏️ Editar</button>
        <button onClick={()=>onDelete(record.id)} title="Eliminar" style={{background:D.red+"22",border:`1px solid ${D.red}44`,borderRadius:8,padding:"6px 10px",color:D.red,fontSize:13,fontWeight:500}}>🗑️ Borrar</button>
      </div>
    </div>
  );

  return(
    <div style={{position:"relative",overflow:"hidden",borderBottom:`1px solid ${D.border}33`}}>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:130,display:"flex"}}>
        <button onTouchEnd={e=>{e.preventDefault();e.stopPropagation();setOffset(0);onEdit(record,type);}} onClick={()=>{setOffset(0);onEdit(record,type);}} style={{flex:1,background:"#2471a322",color:"#6cb8f7",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3}}><span style={{fontSize:18}}>✏️</span><span>Editar</span></button>
        <button onTouchEnd={e=>{e.preventDefault();e.stopPropagation();setOffset(0);onDelete(record.id);}} onClick={()=>{setOffset(0);onDelete(record.id);}} style={{flex:1,background:D.red+"22",color:D.red,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3}}><span style={{fontSize:18}}>🗑️</span><span>Borrar</span></button>
      </div>
      <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{transform:`translateX(${offset}px)`,transition:startX.current===null?"transform .25s ease":"none",background:D.bg,padding:"12px 0",cursor:"pointer"}} onClick={()=>{ if(isDragging.current) return; if(offset!==0) setOffset(0); }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:14,fontWeight:500,margin:"0 0 4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{record.titulo}</p>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              {(record.categoria||record.tipo)&&<span style={{fontSize:11,background:(color||D.accent)+"22",color:color||D.accent,padding:"2px 8px",borderRadius:20,fontWeight:500}}>{record.categoria||record.tipo}</span>}
              <span style={{fontSize:11,color:D.textMuted}}>{record.persona?`${record.persona} · `:""}{record.fecha}</span>
            </div>
          </div>
          <span style={{fontWeight:600,color:color||D.accent,marginLeft:12,whiteSpace:"nowrap",fontSize:15}}>{fmt(record.monto||record.acumulado,record.moneda)}</span>
        </div>
        {offset===0&&<p style={{fontSize:10,color:D.border,margin:"3px 0 0",textAlign:"right"}}>← deslizá para editar</p>}
      </div>
    </div>
  );
}

function EditModal({record,type,onSave,onClose}){
  const [d,setD]=useState({...record});
  const upd=(k,v)=>setD(p=>({...p,[k]:v}));
  const catMap={ingresos:CAT_INGRESO,gastos:CAT_GASTO,ahorros:CAT_AHORRO,inversiones:CAT_INV};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:300,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:D.surface,borderRadius:"20px 20px 0 0",padding:"20px 16px 36px",width:"100%",border:`1px solid ${D.border}`,maxHeight:"90vh",overflowY:"auto"}} className="slide-in">
        <div style={{width:40,height:4,background:D.border,borderRadius:4,margin:"0 auto 16px"}}/>
        <p style={{fontWeight:700,fontSize:16,marginBottom:16}}>Editar registro</p>
        {[{id:"titulo",label:"Descripción",type:"text"},{id:"monto",label:"Monto",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"categoria",label:"Categoría",options:catMap[type]||[]},{id:"persona",label:"¿Quién?",type:"text"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota",type:"text"}].map(f=>(
          <div key={f.id} style={{marginBottom:10}}>
            <label style={{display:"block",fontSize:11,color:D.textMuted,marginBottom:4,fontWeight:500,textTransform:"uppercase",letterSpacing:.3}}>{f.label}</label>
            {f.options?(
              <select value={d[f.id]||""} onChange={e=>upd(f.id,e.target.value)}>
                {f.options.map(o=><option key={o}>{o}</option>)}
              </select>
            ):(
              <input type={f.type||"text"} value={d[f.id]||""} onChange={e=>upd(f.id,e.target.value)}/>
            )}
          </div>
        ))}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
          <button onClick={onClose} style={{padding:"13px",borderRadius:12,border:`1px solid ${D.border}`,background:D.surface2,color:D.textMuted,fontSize:14,fontWeight:500}}>Cancelar</button>
          <button onClick={()=>onSave(d)} style={{padding:"13px",borderRadius:12,border:"none",background:D.accent,color:"#fff",fontSize:14,fontWeight:600}}>Guardar ↗</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({message,onConfirm,onCancel}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}} onClick={onCancel}>
      <div onClick={e=>e.stopPropagation()} style={{background:D.surface,borderRadius:16,padding:"24px",width:"100%",maxWidth:320,border:`1px solid ${D.border}`}} className="slide-in">
        <p style={{fontSize:16,fontWeight:600,marginBottom:8}}>¿Eliminar registro?</p>
        <p style={{fontSize:13,color:D.textMuted,marginBottom:20}}>{message}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <button onClick={onCancel} style={{padding:"12px",borderRadius:10,border:`1px solid ${D.border}`,background:D.surface2,color:D.textMuted,fontSize:14,fontWeight:500}}>Cancelar</button>
          <button onClick={onConfirm} style={{padding:"12px",borderRadius:10,border:"none",background:D.red,color:"#fff",fontSize:14,fontWeight:600}}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

function CatAccordion({title,color,items,type,onEdit,onDelete}){
  const [open,setOpen]=useState(false);
  const total=items.reduce((s,r)=>s+r.monto,0);
  if(!items.length) return null;
  return(
    <div style={{background:D.surface,borderRadius:12,marginBottom:8,border:`1px solid ${D.border}`,overflow:"hidden"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",padding:"12px 14px",cursor:"pointer",gap:10}}>
        <span style={{width:10,height:10,borderRadius:3,background:color,flexShrink:0,display:"inline-block"}}/>
        <span style={{flex:1,fontSize:14,fontWeight:500}}>{title}</span>
        <span style={{fontSize:13,fontWeight:600,color}}>{fmtShort(total)}</span>
        <span style={{fontSize:11,color:D.textMuted,marginLeft:4}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<div style={{borderTop:`1px solid ${D.border}`,padding:"0 14px"}}>
        {items.map(r=>(
          <SwipeRow key={r.id} record={r} type={type} onEdit={onEdit} onDelete={onDelete} color={color}/>
        ))}
      </div>}
    </div>
  );
}

function QuickAdd({onSave,onClose,userName}){
  const [type,setType]=useState("gastos");
  const [d,setD]=useState({fecha:today(),persona:userName,moneda:"ARS"});
  const upd=(k,v)=>setD(p=>({...p,[k]:v}));
  const cats={ingresos:CAT_INGRESO,gastos:CAT_GASTO,ahorros:CAT_AHORRO,inversiones:CAT_INV};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:150,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:D.surface,borderRadius:"20px 20px 0 0",padding:"20px 16px 36px",width:"100%",border:`1px solid ${D.border}`}} className="slide-in">
        <div style={{width:40,height:4,background:D.border,borderRadius:4,margin:"0 auto 16px"}}/>
        <p style={{fontWeight:600,fontSize:16,marginBottom:14}}>Carga rápida</p>
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {["gastos","ingresos","ahorros"].map(t=>(
            <button key={t} onClick={()=>setType(t)} style={{flex:1,padding:"8px",borderRadius:10,border:`1px solid ${type===t?D.accent:D.border}`,background:type===t?D.accent+"22":D.surface2,color:type===t?D.accent:D.textMuted,fontSize:12,fontWeight:500}}>
              {t==="gastos"?"↓ Gasto":t==="ingresos"?"↑ Ingreso":"♦ Ahorro"}
            </button>
          ))}
        </div>
        <input placeholder="Descripción" value={d.titulo||""} onChange={e=>upd("titulo",e.target.value)} style={{marginBottom:10}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <input type="number" placeholder="Monto" value={d.monto||""} onChange={e=>upd("monto",e.target.value)}/>
          <select value={d.moneda} onChange={e=>upd("moneda",e.target.value)}>
            {MONEDAS.map(m=><option key={m}>{m}</option>)}
          </select>
        </div>
        <select value={d.categoria||""} onChange={e=>upd("categoria",e.target.value)} style={{marginBottom:14}}>
          <option value="">Categoría...</option>
          {(cats[type]||[]).map(c=><option key={c}>{c}</option>)}
        </select>
        <button onClick={()=>{onSave(type,d);onClose();}} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:D.accent,color:"#fff",fontSize:15,fontWeight:600}}>Guardar ↗</button>
      </div>
    </div>
  );
}

export default function App(){
  const [tab,setTab]=useState("Inicio");
  const [token,setToken]=useState(()=>localStorage.getItem("nf_token")||"");
  const [dbIds,setDbIds]=useState(()=>{try{return JSON.parse(localStorage.getItem("nf_dbs")||"{}")}catch{return{}}});
  const [records,setRecords]=useState({ingresos:[],gastos:[],ahorros:[],proyectos:[],inversiones:[]});
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState({text:"",type:""});
  const [setupStep,setSetupStep]=useState(()=>localStorage.getItem("nf_token")&&Object.keys(JSON.parse(localStorage.getItem("nf_dbs")||"{}")).length>0?"ready":"token");
  const [period,setPeriod]=useState("mes");
  const [selectedMonth,setSelectedMonth]=useState(thisMonth());
  const [moneda,setMoneda]=useState("ARS");
  const [userName,setUserName]=useState(()=>localStorage.getItem("nf_user")||"");
  const [chartLoaded,setChartLoaded]=useState(false);
  const [showQuick,setShowQuick]=useState(false);
  const [editRecord,setEditRecord]=useState(null);
  const [editType,setEditType]=useState(null);
  const [deleteId,setDeleteId]=useState(null);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const cfg=params.get("cfg");
    if(cfg){try{const {t,d,u}=JSON.parse(decodeURIComponent(cfg));if(t&&d){localStorage.setItem("nf_token",t);localStorage.setItem("nf_dbs",JSON.stringify(d));if(u) localStorage.setItem("nf_user",u);window.history.replaceState({},"",window.location.pathname);window.location.reload();}}catch(e){}}
    const style=document.createElement("style");style.textContent=css;document.head.appendChild(style);
    if(window.Chart){setChartLoaded(true);return;}
    const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";s.onload=()=>setChartLoaded(true);document.head.appendChild(s);
  },[]);

  const showMsg=(text,type="success")=>{setMsg({text,type});setTimeout(()=>setMsg({text:"",type:""}),3000);};

  const createDatabases=async()=>{
    setLoading(true);showMsg("Conectando con Notion...");
    try{
      const search=await notionCall(token,"POST","search",{filter:{value:"page",property:"object"},page_size:1});
      const parentId=search?.results?.[0]?.id;
      if(!parentId){showMsg("No se encontró ninguna página en Notion.","error");setLoading(false);return;}
      const dbs={};
      const dbDefs=[
        {key:"ingresos",title:"💰 Ingresos",props:{Título:{title:{}},Monto:{number:{format:"number"}},Moneda:{select:{options:MONEDAS.map(n=>({name:n}))}},Categoría:{select:{options:CAT_INGRESO.map(n=>({name:n}))}},Fecha:{date:{}},Persona:{rich_text:{}},Nota:{rich_text:{}}}},
        {key:"gastos",title:"💸 Gastos",props:{Título:{title:{}},Monto:{number:{format:"number"}},Moneda:{select:{options:MONEDAS.map(n=>({name:n}))}},Categoría:{select:{options:CAT_GASTO.map(n=>({name:n}))}},Fecha:{date:{}},Persona:{rich_text:{}},Nota:{rich_text:{}}}},
        {key:"ahorros",title:"🏦 Ahorro",props:{Título:{title:{}},Monto:{number:{}},Moneda:{select:{options:MONEDAS.map(n=>({name:n}))}},Categoría:{select:{options:CAT_AHORRO.map(n=>({name:n}))}},Fecha:{date:{}},Persona:{rich_text:{}},Nota:{rich_text:{}}}},
        {key:"proyectos",title:"🎯 Proyectos",props:{Título:{title:{}},Meta:{number:{}},Acumulado:{number:{}},Moneda:{select:{options:MONEDAS.map(n=>({name:n}))}},Tipo:{select:{options:[{name:"Individual"},{name:"Grupal"}]}},FechaObjetivo:{date:{}},Nota:{rich_text:{}}}},
        {key:"inversiones",title:"📈 Inversiones",props:{Título:{title:{}},Monto:{number:{}},Moneda:{select:{options:MONEDAS.map(n=>({name:n}))}},Tipo:{select:{options:CAT_INV.map(n=>({name:n}))}},Fecha:{date:{}},Proyectado:{number:{}},Persona:{rich_text:{}},Nota:{rich_text:{}}}}
      ];
      for(const db of dbDefs){showMsg(`Creando ${db.title}...`);const res=await notionCall(token,"POST","databases",{parent:{page_id:parentId},title:[{type:"text",text:{content:db.title}}],properties:db.props});if(res?.id) dbs[db.key]=res.id;}
      localStorage.setItem("nf_dbs",JSON.stringify(dbs));localStorage.setItem("nf_token",token);setDbIds(dbs);setSetupStep("ready");showMsg("¡Listo! ✓");loadAll(dbs);
    }catch(e){showMsg("Error al conectar.","error");}
    setLoading(false);
  };

  const loadAll=async(dbs=dbIds)=>{
    if(!token||!dbs?.ingresos) return;
    setLoading(true);
    const keys=["ingresos","gastos","ahorros","proyectos","inversiones"];
    const results={};
    for(const k of keys){
      if(!dbs[k]) continue;
      const r=await notionCall(token,"POST",`databases/${dbs[k]}/query`,{page_size:200,sorts:[{property:"Fecha",direction:"descending"}]});
      results[k]=(r?.results||[]).map(p=>{const pr=p.properties;return{id:p.id,titulo:pr.Título?.title?.[0]?.plain_text||"",monto:pr.Monto?.number||0,meta:pr.Meta?.number||0,acumulado:pr.Acumulado?.number||0,proyectado:pr.Proyectado?.number||0,moneda:pr.Moneda?.select?.name||"ARS",categoria:pr.Categoría?.select?.name||pr.Tipo?.select?.name||"",fecha:pr.Fecha?.date?.start||pr.FechaObjetivo?.date?.start||"",persona:pr.Persona?.rich_text?.[0]?.plain_text||"",tipo:pr.Tipo?.select?.name||"",nota:pr.Nota?.rich_text?.[0]?.plain_text||""};});
    }
    setRecords(r=>({...r,...results}));setLoading(false);
  };

  useEffect(()=>{if(setupStep==="ready") loadAll();},[setupStep]);

  const addRecord=async(type,data)=>{
    if(!dbIds[type]) return;
    setLoading(true);
    const n=v=>v?+v:0;const t=v=>[{type:"text",text:{content:v||""}}];
    const propMap={
      ingresos:{Título:{title:t(data.titulo)},Monto:{number:n(data.monto)},Moneda:{select:{name:data.moneda||"ARS"}},Categoría:{select:{name:data.categoria||"Otro"}},Fecha:{date:{start:data.fecha||today()}},Persona:{rich_text:t(data.persona)},Nota:{rich_text:t(data.nota)}},
      gastos:{Título:{title:t(data.titulo)},Monto:{number:n(data.monto)},Moneda:{select:{name:data.moneda||"ARS"}},Categoría:{select:{name:data.categoria||"Gasto extra"}},Fecha:{date:{start:data.fecha||today()}},Persona:{rich_text:t(data.persona)},Nota:{rich_text:t(data.nota)}},
      ahorros:{Título:{title:t(data.titulo||"Ahorro")},Monto:{number:n(data.monto)},Moneda:{select:{name:data.moneda||"ARS"}},Categoría:{select:{name:data.categoria||"Ahorro general"}},Fecha:{date:{start:data.fecha||today()}},Persona:{rich_text:t(data.persona)},Nota:{rich_text:t(data.nota)}},
      proyectos:{Título:{title:t(data.titulo||"Proyecto")},Meta:{number:n(data.meta)},Acumulado:{number:n(data.acumulado)},Moneda:{select:{name:data.moneda||"ARS"}},Tipo:{select:{name:data.tipo||"Grupal"}},FechaObjetivo:{date:{start:data.fecha||today()}},Nota:{rich_text:t(data.nota)}},
      inversiones:{Título:{title:t(data.titulo)},Monto:{number:n(data.monto)},Moneda:{select:{name:data.moneda||"ARS"}},Tipo:{select:{name:data.tipo||"Otro"}},Fecha:{date:{start:data.fecha||today()}},Proyectado:{number:n(data.proyectado)},Persona:{rich_text:t(data.persona)},Nota:{rich_text:t(data.nota)}}
    };
    const res=await notionCall(token,"POST","pages",{parent:{database_id:dbIds[type]},properties:propMap[type]});
    if(res?.id){showMsg("✓ Guardado");loadAll();}else showMsg("Error al guardar","error");
    setLoading(false);
  };

  const saveEdit=async(data)=>{
    if(!editRecord||!dbIds[editType]) return;
    setLoading(true);
    const n=v=>v?+v:0;const t=v=>[{type:"text",text:{content:v||""}}];
    const propMap={
      ingresos:{Título:{title:t(data.titulo)},Monto:{number:n(data.monto)},Moneda:{select:{name:data.moneda||"ARS"}},Categoría:{select:{name:data.categoria||"Otro"}},Fecha:{date:{start:data.fecha||today()}},Persona:{rich_text:t(data.persona)},Nota:{rich_text:t(data.nota)}},
      gastos:{Título:{title:t(data.titulo)},Monto:{number:n(data.monto)},Moneda:{select:{name:data.moneda||"ARS"}},Categoría:{select:{name:data.categoria||"Gasto extra"}},Fecha:{date:{start:data.fecha||today()}},Persona:{rich_text:t(data.persona)},Nota:{rich_text:t(data.nota)}},
      ahorros:{Título:{title:t(data.titulo)},Monto:{number:n(data.monto)},Moneda:{select:{name:data.moneda||"ARS"}},Categoría:{select:{name:data.categoria||"Ahorro general"}},Fecha:{date:{start:data.fecha||today()}},Persona:{rich_text:t(data.persona)},Nota:{rich_text:t(data.nota)}},
      inversiones:{Título:{title:t(data.titulo)},Monto:{number:n(data.monto)},Moneda:{select:{name:data.moneda||"ARS"}},Tipo:{select:{name:data.tipo||"Otro"}},Fecha:{date:{start:data.fecha||today()}},Proyectado:{number:n(data.proyectado)},Persona:{rich_text:t(data.persona)},Nota:{rich_text:t(data.nota)}}
    };
    await notionCall(token,"PATCH",`pages/${editRecord.id}`,{properties:propMap[editType]});
    showMsg("✓ Actualizado");setEditRecord(null);setEditType(null);loadAll();setLoading(false);
  };

  const confirmDelete=async()=>{
    if(!deleteId) return;
    setLoading(true);
    await notionCall(token,"PATCH",`pages/${deleteId}`,{archived:true});
    showMsg("✓ Eliminado");setDeleteId(null);loadAll();setLoading(false);
  };

  const handleEdit=(record,type)=>{setEditRecord(record);setEditType(type);};
  const handleDelete=(id)=>setDeleteId(id);

  const filterByPeriod=arr=>arr.filter(r=>{
    if(!r.fecha) return false;
    const fecha=r.fecha.slice(0,10);
    if(period==="semana") return fecha>=thisWeek();
    if(period==="mes") return fecha.startsWith(selectedMonth);
    if(period==="año") return fecha.startsWith(thisYear());
    return true;
  }).filter(r=>r.moneda===moneda);

  const fl={ingresos:filterByPeriod(records.ingresos),gastos:filterByPeriod(records.gastos),ahorros:filterByPeriod(records.ahorros),inversiones:filterByPeriod(records.inversiones)};
  const totalI=fl.ingresos.reduce((s,r)=>s+r.monto,0);
  const totalG=fl.gastos.reduce((s,r)=>s+r.monto,0);
  const totalA=fl.ahorros.reduce((s,r)=>s+r.monto,0);
  const balance=totalI-totalG-totalA;
  const gastosPorCat=CAT_GASTO.map(c=>({label:c,value:fl.gastos.filter(r=>r.categoria===c).reduce((s,r)=>s+r.monto,0),color:CAT_COLORS[c]})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
  const ingresosPorCat=CAT_INGRESO.map((c,i)=>({label:c,value:fl.ingresos.filter(r=>r.categoria===c).reduce((s,r)=>s+r.monto,0),color:COLORS[i]})).filter(x=>x.value>0);
  const invPorTipo=CAT_INV.map((c,i)=>({label:c,value:fl.inversiones.filter(r=>r.tipo===c).reduce((s,r)=>s+r.monto,0),color:COLORS[i]})).filter(x=>x.value>0);
  const monthlyData=arr=>{const months={};arr.filter(r=>r.moneda===moneda).forEach(r=>{if(!r.fecha) return;const m=r.fecha.slice(0,7);months[m]=(months[m]||0)+r.monto;});return Object.entries(months).sort().slice(-6).map(([k,v])=>({label:k.slice(5)+"/"+k.slice(2,4),value:v}));};

  function AddForm({type,fields}){
    const [d,setD]=useState({fecha:today(),persona:userName,moneda:"ARS"});
    const upd=(k,v)=>setD(p=>({...p,[k]:v}));
    return(
      <div style={{background:D.surface,borderRadius:16,padding:"16px",marginBottom:14,border:`1px solid ${D.border}`}}>
        <p style={{fontWeight:600,fontSize:14,marginBottom:12}}>Nuevo registro</p>
        {fields.map(f=>(
          <div key={f.id} style={{marginBottom:10}}>
            <label style={{display:"block",fontSize:11,color:D.textMuted,marginBottom:4,fontWeight:500,textTransform:"uppercase",letterSpacing:.3}}>{f.label}</label>
            {f.options?(<select value={d[f.id]||""} onChange={e=>upd(f.id,e.target.value)}><option value="">Elegir...</option>{f.options.map(o=><option key={o}>{o}</option>)}</select>):(<input type={f.type||"text"} value={d[f.id]||""} onChange={e=>upd(f.id,e.target.value)} placeholder={f.placeholder||""}/>)}
          </div>
        ))}
        <button onClick={()=>addRecord(type,d)} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:12,border:"none",background:loading?D.surface2:D.accent,color:loading?D.textMuted:"#fff",fontSize:15,fontWeight:600,marginTop:4}}>
          {loading?"Guardando...":"Guardar ↗"}
        </button>
      </div>
    );
  }

  function PeriodFilter(){
    return(
      <div style={{margin:"12px 0"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:8}}>
          {["semana","mes","año","todo"].map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${period===p?D.accent:D.border}`,background:period===p?D.accent+"22":D.surface,color:period===p?D.accent:D.textMuted,fontSize:12,cursor:"pointer",fontWeight:period===p?600:400}}>
              {p.charAt(0).toUpperCase()+p.slice(1)}
            </button>
          ))}
          <div style={{marginLeft:"auto",display:"flex",gap:4}}>
            {MONEDAS.map(m=>(<button key={m} onClick={()=>setMoneda(m)} style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${moneda===m?D.yellow:D.border}`,background:moneda===m?D.yellow+"22":D.surface,color:moneda===m?D.yellow:D.textMuted,fontSize:12,cursor:"pointer",fontWeight:moneda===m?600:400}}>{m}</button>))}
          </div>
        </div>
        {period==="mes"&&(<input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={{width:"100%",padding:"8px 12px",borderRadius:10,border:`1px solid ${D.accent}`,background:D.surface2,color:D.text,fontSize:14}}/>)}
      </div>
    );
  }

  function StatCard({label,value,color,moneda="ARS",sub}){
    return(<div style={{background:D.surface,borderRadius:14,padding:"14px",border:`1px solid ${D.border}`}}><p style={{fontSize:11,color:D.textMuted,margin:"0 0 6px",fontWeight:500,textTransform:"uppercase",letterSpacing:.5}}>{label}</p><p style={{fontSize:18,fontWeight:700,margin:0,color:color||D.text}}>{fmtShort(value,moneda)}</p>{sub&&<p style={{fontSize:11,color:D.textMuted,margin:"4px 0 0"}}>{sub}</p>}</div>);
  }

  if(setupStep!=="ready") return(
    <div style={{maxWidth:420,margin:"0 auto",padding:"2rem",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center"}}>
      <div style={{textAlign:"center",marginBottom:"2rem"}}><p style={{fontSize:36,marginBottom:8}}>💸</p><h2 style={{fontSize:22,fontWeight:700,marginBottom:6}}>FinanzasApp</h2><p style={{color:D.textMuted,fontSize:14}}>Gestión financiera compartida</p></div>
      <div style={{background:D.surface,borderRadius:16,padding:"20px",border:`1px solid ${D.border}`}}>
        <label style={{display:"block",fontSize:11,color:D.textMuted,marginBottom:4,fontWeight:500,textTransform:"uppercase",letterSpacing:.3}}>Tu nombre</label>
        <input style={{marginBottom:14}} placeholder="Ej: Lucía" value={userName} onChange={e=>{setUserName(e.target.value);localStorage.setItem("nf_user",e.target.value);}}/>
        <label style={{display:"block",fontSize:11,color:D.textMuted,marginBottom:4,fontWeight:500,textTransform:"uppercase",letterSpacing:.3}}>Token de Notion</label>
        <input style={{marginBottom:6}} type="password" placeholder="secret_..." value={token} onChange={e=>setToken(e.target.value)}/>
        <p style={{fontSize:11,color:D.textMuted,marginBottom:14}}>Obtené el token en <a href="https://notion.so/my-integrations" target="_blank" rel="noreferrer" style={{color:D.accent}}>notion.so/my-integrations</a></p>
        <button onClick={createDatabases} disabled={!token||loading} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:token?D.accent:D.surface2,color:token?"#fff":D.textMuted,fontSize:15,fontWeight:600}}>{loading?"Configurando...":"Conectar y crear bases ↗"}</button>
        {msg.text&&<p style={{fontSize:12,color:msg.type==="error"?D.red:D.green,marginTop:10,textAlign:"center"}}>{msg.text}</p>}
      </div>
    </div>
  );

  return(
    <div style={{maxWidth:900,margin:"0 auto",paddingBottom:80,minHeight:"100vh",background:D.bg}}>
      {msg.text&&<div style={{background:msg.type==="error"?D.red+"22":D.green+"22",color:msg.type==="error"?D.red:D.green,padding:"10px 16px",fontSize:13,textAlign:"center",fontWeight:500}}>{msg.text}</div>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:`1px solid ${D.border}`,position:"sticky",top:0,background:D.bg,zIndex:50}}>
        <h3 style={{margin:0,fontSize:16,fontWeight:600}}>{ICONS[tab]} {tab}</h3>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setShowQuick(true)} style={{background:D.accent,border:"none",borderRadius:20,padding:"6px 14px",color:"#fff",fontSize:13,fontWeight:600}}>+ Agregar</button>
          <button onClick={()=>loadAll()} style={{background:D.surface,border:`1px solid ${D.border}`,borderRadius:8,padding:"6px 10px",color:D.textMuted,fontSize:13}} disabled={loading}>{loading?"⟳":"↻"}</button>
        </div>
      </div>

      <div style={{padding:"0 16px"}}>

        {tab==="Inicio"&&<>
          <PeriodFilter/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
            <StatCard label="Ingresos" value={totalI} color={D.green} moneda={moneda}/>
            <StatCard label="Gastos" value={totalG} color={D.red} moneda={moneda}/>
            <StatCard label="Ahorro" value={totalA} color={D.accent} moneda={moneda}/>
            <StatCard label="Balance" value={balance} color={balance>=0?D.green:D.red} moneda={moneda}/>
          </div>
          {chartLoaded&&gastosPorCat.length>0&&<><p style={{fontSize:12,fontWeight:600,color:D.textMuted,textTransform:"uppercase",letterSpacing:1,margin:"20px 0 10px"}}>Gastos por categoría</p><div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`}}><PieChart data={gastosPorCat}/></div></>}
          <p style={{fontSize:12,fontWeight:600,color:D.textMuted,textTransform:"uppercase",letterSpacing:1,margin:"20px 0 10px"}}>Proyectos activos</p>
          {records.proyectos.length===0&&<p style={{color:D.textMuted,fontSize:13,textAlign:"center",padding:"1rem"}}>Sin proyectos</p>}
          {records.proyectos.slice(0,3).map(p=>{const pct=p.meta>0?Math.min(100,Math.round(p.acumulado/p.meta*100)):0;return<div key={p.id} style={{background:D.surface,borderRadius:14,padding:"14px",marginBottom:10,border:`1px solid ${D.border}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><p style={{fontWeight:600,margin:0}}>{p.titulo}</p><span style={{fontSize:11,background:D.accent+"22",color:D.accent,padding:"3px 10px",borderRadius:20,fontWeight:500}}>{p.tipo||"Grupal"}</span></div><div style={{background:D.surface2,borderRadius:6,height:8,marginBottom:6}}><div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${D.accent},${D.purple})`,borderRadius:6,transition:"width .5s ease"}}/></div><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:D.textMuted}}><span>{fmt(p.acumulado,p.moneda)}</span><span style={{fontWeight:600,color:D.accent}}>{pct}% — Meta: {fmt(p.meta,p.moneda)}</span></div></div>;})}
        </>}

        {tab==="Ingresos"&&<>
          <AddForm type="ingresos" fields={[{id:"titulo",label:"Descripción",placeholder:"Ej: Sueldo enero"},{id:"monto",label:"Monto",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"categoria",label:"Categoría",options:CAT_INGRESO},{id:"persona",label:"¿Quién?"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota"}]}/>
          <PeriodFilter/>
          {chartLoaded&&fl.ingresos.length>0&&<><div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`,marginBottom:14}}><PieChart data={ingresosPorCat}/></div><div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`,marginBottom:14}}><LineChart data={monthlyData(records.ingresos)} color={D.green} moneda={moneda}/></div></>}
          <p style={{fontSize:12,fontWeight:600,color:D.textMuted,textTransform:"uppercase",letterSpacing:1,margin:"16px 0 8px"}}>Registros</p>
          {fl.ingresos.length===0&&<p style={{color:D.textMuted,fontSize:13,textAlign:"center",padding:"1rem"}}>Sin registros</p>}
          {fl.ingresos.map(r=><SwipeRow key={r.id} record={r} type="ingresos" onEdit={handleEdit} onDelete={handleDelete} color={D.green}/>)}
        </>}

        {tab==="Gastos"&&<>
          <AddForm type="gastos" fields={[{id:"titulo",label:"Descripción",placeholder:"Ej: Super semana"},{id:"monto",label:"Monto",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"categoria",label:"Categoría",options:CAT_GASTO},{id:"persona",label:"¿Quién pagó?"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota"}]}/>
          <PeriodFilter/>
          {chartLoaded&&fl.gastos.length>0&&<><div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`,marginBottom:14}}><PieChart data={gastosPorCat}/></div><div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`,marginBottom:14}}><BarChart data={monthlyData(records.gastos)} color={D.red} moneda={moneda}/></div></>}
          <p style={{fontSize:12,fontWeight:600,color:D.textMuted,textTransform:"uppercase",letterSpacing:1,margin:"16px 0 8px"}}>Por categoría</p>
          {CAT_GASTO.map(c=><CatAccordion key={c} title={c} color={CAT_COLORS[c]||D.accent} items={fl.gastos.filter(r=>r.categoria===c)} type="gastos" onEdit={handleEdit} onDelete={handleDelete}/>)}
        </>}

        {tab==="Ahorro"&&<>
          <AddForm type="ahorros" fields={[{id:"titulo",label:"Descripción"},{id:"monto",label:"Monto",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"categoria",label:"Categoría",options:CAT_AHORRO},{id:"persona",label:"¿Quién?"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota"}]}/>
          <PeriodFilter/>
          <div style={{background:D.surface,borderRadius:14,padding:"14px",marginBottom:14,border:`1px solid ${D.border}`,textAlign:"center"}}><p style={{fontSize:11,color:D.textMuted,margin:"0 0 6px",textTransform:"uppercase",letterSpacing:.5}}>Total ahorrado</p><p style={{fontSize:28,fontWeight:700,color:D.accent,margin:0}}>{fmt(totalA,moneda)}</p></div>
          {chartLoaded&&fl.ahorros.length>0&&<div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`,marginBottom:14}}><LineChart data={monthlyData(records.ahorros)} color={D.accent} moneda={moneda}/></div>}
          <p style={{fontSize:12,fontWeight:600,color:D.textMuted,textTransform:"uppercase",letterSpacing:1,margin:"16px 0 8px"}}>Registros</p>
          {fl.ahorros.map(r=><SwipeRow key={r.id} record={r} type="ahorros" onEdit={handleEdit} onDelete={handleDelete} color={D.accent}/>)}
        </>}

        {tab==="Proyectos"&&<>
          <AddForm type="proyectos" fields={[{id:"titulo",label:"Nombre"},{id:"meta",label:"Meta",type:"number"},{id:"acumulado",label:"Acumulado",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"tipo",label:"Tipo",options:["Individual","Grupal"]},{id:"fecha",label:"Fecha objetivo",type:"date"},{id:"nota",label:"Nota"}]}/>
          {records.proyectos.map(p=>{const pct=p.meta>0?Math.min(100,Math.round(p.acumulado/p.meta*100)):0;const remaining=p.meta-p.acumulado;return<div key={p.id} style={{background:D.surface,borderRadius:16,padding:"16px",marginBottom:12,border:`1px solid ${D.border}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}><div><p style={{fontWeight:600,fontSize:15,margin:"0 0 4px"}}>{p.titulo}</p><span style={{fontSize:11,background:D.accent+"22",color:D.accent,padding:"3px 10px",borderRadius:20,fontWeight:500}}>{p.tipo||"Grupal"}</span></div><span style={{fontWeight:700,fontSize:22,color:pct>=100?D.green:D.accent}}>{pct}%</span></div><div style={{background:D.surface2,borderRadius:8,height:10,marginBottom:8}}><div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${D.accent},${D.purple})`,borderRadius:8,transition:"width .5s ease"}}/></div><div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{color:D.textMuted}}>Acumulado: <span style={{color:D.text,fontWeight:500}}>{fmt(p.acumulado,p.moneda)}</span></span><span style={{color:D.textMuted}}>Falta: <span style={{color:D.red,fontWeight:500}}>{fmt(remaining>0?remaining:0,p.moneda)}</span></span></div>{p.fecha&&<p style={{fontSize:11,color:D.textMuted,margin:"6px 0 0"}}>📅 {p.fecha}</p>}</div>;})}
        </>}

        {tab==="Inversiones"&&<>
          <AddForm type="inversiones" fields={[{id:"titulo",label:"Descripción"},{id:"monto",label:"Monto",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"tipo",label:"Tipo",options:CAT_INV},{id:"proyectado",label:"Retorno proyectado",type:"number"},{id:"persona",label:"¿Quién?"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota"}]}/>
          <PeriodFilter/>
          {chartLoaded&&invPorTipo.length>0&&<div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`,marginBottom:14}}><PieChart data={invPorTipo}/></div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}><StatCard label="Invertido" value={fl.inversiones.reduce((s,r)=>s+r.monto,0)} color={D.purple} moneda={moneda}/><StatCard label="Proyectado" value={fl.inversiones.reduce((s,r)=>s+r.proyectado,0)} color={D.green} moneda={moneda}/></div>
          <p style={{fontSize:12,fontWeight:600,color:D.textMuted,textTransform:"uppercase",letterSpacing:1,margin:"16px 0 8px"}}>Por tipo</p>
          {CAT_INV.map((c,i)=><CatAccordion key={c} title={c} color={COLORS[i%COLORS.length]} items={fl.inversiones.filter(r=>r.tipo===c)} type="inversiones" onEdit={handleEdit} onDelete={handleDelete}/>)}
        </>}

        {tab==="Reportes"&&<>
          <PeriodFilter/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
            <StatCard label="Ingresos" value={records.ingresos.filter(r=>r.moneda===moneda).reduce((s,r)=>s+r.monto,0)} color={D.green} moneda={moneda} sub="historial"/>
            <StatCard label="Gastos" value={records.gastos.filter(r=>r.moneda===moneda).reduce((s,r)=>s+r.monto,0)} color={D.red} moneda={moneda} sub="historial"/>
            <StatCard label="Ahorrado" value={records.ahorros.filter(r=>r.moneda===moneda).reduce((s,r)=>s+r.monto,0)} color={D.accent} moneda={moneda} sub="historial"/>
            <StatCard label="Invertido" value={records.inversiones.filter(r=>r.moneda===moneda).reduce((s,r)=>s+r.monto,0)} color={D.purple} moneda={moneda} sub="historial"/>
          </div>
          {chartLoaded&&<><p style={{fontSize:12,fontWeight:600,color:D.textMuted,textTransform:"uppercase",letterSpacing:1,margin:"20px 0 10px"}}>Ingresos vs Gastos</p><div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`,marginBottom:14}}><BarChart data={monthlyData(records.ingresos)} color={D.green} moneda={moneda}/></div><p style={{fontSize:12,fontWeight:600,color:D.textMuted,textTransform:"uppercase",letterSpacing:1,margin:"16px 0 10px"}}>Distribución de gastos</p><div style={{background:D.surface,borderRadius:16,padding:"14px",border:`1px solid ${D.border}`,marginBottom:14}}><PieChart data={CAT_GASTO.map(c=>({label:c,value:records.gastos.filter(r=>r.categoria===c&&r.moneda===moneda).reduce((s,r)=>s+r.monto,0),color:CAT_COLORS[c]})).filter(x=>x.value>0)}/></div></>}
        </>}

        {tab==="Config"&&<>
          <div style={{background:D.surface,borderRadius:16,padding:"16px",marginTop:16,border:`1px solid ${D.border}`,marginBottom:12}}>
            <p style={{fontWeight:600,marginBottom:12}}>Tu perfil</p>
            <label style={{fontSize:11,color:D.textMuted,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.3}}>Nombre</label>
            <input value={userName} onChange={e=>{setUserName(e.target.value);localStorage.setItem("nf_user",e.target.value);}}/>
          </div>
          <div style={{background:D.surface,borderRadius:16,padding:"16px",border:`1px solid ${D.border}`}}>
            <p style={{fontWeight:600,marginBottom:12}}>Notion</p>
            <p style={{fontSize:13,color:D.textMuted,marginBottom:12}}>Token: ●●●●{token.slice(-4)}</p>
            <button onClick={()=>{const cfg=encodeURIComponent(JSON.stringify({t:token,d:dbIds,u:userName}));const url=`${window.location.origin}?cfg=${cfg}`;prompt("Copiá este link y abrilo en el celular:",url);}} style={{width:"100%",padding:"12px",borderRadius:10,border:`1px solid ${D.accent}44`,background:D.accent+"11",color:D.accent,fontSize:14,fontWeight:500,marginBottom:8}}>📱 Exportar al celular</button>
            <button onClick={()=>loadAll()} disabled={loading} style={{width:"100%",padding:"12px",borderRadius:10,border:`1px solid ${D.border}`,background:D.surface2,color:D.text,fontSize:14,fontWeight:500,marginBottom:8}}>{loading?"Sincronizando...":"↻ Sincronizar"}</button>
            <button onClick={()=>{localStorage.clear();window.location.reload();}} style={{width:"100%",padding:"12px",borderRadius:10,border:`1px solid ${D.red}44`,background:D.red+"11",color:D.red,fontSize:14,fontWeight:500}}>Desconectar</button>
          </div>
        </>}
      </div>

      {showQuick&&<QuickAdd onSave={addRecord} onClose={()=>setShowQuick(false)} userName={userName}/>}
      {editRecord&&editType&&<EditModal record={editRecord} type={editType} onSave={saveEdit} onClose={()=>{setEditRecord(null);setEditType(null);}}/>}
      {deleteId&&<ConfirmModal message="Esta acción no se puede deshacer." onConfirm={confirmDelete} onCancel={()=>setDeleteId(null)}/>}

      <nav style={{position:"fixed",bottom:0,left:0,right:0,background:D.surface,borderTop:`1px solid ${D.border}`,display:"flex",justifyContent:"space-around",padding:"6px 0",zIndex:100}}>
        {TABS.map(t=>(<button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",padding:"4px 2px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,color:tab===t?D.accent:D.textMuted,fontSize:9,minWidth:36,fontWeight:tab===t?600:400}}><span style={{fontSize:15}}>{ICONS[t]}</span><span>{t}</span></button>))}
      </nav>
    </div>
  );
}