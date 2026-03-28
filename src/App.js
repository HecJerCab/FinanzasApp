import { useState, useEffect, useRef } from "react";

const CAT_GASTO = ["Alimentación","Transporte","Servicios","Salud","Educación","Entretenimiento","Ropa","Hogar","Otros"];
const CAT_INGRESO = ["Sueldo","Freelance","Inversión","Regalo","Otro"];
const CAT_INV = ["Plazo fijo","Acciones","Cripto","FCI","Dólares","Inmueble","Otro"];
const MONEDAS = ["ARS","USD"];
const TABS = ["Inicio","Ingresos","Gastos","Ahorro","Proyectos","Inversiones","Reportes","Config"];
const ICONS = {Inicio:"◉",Ingresos:"↑",Gastos:"↓",Ahorro:"♦",Proyectos:"★",Inversiones:"▲",Reportes:"≡",Config:"⚙"};
const COLORS = ["#4f8ef7","#f7704f","#4fbe8a","#f7c44f","#a77cf7","#f74f9e","#4fd4f7","#f7f74f","#7cf74f"];

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
const thisWeek = () => {
  const d = new Date(); d.setDate(d.getDate()-d.getDay());
  return d.toISOString().split("T")[0];
};
const thisYear = () => new Date().getFullYear().toString();

const s = {
  page:{maxWidth:520,margin:"0 auto",paddingBottom:80,minHeight:"100vh",background:"#fff"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:"1px solid #eee"},
  grid2:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16},
  grid4:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:16},
  card:{background:"#f8f8f8",borderRadius:10,padding:"12px"},
  cardBig:{background:"#fff",border:"1px solid #eee",borderRadius:12,padding:"16px",marginBottom:10},
  label:{fontSize:11,color:"#888",margin:"0 0 4px"},
  value:{fontSize:20,fontWeight:500,margin:0},
  bar:{background:"#f0f0f0",borderRadius:4,height:6,margin:"3px 0 8px"},
  nav:{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid #eee",display:"flex",justifyContent:"space-around",padding:"6px 0",zIndex:100},
  navBtn:(a)=>({background:"none",border:"none",padding:"4px 2px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,color:a?"#111":"#aaa",fontSize:9,minWidth:36,borderRadius:0,fontWeight:a?600:400}),
  input:{width:"100%",marginBottom:10,fontSize:15,padding:"10px 12px",border:"1px solid #ddd",borderRadius:8,background:"#fff",display:"block",boxSizing:"border-box"},
  btn:{width:"100%",padding:"12px",borderRadius:10,border:"1px solid #ddd",background:"#fff",fontSize:15,fontWeight:500,cursor:"pointer",marginBottom:8},
  btnPrimary:{width:"100%",padding:"12px",borderRadius:10,border:"none",background:"#111",color:"#fff",fontSize:15,fontWeight:500,cursor:"pointer",marginBottom:8},
  tag:(c)=>({fontSize:11,background:c+"22",color:c,padding:"2px 8px",borderRadius:4,display:"inline-block"}),
  row:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f0f0f0"},
  filterBtn:(a)=>({padding:"6px 14px",borderRadius:20,border:"1px solid "+(a?"#111":"#ddd"),background:a?"#111":"#fff",color:a?"#fff":"#666",fontSize:12,cursor:"pointer",fontWeight:a?500:400}),
  msgS:{background:"#e6f7ec",color:"#1a7a3c",padding:"8px 16px",fontSize:13,textAlign:"center"},
  msgE:{background:"#fde8e8",color:"#c0392b",padding:"8px 16px",fontSize:13,textAlign:"center"},
};

async function notionCall(token,method,path,body){
  const res=await fetch(`/api/notion?path=${path}`,{method,headers:{"Authorization":`Bearer ${token}`,"Notion-Version":"2022-06-28","Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});
  return res.json();
}

function PieChart({data,size=180}){
  const ref=useRef();
  useEffect(()=>{
    if(!ref.current||!data?.length) return;
    const ctx=ref.current.getContext("2d");
    if(ref.current._chart) ref.current._chart.destroy();
    ref.current._chart=new window.Chart(ctx,{
      type:"doughnut",
      data:{labels:data.map(d=>d.label),datasets:[{data:data.map(d=>d.value),backgroundColor:COLORS,borderWidth:2,borderColor:"#fff"}]},
      options:{responsive:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:i=>`${i.label}: ${fmtARS(i.raw)}`}}}}
    });
  },[data]);
  if(!data?.length) return <p style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"1rem"}}>Sin datos</p>;
  return(
    <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
      <canvas ref={ref} width={size} height={size}/>
      <div style={{flex:1,minWidth:120}}>
        {data.map((d,i)=>(
          <div key={d.label} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,fontSize:12}}>
            <span style={{width:10,height:10,borderRadius:2,background:COLORS[i],flexShrink:0,display:"inline-block"}}/>
            <span style={{flex:1,color:"#555"}}>{d.label}</span>
            <span style={{fontWeight:500}}>{fmtShort(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({data,color="#4f8ef7",moneda="ARS"}){
  const ref=useRef();
  useEffect(()=>{
    if(!ref.current||!data?.length) return;
    const ctx=ref.current.getContext("2d");
    if(ref.current._chart) ref.current._chart.destroy();
    ref.current._chart=new window.Chart(ctx,{
      type:"bar",
      data:{labels:data.map(d=>d.label),datasets:[{data:data.map(d=>d.value),backgroundColor:color+"cc",borderRadius:6}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:i=>fmt(i.raw,moneda)}}},scales:{y:{ticks:{callback:v=>fmtShort(v,moneda)},grid:{color:"#f0f0f0"}},x:{grid:{display:false},ticks:{autoSkip:false,maxRotation:45}}}}
    });
  },[data,color,moneda]);
  if(!data?.length) return <p style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"1rem"}}>Sin datos</p>;
  return <div style={{position:"relative",height:200}}><canvas ref={ref}/></div>;
}

function LineChart({data,color="#4f8ef7",moneda="ARS"}){
  const ref=useRef();
  useEffect(()=>{
    if(!ref.current||!data?.length) return;
    const ctx=ref.current.getContext("2d");
    if(ref.current._chart) ref.current._chart.destroy();
    ref.current._chart=new window.Chart(ctx,{
      type:"line",
      data:{labels:data.map(d=>d.label),datasets:[{data:data.map(d=>d.value),borderColor:color,backgroundColor:color+"22",tension:0.4,fill:true,pointRadius:4}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:i=>fmt(i.raw,moneda)}}},scales:{y:{ticks:{callback:v=>fmtShort(v,moneda)},grid:{color:"#f0f0f0"}},x:{grid:{display:false}}}}
    });
  },[data,color,moneda]);
  if(!data?.length) return <p style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"1rem"}}>Sin datos</p>;
  return <div style={{position:"relative",height:200}}><canvas ref={ref}/></div>;
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
  const [moneda,setMoneda]=useState("ARS");
  const [userName,setUserName]=useState(()=>localStorage.getItem("nf_user")||"");
  const [chartLoaded,setChartLoaded]=useState(false);

  useEffect(()=>{
    if(window.Chart){setChartLoaded(true);return;}
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload=()=>setChartLoaded(true);
    document.head.appendChild(s);
  },[]);

  const showMsg=(text,type="success")=>{setMsg({text,type});setTimeout(()=>setMsg({text:"",type:""}),3000);};

  const createDatabases=async()=>{
    setLoading(true);showMsg("Buscando workspace...");
    try{
      const search=await notionCall(token,"POST","search",{filter:{value:"page",property:"object"},page_size:1});
      const parentId=search?.results?.[0]?.id;
      if(!parentId){showMsg("No se encontró ninguna página en Notion. Creá una página primero.","error");setLoading(false);return;}
      const dbs={};
      const dbDefs=[
        {key:"ingresos",title:"💰 Ingresos",props:{Título:{title:{}},Monto:{number:{format:"number"}},Moneda:{select:{options:MONEDAS.map(n=>({name:n}))}},Categoría:{select:{options:CAT_INGRESO.map(n=>({name:n}))}},Fecha:{date:{}},Persona:{rich_text:{}},Nota:{rich_text:{}}}},
        {key:"gastos",title:"💸 Gastos",props:{Título:{title:{}},Monto:{number:{format:"number"}},Moneda:{select:{options:MONEDAS.map(n=>({name:n}))}},Categoría:{select:{options:CAT_GASTO.map(n=>({name:n}))}},Fecha:{date:{}},Persona:{rich_text:{}},Nota:{rich_text:{}}}},
        {key:"ahorros",title:"🏦 Ahorro",props:{Título:{title:{}},Monto:{number:{}},Moneda:{select:{options:MONEDAS.map(n=>({name:n}))}},Fecha:{date:{}},Persona:{rich_text:{}},Nota:{rich_text:{}}}},
        {key:"proyectos",title:"🎯 Proyectos",props:{Título:{title:{}},Meta:{number:{}},Acumulado:{number:{}},Moneda:{select:{options:MONEDAS.map(n=>({name:n}))}},Tipo:{select:{options:[{name:"Individual"},{name:"Grupal"}]}},FechaObjetivo:{date:{}},Nota:{rich_text:{}}}},
        {key:"inversiones",title:"📈 Inversiones",props:{Título:{title:{}},Monto:{number:{}},Moneda:{select:{options:MONEDAS.map(n=>({name:n}))}},Tipo:{select:{options:CAT_INV.map(n=>({name:n}))}},Fecha:{date:{}},Proyectado:{number:{}},Persona:{rich_text:{}},Nota:{rich_text:{}}}}
      ];
      for(const db of dbDefs){
        showMsg(`Creando: ${db.title}...`);
        const res=await notionCall(token,"POST","databases",{parent:{page_id:parentId},title:[{type:"text",text:{content:db.title}}],properties:db.props});
        if(res?.id) dbs[db.key]=res.id;
      }
      localStorage.setItem("nf_dbs",JSON.stringify(dbs));
      localStorage.setItem("nf_token",token);
      setDbIds(dbs);setSetupStep("ready");
      showMsg("¡Listo! Bases creadas en Notion ✓");
      loadAll(dbs);
    }catch(e){showMsg("Error al conectar. Verificá el token.","error");}
    setLoading(false);
  };

  const loadAll=async(dbs=dbIds)=>{
    if(!token||!dbs?.ingresos) return;
    setLoading(true);
    const keys=["ingresos","gastos","ahorros","proyectos","inversiones"];
    const results={};
    for(const k of keys){
      if(!dbs[k]) continue;
      const r=await notionCall(token,"POST",`databases/${dbs[k]}/query`,{page_size:200});
      results[k]=(r?.results||[]).map(p=>{
        const pr=p.properties;
        return{id:p.id,titulo:pr.Título?.title?.[0]?.plain_text||"",monto:pr.Monto?.number||0,meta:pr.Meta?.number||0,acumulado:pr.Acumulado?.number||0,proyectado:pr.Proyectado?.number||0,moneda:pr.Moneda?.select?.name||"ARS",categoria:pr.Categoría?.select?.name||pr.Tipo?.select?.name||"",fecha:pr.Fecha?.date?.start||pr.FechaObjetivo?.date?.start||"",persona:pr.Persona?.rich_text?.[0]?.plain_text||"",tipo:pr.Tipo?.select?.name||"",nota:pr.Nota?.rich_text?.[0]?.plain_text||""};
      });
    }
    setRecords(r=>({...r,...results}));setLoading(false);
  };

  useEffect(()=>{if(setupStep==="ready") loadAll();},[setupStep]);

  const addRecord=async(type,data)=>{
    if(!dbIds[type]) return;
    setLoading(true);
    const n=v=>v?+v:0;
    const t=v=>[{type:"text",text:{content:v||""}}];
    const propMap={
      ingresos:{Título:{title:t(data.titulo)},Monto:{number:n(data.monto)},Moneda:{select:{name:data.moneda||"ARS"}},Categoría:{select:{name:data.categoria||"Otro"}},Fecha:{date:{start:data.fecha||today()}},Persona:{rich_text:t(data.persona)},Nota:{rich_text:t(data.nota)}},
      gastos:{Título:{title:t(data.titulo)},Monto:{number:n(data.monto)},Moneda:{select:{name:data.moneda||"ARS"}},Categoría:{select:{name:data.categoria||"Otros"}},Fecha:{date:{start:data.fecha||today()}},Persona:{rich_text:t(data.persona)},Nota:{rich_text:t(data.nota)}},
      ahorros:{Título:{title:t(data.titulo||"Ahorro")},Monto:{number:n(data.monto)},Moneda:{select:{name:data.moneda||"ARS"}},Fecha:{date:{start:data.fecha||today()}},Persona:{rich_text:t(data.persona)},Nota:{rich_text:t(data.nota)}},
      proyectos:{Título:{title:t(data.titulo||"Proyecto")},Meta:{number:n(data.meta)},Acumulado:{number:n(data.acumulado)},Moneda:{select:{name:data.moneda||"ARS"}},Tipo:{select:{name:data.tipo||"Grupal"}},FechaObjetivo:{date:{start:data.fecha||today()}},Nota:{rich_text:t(data.nota)}},
      inversiones:{Título:{title:t(data.titulo)},Monto:{number:n(data.monto)},Moneda:{select:{name:data.moneda||"ARS"}},Tipo:{select:{name:data.tipo||"Otro"}},Fecha:{date:{start:data.fecha||today()}},Proyectado:{number:n(data.proyectado)},Persona:{rich_text:t(data.persona)},Nota:{rich_text:t(data.nota)}}
    };
    const res=await notionCall(token,"POST","pages",{parent:{database_id:dbIds[type]},properties:propMap[type]});
    if(res?.id){showMsg("Guardado en Notion ✓");loadAll();}
    else showMsg("Error al guardar","error");
    setLoading(false);
  };

  const filterByPeriod=(arr)=>{
    return arr.filter(r=>{
      if(!r.fecha) return false;
      if(period==="semana") return r.fecha>=thisWeek();
      if(period==="mes") return r.fecha.startsWith(thisMonth());
      if(period==="año") return r.fecha.startsWith(thisYear());
      return true;
    }).filter(r=>r.moneda===moneda);
  };

  const filtered={
    ingresos:filterByPeriod(records.ingresos),
    gastos:filterByPeriod(records.gastos),
    ahorros:filterByPeriod(records.ahorros),
    inversiones:filterByPeriod(records.inversiones),
  };

  const totalI=filtered.ingresos.reduce((s,r)=>s+r.monto,0);
  const totalG=filtered.gastos.reduce((s,r)=>s+r.monto,0);
  const totalA=filtered.ahorros.reduce((s,r)=>s+r.monto,0);
  const balance=totalI-totalG-totalA;

  const gastosPorCat=CAT_GASTO.map(c=>({label:c,value:filtered.gastos.filter(r=>r.categoria===c).reduce((s,r)=>s+r.monto,0)})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
  const ingresosPorCat=CAT_INGRESO.map(c=>({label:c,value:filtered.ingresos.filter(r=>r.categoria===c).reduce((s,r)=>s+r.monto,0)})).filter(x=>x.value>0);
  const invPorTipo=CAT_INV.map(c=>({label:c,value:filtered.inversiones.filter(r=>r.tipo===c).reduce((s,r)=>s+r.monto,0)})).filter(x=>x.value>0);

  const monthlyData=(arr)=>{
    const months={};
    arr.filter(r=>r.moneda===moneda).forEach(r=>{
      if(!r.fecha) return;
      const m=r.fecha.slice(0,7);
      months[m]=(months[m]||0)+r.monto;
    });
    return Object.entries(months).sort().slice(-6).map(([k,v])=>({label:k.slice(5)+"/"+k.slice(2,4),value:v}));
  };

  function AddForm({type,fields}){
    const [d,setD]=useState({fecha:today(),persona:userName,moneda:"ARS"});
    const upd=(k,v)=>setD(p=>({...p,[k]:v}));
    return(
      <div style={s.cardBig}>
        <p style={{fontWeight:500,fontSize:14,marginBottom:12}}>Nuevo registro</p>
        {fields.map(f=>(
          <div key={f.id} style={{marginBottom:10}}>
            <label style={{display:"block",fontSize:12,color:"#888",marginBottom:3}}>{f.label}</label>
            {f.options?(
              <select value={d[f.id]||""} onChange={e=>upd(f.id,e.target.value)} style={s.input}>
                <option value="">Elegir...</option>
                {f.options.map(o=><option key={o}>{o}</option>)}
              </select>
            ):(
              <input type={f.type||"text"} value={d[f.id]||""} onChange={e=>upd(f.id,e.target.value)} style={s.input}/>
            )}
          </div>
        ))}
        <button style={s.btnPrimary} onClick={()=>addRecord(type,d)} disabled={loading}>{loading?"Guardando...":"Guardar ↗"}</button>
      </div>
    );
  }

  function RecordList({items}){
    if(!items.length) return <p style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"1.5rem"}}>Sin registros</p>;
    return items.map(r=>(
      <div key={r.id} style={s.row}>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:14,fontWeight:500,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.titulo}</p>
          <p style={{fontSize:12,color:"#888",margin:0}}>{r.categoria||r.tipo}{r.persona?` · ${r.persona}`:""} · {r.fecha}</p>
        </div>
        <span style={{fontWeight:500,marginLeft:8,whiteSpace:"nowrap"}}>{fmt(r.monto,r.moneda)}</span>
      </div>
    ));
  }

  function PeriodFilter(){
    return(
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {["semana","mes","año","todo"].map(p=>(
          <button key={p} style={s.filterBtn(period===p)} onClick={()=>setPeriod(p)}>{p.charAt(0).toUpperCase()+p.slice(1)}</button>
        ))}
        <div style={{marginLeft:"auto",display:"flex",gap:4}}>
          {MONEDAS.map(m=>(
            <button key={m} style={s.filterBtn(moneda===m)} onClick={()=>setMoneda(m)}>{m}</button>
          ))}
        </div>
      </div>
    );
  }

  if(setupStep!=="ready") return(
    <div style={{maxWidth:480,margin:"0 auto",padding:"2rem"}}>
      <h2 style={{marginBottom:8}}>FinanzasApp</h2>
      <p style={{color:"#888",fontSize:14,marginBottom:"1.5rem"}}>Conectá tu Notion para sincronizar con tu pareja.</p>
      <label style={{display:"block",fontSize:12,color:"#888",marginBottom:4}}>Tu nombre</label>
      <input style={s.input} placeholder="Ej: Lucía" value={userName} onChange={e=>{setUserName(e.target.value);localStorage.setItem("nf_user",e.target.value);}}/>
      <label style={{display:"block",fontSize:12,color:"#888",marginBottom:4}}>Token de Notion (secret_...)</label>
      <input style={s.input} type="password" placeholder="secret_..." value={token} onChange={e=>setToken(e.target.value)}/>
      <p style={{fontSize:12,color:"#aaa",marginBottom:12}}>Obtené el token en <a href="https://notion.so/my-integrations" target="_blank" rel="noreferrer">notion.so/my-integrations</a></p>
      <button style={s.btnPrimary} onClick={createDatabases} disabled={!token||loading}>{loading?"Configurando...":"Conectar y crear bases ↗"}</button>
      {msg.text&&<p style={{fontSize:13,color:msg.type==="error"?"#c0392b":"#1a7a3c",marginTop:8}}>{msg.text}</p>}
    </div>
  );

  return(
    <div style={s.page}>
      {msg.text&&<div style={msg.type==="error"?s.msgE:s.msgS}>{msg.text}</div>}
      <div style={s.header}>
        <h3 style={{margin:0,fontSize:16}}>{ICONS[tab]} {tab}</h3>
        <button onClick={()=>loadAll()} style={{...s.btn,width:"auto",padding:"6px 12px",fontSize:12,marginBottom:0}} disabled={loading}>{loading?"...":"↻"}</button>
      </div>

      <div style={{padding:"0 16px"}}>

        {tab==="Inicio"&&<>
          <div style={{padding:"12px 0 0"}}>
            <PeriodFilter/>
          </div>
          <div style={s.grid2}>
            {[["Ingresos",totalI,"#1a7a3c"],["Gastos",totalG,"#c0392b"],["Ahorro",totalA,"#1a5fa8"],["Balance",balance,balance>=0?"#1a7a3c":"#c0392b"]].map(([l,v,c])=>(
              <div key={l} style={s.card}><p style={s.label}>{l} ({moneda})</p><p style={{...s.value,color:c,fontSize:16}}>{fmtShort(v,moneda)}</p></div>
            ))}
          </div>
          {chartLoaded&&gastosPorCat.length>0&&<>
            <p style={{fontSize:13,fontWeight:600,margin:"16px 0 10px"}}>Gastos por categoría</p>
            <PieChart data={gastosPorCat}/>
          </>}
          <p style={{fontSize:13,fontWeight:600,margin:"16px 0 8px"}}>Proyectos activos</p>
          {records.proyectos.slice(0,3).map(p=>{
            const pct=p.meta>0?Math.min(100,Math.round(p.acumulado/p.meta*100)):0;
            return<div key={p.id} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span>{p.titulo}</span><span style={{fontWeight:500}}>{pct}%</span></div>
              <div style={{...s.bar,height:8}}><div style={{width:`${pct}%`,height:"100%",background:"#4f8ef7",borderRadius:4}}/></div>
              <p style={{fontSize:11,color:"#aaa",margin:0}}>{fmt(p.acumulado,p.moneda)} de {fmt(p.meta,p.moneda)}</p>
            </div>;
          })}
        </>}

        {tab==="Ingresos"&&<>
          <AddForm type="ingresos" fields={[{id:"titulo",label:"Descripción"},{id:"monto",label:"Monto",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"categoria",label:"Categoría",options:CAT_INGRESO},{id:"persona",label:"¿Quién?"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota"}]}/>
          <PeriodFilter/>
          {chartLoaded&&<><p style={{fontSize:13,fontWeight:600,margin:"0 0 10px"}}>Por categoría</p><PieChart data={ingresosPorCat}/><p style={{fontSize:13,fontWeight:600,margin:"16px 0 8px"}}>Evolución mensual</p><LineChart data={monthlyData(records.ingresos)} color="#1a7a3c" moneda={moneda}/></>}
          <p style={{fontSize:13,fontWeight:600,margin:"16px 0 8px"}}>Registros</p>
          <RecordList items={filtered.ingresos}/>
        </>}

        {tab==="Gastos"&&<>
          <AddForm type="gastos" fields={[{id:"titulo",label:"Descripción"},{id:"monto",label:"Monto",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"categoria",label:"Categoría",options:CAT_GASTO},{id:"persona",label:"¿Quién pagó?"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota"}]}/>
          <PeriodFilter/>
          {chartLoaded&&<><p style={{fontSize:13,fontWeight:600,margin:"0 0 10px"}}>Por categoría</p><PieChart data={gastosPorCat}/><p style={{fontSize:13,fontWeight:600,margin:"16px 0 8px"}}>Evolución mensual</p><BarChart data={monthlyData(records.gastos)} color="#c0392b" moneda={moneda}/></>}
          <p style={{fontSize:13,fontWeight:600,margin:"16px 0 8px"}}>Registros</p>
          <RecordList items={filtered.gastos}/>
        </>}

        {tab==="Ahorro"&&<>
          <AddForm type="ahorros" fields={[{id:"titulo",label:"Descripción"},{id:"monto",label:"Monto",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"persona",label:"¿Quién?"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota"}]}/>
          <PeriodFilter/>
          <div style={{...s.card,textAlign:"center",marginBottom:16}}>
            <p style={s.label}>Total ahorrado ({period})</p>
            <p style={{...s.value,color:"#1a5fa8"}}>{fmt(totalA,moneda)}</p>
          </div>
          {chartLoaded&&<><p style={{fontSize:13,fontWeight:600,margin:"0 0 8px"}}>Evolución mensual</p><LineChart data={monthlyData(records.ahorros)} color="#1a5fa8" moneda={moneda}/></>}
          <p style={{fontSize:13,fontWeight:600,margin:"16px 0 8px"}}>Registros</p>
          <RecordList items={filtered.ahorros}/>
        </>}

        {tab==="Proyectos"&&<>
          <AddForm type="proyectos" fields={[{id:"titulo",label:"Nombre"},{id:"meta",label:"Meta",type:"number"},{id:"acumulado",label:"Acumulado",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"tipo",label:"Tipo",options:["Individual","Grupal"]},{id:"fecha",label:"Fecha objetivo",type:"date"},{id:"nota",label:"Nota"}]}/>
          {records.proyectos.map(p=>{
            const pct=p.meta>0?Math.min(100,Math.round(p.acumulado/p.meta*100)):0;
            return<div key={p.id} style={s.cardBig}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <div><p style={{fontWeight:500,margin:"0 0 4px"}}>{p.titulo}</p><span style={s.tag("#4f8ef7")}>{p.tipo}</span></div>
                <span style={{fontWeight:600,fontSize:20}}>{pct}%</span>
              </div>
              <div style={{...s.bar,height:12}}><div style={{width:`${pct}%`,height:"100%",background:"#4f8ef7",borderRadius:4}}/></div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888"}}>
                <span>{fmt(p.acumulado,p.moneda)}</span><span>Meta: {fmt(p.meta,p.moneda)}</span>
              </div>
              {p.fecha&&<p style={{fontSize:11,color:"#aaa",margin:"4px 0 0"}}>Objetivo: {p.fecha}</p>}
            </div>;
          })}
        </>}

        {tab==="Inversiones"&&<>
          <AddForm type="inversiones" fields={[{id:"titulo",label:"Descripción"},{id:"monto",label:"Monto",type:"number"},{id:"moneda",label:"Moneda",options:MONEDAS},{id:"tipo",label:"Tipo",options:CAT_INV},{id:"proyectado",label:"Retorno proyectado",type:"number"},{id:"persona",label:"¿Quién?"},{id:"fecha",label:"Fecha",type:"date"},{id:"nota",label:"Nota"}]}/>
          <PeriodFilter/>
          {chartLoaded&&invPorTipo.length>0&&<><p style={{fontSize:13,fontWeight:600,margin:"0 0 10px"}}>Por tipo</p><PieChart data={invPorTipo}/></>}
          <div style={{...s.card,marginTop:12,marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div><p style={s.label}>Invertido ({moneda})</p><p style={{...s.value,fontSize:16}}>{fmtShort(filtered.inversiones.reduce((s,r)=>s+r.monto,0),moneda)}</p></div>
              <div style={{textAlign:"right"}}><p style={s.label}>Proyectado ({moneda})</p><p style={{...s.value,fontSize:16,color:"#1a7a3c"}}>{fmtShort(filtered.inversiones.reduce((s,r)=>s+r.proyectado,0),moneda)}</p></div>
            </div>
          </div>
          {filtered.inversiones.map(inv=>(
            <div key={inv.id} style={s.cardBig}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div><p style={{fontWeight:500,margin:"0 0 4px"}}>{inv.titulo}</p><span style={s.tag("#8e44ad")}>{inv.tipo}</span>{inv.persona?<span style={{fontSize:11,color:"#888",marginLeft:6}}>{inv.persona}</span>:null}</div>
                <div style={{textAlign:"right"}}><p style={{fontWeight:500,margin:0}}>{fmt(inv.monto,inv.moneda)}</p>{inv.proyectado>0&&<p style={{fontSize:12,color:"#1a7a3c",margin:0}}>→ {fmt(inv.proyectado,inv.moneda)}</p>}</div>
              </div>
            </div>
          ))}
        </>}

        {tab==="Reportes"&&<>
          <PeriodFilter/>
          <p style={{fontSize:13,fontWeight:600,margin:"8px 0 10px"}}>Resumen ({moneda})</p>
          <div style={s.grid2}>
            {[["Ingresos",records.ingresos.filter(r=>r.moneda===moneda).reduce((s,r)=>s+r.monto,0),"#1a7a3c"],["Gastos",records.gastos.filter(r=>r.moneda===moneda).reduce((s,r)=>s+r.monto,0),"#c0392b"],["Ahorrado",records.ahorros.filter(r=>r.moneda===moneda).reduce((s,r)=>s+r.monto,0),"#1a5fa8"],["Invertido",records.inversiones.filter(r=>r.moneda===moneda).reduce((s,r)=>s+r.monto,0),"#8e44ad"]].map(([l,v,c])=>(
              <div key={l} style={s.card}><p style={s.label}>{l} (historial)</p><p style={{...s.value,fontSize:15,color:c}}>{fmtShort(v,moneda)}</p></div>
            ))}
          </div>
          {chartLoaded&&<>
            <p style={{fontSize:13,fontWeight:600,margin:"16px 0 8px"}}>Ingresos vs Gastos (mensual)</p>
            <BarChart data={monthlyData(records.ingresos)} color="#1a7a3c" moneda={moneda}/>
            <p style={{fontSize:13,fontWeight:600,margin:"16px 0 10px"}}>Distribución de gastos</p>
            <PieChart data={CAT_GASTO.map(c=>({label:c,value:records.gastos.filter(r=>r.categoria===c&&r.moneda===moneda).reduce((s,r)=>s+r.monto,0)})).filter(x=>x.value>0)}/>
          </>}
        </>}

        {tab==="Config"&&<>
          <div style={{...s.cardBig,marginTop:16}}>
            <p style={{fontWeight:500,marginBottom:12}}>Tu perfil</p>
            <label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Tu nombre</label>
            <input style={s.input} value={userName} onChange={e=>{setUserName(e.target.value);localStorage.setItem("nf_user",e.target.value);}}/>
          </div>
          <div style={s.cardBig}>
            <p style={{fontWeight:500,marginBottom:12}}>Notion</p>
            <p style={{fontSize:13,color:"#888",marginBottom:8}}>Token: ●●●●{token.slice(-4)}</p>
            <button style={s.btn} onClick={()=>loadAll()} disabled={loading}>{loading?"Sincronizando...":"Sincronizar ahora ↗"}</button>
            <button style={{...s.btn,color:"#c0392b",borderColor:"#c0392b"}} onClick={()=>{localStorage.clear();window.location.reload();}}>Desconectar</button>
          </div>
        </>}
      </div>

      <nav style={s.nav}>
        {TABS.map(t=>(
          <button key={t} style={s.navBtn(tab===t)} onClick={()=>setTab(t)}>
            <span style={{fontSize:16}}>{ICONS[t]}</span>
            <span>{t}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}