const sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
let trabajadores=[],registros=[],fotoFile=null,cameraStream=null,trabajadorSeleccionadoId=null,planillaRegistros=[],planillaResumen=[],planillaDetalle=[];
const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
function msg(id,t,c=''){const e=$(id);if(!e)return;e.textContent=t;e.className='msg '+c}
function setSaving(show){const el=$('savingOverlay');if(el)el.classList.toggle('show',!!show)}
function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;")}
function init(){
 $('fechaFiltro').value=today(); if($('fechaPlanilla')) $('fechaPlanilla').value=today(); if($('fechaPlanilla')) $('fechaPlanilla').value=today();
 if($('mobileMenuBtn')) $('mobileMenuBtn').onclick=()=>document.body.classList.toggle('menuOpen');
 if($('mobileOverlay')) $('mobileOverlay').onclick=()=>document.body.classList.remove('menuOpen');
 document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>show(b.dataset.view,b));
 $('btnActualizar').onclick=loadAll;$('btnAgregarTrabajador').onclick=agregarTrabajador;$('btnGuardarAsistencia').onclick=registrarAsistencia;$('cerrarFoto').onclick=cerrarFoto;$('fechaFiltro').onchange=loadAll; if($('btnCalcularPlanilla')) $('btnCalcularPlanilla').onclick=calcularPlanilla; if($('btnExportarPlanilla')) $('btnExportarPlanilla').onclick=exportarPlanillaCSV; if($('btnAgregarFeriado')) $('btnAgregarFeriado').onclick=agregarFeriado; if($('periodoPlanilla')) $('periodoPlanilla').onchange=calcularPlanilla; if($('fechaPlanilla')) $('fechaPlanilla').onchange=calcularPlanilla; if($('trabajadorPlanilla')) $('trabajadorPlanilla').onchange=calcularPlanilla; if($('btnCalcularPlanilla')) $('btnCalcularPlanilla').onclick=calcularPlanilla; if($('btnExportarPlanilla')) $('btnExportarPlanilla').onclick=exportarPlanillaCSV; if($('periodoPlanilla')) $('periodoPlanilla').onchange=calcularPlanilla; if($('fechaPlanilla')) $('fechaPlanilla').onchange=calcularPlanilla; if($('trabajadorPlanilla')) $('trabajadorPlanilla').onchange=calcularPlanilla;
 if($('btnActualizarReporte')) $('btnActualizarReporte').onclick=loadAll; if($('btnExportarCSV')) $('btnExportarCSV').onclick=exportarCSV;
 if($('btnGuardarPersonal')) $('btnGuardarPersonal').onclick=guardarPersonal;
 if($('buscarTrabajador')) $('buscarTrabajador').oninput=renderTrabajadores;
 if($('buscarPersonal')) $('buscarPersonal').oninput=renderPersonal;
 if($('trabajadorSelect')) $('trabajadorSelect').onchange=()=>{trabajadorSeleccionadoId=$('trabajadorSelect').value};
 if($('btnAbrirCamara')) $('btnAbrirCamara').onclick=abrirCamara;
 if($('btnTomarFoto')) $('btnTomarFoto').onclick=tomarFoto;
 if($('btnCerrarCamara')) $('btnCerrarCamara').onclick=cerrarCamara;
 $('fotoInput').onchange=e=>{fotoFile=e.target.files[0]||null;if(fotoFile){const r=new FileReader();r.onload=()=>{$('preview').src=r.result;$('preview').style.display='block';if($('cameraVideo'))$('cameraVideo').style.display='none'};r.readAsDataURL(fotoFile)}};
 realtime();loadAll();setInterval(()=>{if(!window.__loadingST)loadAll()},5000);
}
function show(v,b){document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));$(v).classList.remove('hidden');document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.body.classList.remove('menuOpen');loadAll()}
async function loadAll(){window.__loadingST=true;await cargarTrabajadores();await cargarRegistros();renderDashboard();renderAlertasDashboard();renderTrabajadores();renderSelect();renderPlanillaSelect();renderPlanillaSelect();renderReporte();renderUltimasMarcaciones();renderPersonal();renderPlanillas();if($('lastUpdate'))$('lastUpdate').textContent='Actualizado: '+new Date().toLocaleTimeString('es-BO',{hour:'2-digit',minute:'2-digit'});window.__loadingST=false}
async function cargarTrabajadores(){const {data,error}=await sb.from('trabajadores').select('*').neq('estado','Inactivo').order('created_at',{ascending:true});if(error){alert('Error trabajadores: '+error.message);return}trabajadores=data||[]}
async function cargarRegistros(){const {data,error}=await sb.from('asistencia').select('*').eq('fecha',$('fechaFiltro').value||today()).order('created_at',{ascending:true});if(error){registros=[];console.warn(error.message);return}registros=data||[]}
async function agregarTrabajador(){const nombre=$('nuevoNombre').value.trim(),area=$('nuevaArea').value.trim()||'Sin área';if(!nombre){msg('msgTrabajador','Escribe el nombre.','error');return}msg('msgTrabajador','Guardando...');setSaving(true);const {error}=await sb.from('trabajadores').insert([{nombre,area,estado:'Activo'}]);if(error){setSaving(false);msg('msgTrabajador','Error: '+error.message,'error');return}$('nuevoNombre').value='';$('nuevaArea').value='';msg('msgTrabajador','Trabajador agregado correctamente.','success');setSaving(false);loadAll()}
async function desactivarTrabajador(id){if(!confirm('¿Desactivar trabajador?'))return;const {error}=await sb.from('trabajadores').update({estado:'Inactivo'}).eq('id',id);if(error)alert(error.message);loadAll()} window.desactivarTrabajador=desactivarTrabajador;
async function guardarPersonal(){const nombre=$('pNombre').value.trim(),ci=$('pCI').value.trim(),cargo=$('pCargo').value.trim(),area=$('pArea').value.trim()||'Sin área',telefono=$('pTelefono').value.trim(),fecha_ingreso=$('pIngreso').value||null,direccion=$('pDireccion').value.trim(),sueldo_mensual=parseFloat($('pSueldo')?.value||0)||0,estado=$('pEstado').value||'Activo';if(!nombre){msg('msgPersonal','Escribe el nombre completo.','error');return}msg('msgPersonal','Guardando ficha...');setSaving(true);const {error}=await sb.from('trabajadores').insert([{nombre,area,estado,ci,cargo,telefono,fecha_ingreso,direccion,sueldo_mensual}]);if(error){setSaving(false);msg('msgPersonal','Error: '+error.message,'error');return}['pNombre','pCI','pCargo','pArea','pTelefono','pIngreso','pDireccion','pSueldo'].forEach(id=>{if($(id))$(id).value=''});$('pEstado').value='Activo';msg('msgPersonal','Ficha guardada correctamente.','success');setSaving(false);loadAll()}
async function registrarAsistencia(){const selectedWorkerId=trabajadorSeleccionadoId || $('trabajadorSelect').value;const t=trabajadores.find(x=>String(x.id)===String(selectedWorkerId));const tipo=$('tipoRegistro').value,observacion=$('observacion').value.trim();if(!t){msg('msgAsistencia','Selecciona trabajador.','error');return} if(!confirm('Vas a guardar asistencia para: '+t.nombre+'\nTipo: '+tipo+'\n\n¿Confirmar?')) return;if(!fotoFile&&tipo!=='Ausente'&&tipo!=='Permiso'){msg('msgAsistencia','La foto es obligatoria.','error');return}msg('msgAsistencia','Guardando...');setSaving(true);let foto_url='';if(fotoFile){foto_url=await subirFoto(fotoFile,t.nombre,tipo);if(!foto_url)return}const yaExiste=registros.some(r=>String(r.trabajador_id)===String(t.id)&&r.tipo_registro===tipo);if(yaExiste&&!confirm('Este trabajador ya tiene una marcación de este tipo hoy. ¿Guardar otra de todas formas?')){setSaving(false);return}const ahora=new Date(),fecha=ahora.toISOString().slice(0,10),hora=ahora.toLocaleTimeString('es-BO',{hour:'2-digit',minute:'2-digit'});let estado=tipo==='Ausente'?'Ausente':tipo==='Permiso'?'Permiso':'Presente'; const minEntrada=parseHora(hora); if((tipo.includes('Entrada')||tipo.includes('Retraso')) && minEntrada!==null && minEntrada>HORA_ENTRADA_OFICIAL+MINUTOS_TOLERANCIA) estado='Retraso'; if(tipo==='Retraso') estado='Retraso';const {error}=await sb.from('asistencia').insert([{trabajador_id:t.id,trabajador_nombre:t.nombre,area:t.area,tipo_registro:tipo,estado,observacion,foto_url,fecha,hora}]);if(error){setSaving(false);msg('msgAsistencia','Error: '+error.message,'error');return}$('observacion').value='';$('fotoInput').value='';$('preview').style.display='none';if($('cameraVideo'))$('cameraVideo').style.display='none';fotoFile=null;cerrarCamara();msg('msgAsistencia','Asistencia registrada correctamente.','success');setSaving(false);loadAll()}
async function abrirCamara(){try{if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){msg('msgAsistencia','Este navegador no permite abrir cámara. Usa seleccionar archivo.','error');return}cerrarCamara();cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});const video=$('cameraVideo');video.srcObject=cameraStream;video.style.display='block';$('preview').style.display='none';$('btnTomarFoto').disabled=false;$('btnCerrarCamara').disabled=false;msg('msgAsistencia','Cámara abierta. Presiona Tomar foto.','success')}catch(error){console.error(error);msg('msgAsistencia','No se pudo abrir la cámara. Revisa permisos o usa seleccionar archivo.','error')}}
function cerrarCamara(){if(cameraStream){cameraStream.getTracks().forEach(track=>track.stop());cameraStream=null}if($('cameraVideo')){$('cameraVideo').srcObject=null;$('cameraVideo').style.display='none'}if($('btnTomarFoto'))$('btnTomarFoto').disabled=true;if($('btnCerrarCamara'))$('btnCerrarCamara').disabled=true}
function tomarFoto(){const video=$('cameraVideo'),canvas=$('cameraCanvas');if(!video||!cameraStream){msg('msgAsistencia','Primero abre la cámara.','error');return}canvas.width=video.videoWidth||1280;canvas.height=video.videoHeight||720;canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>{if(!blob){msg('msgAsistencia','No se pudo capturar la foto.','error');return}fotoFile=new File([blob],`asistencia_${Date.now()}.jpg`,{type:'image/jpeg'});$('preview').src=URL.createObjectURL(blob);$('preview').style.display='block';video.style.display='none';msg('msgAsistencia','Foto capturada correctamente.','success')},'image/jpeg',0.86)}
async function subirFoto(file,nombre,tipo){const ext=file.name.split('.').pop()||'jpg';const clean=nombre.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]/g,'_');const path=`${today()}/${Date.now()}_${clean}_${tipo.replace(/\s+/g,'_')}.${ext}`;const {error}=await sb.storage.from(STORAGE_BUCKET).upload(path,file,{cacheControl:'3600',upsert:false});if(error){msg('msgAsistencia','Error foto: '+error.message,'error');return''}return sb.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl}

function normalizarTipo(tipo){
 return String(tipo||'').toLowerCase()
   .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function buscarRegistroPorTipo(rs, grupo){
 const matchers={
   entrada: ['entrada 08','entrada','ingreso','retraso'],
   salida12: ['salida 12','medio dia','mediodia','almuerzo'],
   retorno: ['retorno','entrada 14','14:00'],
   salida18: ['salida 18','salida final','fin jornada','completo']
 };
 const palabras=matchers[grupo]||[];
 return rs.find(r=>{
   const tipo=normalizarTipo(r.tipo_registro);
   return palabras.some(p=>tipo.includes(p));
 });
}
function primerRegistroConHora(rs){
 return rs.find(r=>r.hora);
}


const HORA_ENTRADA_OFICIAL = 8 * 60; // 08:00
const MINUTOS_TOLERANCIA = 0;

function minutosDeHoraTexto(hora){
 return parseHora(hora);
}
function esEntradaRegistro(r){
 const tipo=normalizarTipo(r.tipo_registro);
 return tipo.includes('entrada') || tipo.includes('ingreso') || tipo.includes('retraso');
}
function estadoAutomaticoRegistro(r){
 const tipo=normalizarTipo(r.tipo_registro);
 if(tipo.includes('ausente')) return 'Ausente';
 if(tipo.includes('permiso')) return 'Permiso';
 if(esEntradaRegistro(r)){
   const min=minutosDeHoraTexto(r.hora);
   if(min!==null && min > HORA_ENTRADA_OFICIAL + MINUTOS_TOLERANCIA) return 'Retraso';
   if(tipo.includes('retraso')) return 'Retraso';
   return 'Presente';
 }
 return r.estado || 'Presente';
}
function estadoDiaTrabajador(t){
 const rs=registros.filter(r=>String(r.trabajador_id)===String(t.id));
 if(!rs.length) return 'Ausente';
 if(rs.some(r=>estadoAutomaticoRegistro(r)==='Retraso')) return 'Retraso';
 if(rs.some(r=>estadoAutomaticoRegistro(r)==='Permiso')) return 'Permiso';
 if(rs.some(r=>estadoAutomaticoRegistro(r)==='Presente')) return 'Presente';
 return 'Ausente';
}
function datosDiaTrabajadores(){
 return trabajadores.map(t=>{
   const rs=registros.filter(r=>String(r.trabajador_id)===String(t.id));
   const entrada=buscarRegistroPorTipo(rs,'entrada')||primerRegistroConHora(rs);
   const estado=estadoDiaTrabajador(t);
   return {trabajador:t, registros:rs, entrada, estado};
 });
}

function estadoTrab(t){
 const rs=registros.filter(r=>String(r.trabajador_id)===String(t.id));
 let e='Ausente';
 if(rs.some(r=>r.hora)) e='Presente';
 if(rs.some(r=>r.estado==='Presente')) e='Presente';
 if(rs.some(r=>r.estado==='Retraso')) e='Retraso';
 if(rs.some(r=>r.estado==='Permiso')) e='Permiso';
 if(rs.some(r=>r.estado==='Ausente' && !rs.some(x=>x.hora && x.estado!=='Ausente'))) e='Ausente';
 return e;
}
function renderDashboard(){const rows=trabajadores.map((t,i)=>{const rs=registros.filter(r=>String(r.trabajador_id)===String(t.id));return{...t,idx:i+1,estado:estadoTrab(t),entrada:buscarRegistroPorTipo(rs,'entrada')||primerRegistroConHora(rs),salida12:buscarRegistroPorTipo(rs,'salida12'),retorno:buscarRegistroPorTipo(rs,'retorno'),salida18:buscarRegistroPorTipo(rs,'salida18'),foto_url:[...rs].reverse().find(r=>r.foto_url)?.foto_url||''}});$('presentes').textContent=rows.filter(r=>r.estado==='Presente').length;$('ausentes').textContent=rows.filter(r=>r.estado==='Ausente').length;$('retrasos').textContent=rows.filter(r=>r.estado==='Retraso').length;$('total').textContent=trabajadores.length;$('tablaDashboard').innerHTML=rows.map(r=>`<tr><td>${r.idx}</td><td><span class="avatar">${esc(r.nombre).charAt(0)}</span>${esc(r.nombre)}</td><td>${esc(r.area)}</td><td>${r.entrada?.hora||'--'}</td><td>${r.salida12?.hora||'--'}</td><td>${r.retorno?.hora||'--'}</td><td>${r.salida18?.hora||'--'}</td><td>${badge(r.estado)}</td><td>${fotoBtn(r.foto_url)}</td></tr>`).join('')||'<tr><td colspan="9" class="muted">Sin trabajadores activos.</td></tr>'}

function renderAlertasDashboard(){
 const lateBox=$('listaRetrasosDash'), absentBox=$('listaAusentesDash');
 if(!lateBox || !absentBox) return;
 const datos=datosDiaTrabajadores();
 const retrasos=datos.filter(x=>x.estado==='Retraso');
 const ausentes=datos.filter(x=>x.estado==='Ausente');
 lateBox.innerHTML=retrasos.map(x=>`<div class="alertItem"><div><b>${esc(x.trabajador.nombre)}</b><br><span class="muted">${esc(x.trabajador.area||'Sin área')} · Entrada: ${x.entrada?.hora||'--'}</span></div>${badge('Retraso')}</div>`).join('') || '<p class="muted">No hay retrasos registrados.</p>';
 absentBox.innerHTML=ausentes.map(x=>`<div class="alertItem"><div><b>${esc(x.trabajador.nombre)}</b><br><span class="muted">${esc(x.trabajador.area||'Sin área')}</span></div>${badge('Ausente')}</div>`).join('') || '<p class="muted">No hay ausentes.</p>';
}

function renderTrabajadores(){const q=($('buscarTrabajador')?.value||'').toLowerCase().trim();const lista=trabajadores.filter(t=>!q||String(t.nombre).toLowerCase().includes(q)||String(t.area||'').toLowerCase().includes(q));$('listaTrabajadores').innerHTML=lista.map(t=>`<div class="workerRow"><div><b>${esc(t.nombre)}</b><br><span class="muted">${esc(t.area)}</span></div><button class="btnDanger" onclick="desactivarTrabajador('${t.id}')">Desactivar</button></div>`).join('')||'<p class="muted">No se encontraron trabajadores.</p>'}
function renderSelect(){
 const sel=$('trabajadorSelect'); 
 if(!sel) return;
 const antes=trabajadorSeleccionadoId || sel.value;
 sel.innerHTML=trabajadores.map(t=>`<option value="${t.id}">${esc(t.nombre)} - ${esc(t.area)}</option>`).join('');
 if(antes && trabajadores.some(t=>String(t.id)===String(antes))){
   sel.value=antes;
   trabajadorSeleccionadoId=antes;
 }else if(trabajadores.length){
   trabajadorSeleccionadoId=sel.value;
 }
}
function renderPersonal(){const box=$('listaPersonal');if(!box)return;const q=($('buscarPersonal')?.value||'').toLowerCase().trim();const lista=trabajadores.filter(t=>{const texto=[t.nombre,t.ci,t.cargo,t.area,t.telefono].join(' ').toLowerCase();return !q||texto.includes(q)});box.innerHTML=lista.map(t=>`<div class="personalCard"><div class="personalHead"><div style="display:flex;gap:12px;align-items:center"><div class="personalAvatar">${esc(t.nombre).charAt(0)}</div><div><b>${esc(t.nombre)}</b><br><span class="muted">${esc(t.cargo||'Sin cargo')} · ${esc(t.area||'Sin área')}</span></div></div>${badge(t.estado||'Activo')}</div><div class="personalMeta"><div><b>CI:</b> ${esc(t.ci||'-')}</div><div><b>Teléfono:</b> ${esc(t.telefono||'-')}</div><div><b>Ingreso:</b> ${esc(t.fecha_ingreso||'-')}</div><div><b>Dirección:</b> ${esc(t.direccion||'-')}</div></div><button class="btnDanger" onclick="desactivarTrabajador('${t.id}')">Desactivar</button></div>`).join('')||'<p class="muted">No hay fichas registradas.</p>'}
function renderReporte(){
 const datos=datosDiaTrabajadores();
 const retrasos=datos.filter(x=>x.estado==='Retraso').length;
 const ausentes=datos.filter(x=>x.estado==='Ausente').length;
 if($('repRetrasos')) $('repRetrasos').textContent=retrasos;
 if($('repAusentes')) $('repAusentes').textContent=ausentes;
 if($('repTotal'))$('repTotal').textContent=registros.length;
 if($('repFotos'))$('repFotos').textContent=registros.filter(r=>r.foto_url).length;
 if($('repFecha'))$('repFecha').textContent=$('fechaFiltro').value||today();
 $('tablaReporte').innerHTML=registros.map(r=>{
   const estadoAuto=estadoAutomaticoRegistro(r);
   return `<tr><td>${r.hora||''}</td><td>${esc(r.trabajador_nombre)}</td><td>${esc(r.area)}</td><td>${esc(r.tipo_registro)}</td><td>${badge(estadoAuto)}</td><td>${fotoBtn(r.foto_url)}</td><td>${esc(r.observacion)}</td></tr>`;
 }).join('')||'<tr><td colspan="7" class="muted">Sin registros para esta fecha.</td></tr>';
}
function renderUltimasMarcaciones(){const box=$('ultimasMarcaciones');if(!box)return;const ult=[...registros].reverse().slice(0,8);box.innerHTML=ult.map(r=>`<div class="recentItem"><div><b>${esc(r.trabajador_nombre)}</b><br><span class="muted">${esc(r.tipo_registro)} · ${r.hora||''}</span></div><div>${badge(r.estado)}</div></div>`).join('')||'<p class="muted">Aún no hay marcaciones hoy.</p>'}
function renderPlanillas(){if($('plTrabajados'))$('plTrabajados').textContent=registros.filter(r=>r.estado==='Presente').length;if($('plRetrasos'))$('plRetrasos').textContent=registros.filter(r=>r.estado==='Retraso').length;if($('plFaltas'))$('plFaltas').textContent=trabajadores.length-registros.filter(r=>r.estado==='Presente'||r.estado==='Retraso').length}
function badge(t){return `<span class="badge ${String(t).replace(/\s/g,'-')}">${esc(t)}</span>`}
function fotoBtn(u){return u?`<button class="fotoBtn" onclick="abrirFoto('${u}')">▧ Ver foto</button>`:'--'}
function abrirFoto(u){$('fotoGrande').src=u;$('fotoModal').classList.add('show')}window.abrirFoto=abrirFoto;function cerrarFoto(){$('fotoModal').classList.remove('show');$('fotoGrande').src=''}

function exportarCSV(){
 const fecha=$('fechaFiltro').value||today();
 const headers=['Fecha','Hora','Trabajador','Area','Registro','Estado','Observacion','Foto'];
 const rows=registros.map(r=>[fecha,r.hora||'',r.trabajador_nombre||'',r.area||'',r.tipo_registro||'',estadoAutomaticoRegistro(r)||'',r.observacion||'',r.foto_url||'']);
 const csv=[headers,...rows].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');
 a.href=url;
 a.download=`reporte_asistencia_${fecha}.csv`;
 a.click();
 URL.revokeObjectURL(url);
}


function renderPlanillaSelect(){
 const sel=$('trabajadorPlanilla'); if(!sel) return;
 const actual=sel.value;
 sel.innerHTML='<option value="">Todos</option>'+trabajadores.map(t=>`<option value="${t.id}">${esc(t.nombre)} - ${esc(t.area||'Sin área')}</option>`).join('');
 if(actual && trabajadores.some(t=>String(t.id)===String(actual))) sel.value=actual;
}
function rangoPlanilla(){
 const base=$('fechaPlanilla')?.value || today();
 const tipo=$('periodoPlanilla')?.value || 'dia';
 const d=new Date(base+'T12:00:00');
 let ini=new Date(d), fin=new Date(d);
 if(tipo==='semana'){
   const day=d.getDay() || 7;
   ini.setDate(d.getDate()-day+1);
   fin=new Date(ini); fin.setDate(ini.getDate()+6);
 }else if(tipo==='mes'){
   ini=new Date(d.getFullYear(),d.getMonth(),1,12,0,0);
   fin=new Date(d.getFullYear(),d.getMonth()+1,0,12,0,0);
 }
 const f=x=>x.toISOString().slice(0,10);
 return {tipo, inicio:f(ini), fin:f(fin)};
}
function minutosAHoras(min){
 min=Math.max(0,Math.round(min||0));
 const h=Math.floor(min/60), m=min%60;
 return `${h}:${String(m).padStart(2,'0')}`;
}
function parseHora(hora){
 const raw=String(hora||'').trim().toLowerCase();
 if(!raw) return null;
 const m=raw.match(/(\d{1,2})[:.](\d{2})/);
 if(!m) return null;
 let h=parseInt(m[1],10), min=parseInt(m[2],10);
 const isPM=raw.includes('p') || raw.includes('pm');
 const isAM=raw.includes('a') || raw.includes('am');
 if(isPM && h<12) h+=12;
 if(isAM && h===12) h=0;
 return h*60+min;
}
function calcularHorasDia(rs){
 const entrada=buscarRegistroPorTipo(rs,'entrada') || primerRegistroConHora(rs);
 const salida12=buscarRegistroPorTipo(rs,'salida12');
 const retorno=buscarRegistroPorTipo(rs,'retorno');
 const salida18=buscarRegistroPorTipo(rs,'salida18');

 const e=parseHora(entrada?.hora);
 const s12=parseHora(salida12?.hora);
 const r=parseHora(retorno?.hora);
 const s18=parseHora(salida18?.hora);

 let minutos=0;
 if(e!==null && s12!==null && s12>e) minutos += s12-e;
 if(r!==null && s18!==null && s18>r) minutos += s18-r;
 if(minutos===0 && e!==null && s18!==null && s18>e) minutos=s18-e;
 return {minutos, entrada, salida12, retorno, salida18};
}
function diasEntre(inicio, fin){
 const out=[];
 let d=new Date(inicio+'T12:00:00');
 const end=new Date(fin+'T12:00:00');
 while(d<=end){
   out.push(d.toISOString().slice(0,10));
   d.setDate(d.getDate()+1);
 }
 return out;
}
function estadoTrabajadorPorRegistros(rs){
 if(!rs.length) return 'Ausente';
 if(rs.some(r=>estadoAutomaticoRegistro(r)==='Retraso')) return 'Retraso';
 if(rs.some(r=>estadoAutomaticoRegistro(r)==='Permiso')) return 'Permiso';
 if(rs.some(r=>estadoAutomaticoRegistro(r)==='Ausente') && !rs.some(x=>x.hora && estadoAutomaticoRegistro(x)!=='Ausente')) return 'Ausente';
 return 'Presente';
}
async function calcularPlanilla(){
 const tabla=$('tablaPlanillas'), detalle=$('tablaDetallePlanilla');
 if(!tabla || !detalle) return;
 const {tipo,inicio,fin}=rangoPlanilla();
 $('plPeriodoTexto').textContent = tipo==='dia' ? inicio : `${inicio} al ${fin}`;
 tabla.innerHTML='<tr><td colspan="7" class="muted">Calculando...</td></tr>';
 detalle.innerHTML='<tr><td colspan="8" class="muted">Cargando registros...</td></tr>';

 let q=sb.from('asistencia').select('*').gte('fecha',inicio).lte('fecha',fin).order('fecha',{ascending:true}).order('created_at',{ascending:true});
 const trabajadorFiltro=$('trabajadorPlanilla')?.value || '';
 if(trabajadorFiltro) q=q.eq('trabajador_id',trabajadorFiltro);
 const {data,error}=await q;
 if(error){
   tabla.innerHTML=`<tr><td colspan="7" class="error">Error: ${esc(error.message)}</td></tr>`;
   detalle.innerHTML='';
   return;
 }
 planillaRegistros=data||[];
 const trabajadoresBase=trabajadorFiltro ? trabajadores.filter(t=>String(t.id)===String(trabajadorFiltro)) : trabajadores;
 const dias=diasEntre(inicio,fin);
 const resumen=[];
 const det=[];

 trabajadoresBase.forEach(t=>{
   let totalMin=0, diasConRegistro=0, retrasos=0;
   dias.forEach(fecha=>{
     const rs=planillaRegistros.filter(r=>String(r.trabajador_id)===String(t.id) && r.fecha===fecha);
     if(rs.length){
       diasConRegistro++;
       if(rs.some(r=>r.estado==='Retraso' || normalizarTipo(r.tipo_registro).includes('retraso'))) retrasos++;
     }
     const calc=calcularHorasDia(rs);
     totalMin+=calc.minutos;
     if(rs.length){
       det.push({
         fecha,
         trabajador:t.nombre,
         entrada:calc.entrada?.hora||'--',
         salida12:calc.salida12?.hora||'--',
         retorno:calc.retorno?.hora||'--',
         salida18:calc.salida18?.hora||'--',
         horas:minutosAHoras(calc.minutos),
         estado:estadoTrabajadorPorRegistros(rs)
       });
     }
   });
   const faltas=Math.max(0,dias.length-diasConRegistro);
   resumen.push({trabajador:t.nombre, area:t.area||'Sin área', diasConRegistro, horas:minutosAHoras(totalMin), minutos:totalMin, retrasos, faltas, detalle:`${diasConRegistro}/${dias.length} días`});
 });
 planillaResumen=resumen;
 planillaDetalle=det;
 $('plTotalHoras').textContent=minutosAHoras(resumen.reduce((a,b)=>a+b.minutos,0));
 $('plTotalTrabajadores').textContent=resumen.length;
 tabla.innerHTML=resumen.map(r=>`<tr><td>${esc(r.trabajador)}</td><td>${esc(r.area)}</td><td>${r.diasConRegistro}</td><td><b>${r.horas}</b></td><td>${r.retrasos}</td><td>${r.faltas}</td><td>${esc(r.detalle)}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">Sin trabajadores.</td></tr>';
 detalle.innerHTML=det.map(r=>`<tr><td>${r.fecha}</td><td>${esc(r.trabajador)}</td><td>${r.entrada}</td><td>${r.salida12}</td><td>${r.retorno}</td><td>${r.salida18}</td><td><b>${r.horas}</b></td><td>${badge(r.estado)}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">Sin registros en este periodo.</td></tr>';
}
async function exportarPlanillaCSV(){
 if(!planillaResumen.length) await calcularPlanilla();
 if(!planillaResumen.length) return;
 const {tipo,inicio,fin}=rangoPlanilla();
 const headers=['Periodo','Inicio','Fin','Trabajador','Area','Dias con registro','Horas trabajadas','Retrasos','Faltas estimadas','Detalle'];
 const rows=planillaResumen.map(r=>[tipo,inicio,fin,r.trabajador,r.area,r.diasConRegistro,r.horas,r.retrasos,r.faltas,r.detalle]);
 const csv=[headers,...rows].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');
 a.href=url;
 a.download=`planilla_horas_${tipo}_${inicio}_${fin}.csv`;
 a.click();
 URL.revokeObjectURL(url);
}


function dinero(n){return 'Bs '+Number(n||0).toFixed(2)}
function horasADecimal(min){return Math.round((min||0)/60*100)/100}
function renderPlanillaSelect(){
 const sel=$('trabajadorPlanilla'); if(!sel) return;
 const actual=sel.value;
 sel.innerHTML='<option value="">Todos</option>'+trabajadores.map(t=>`<option value="${t.id}">${esc(t.nombre)} - ${esc(t.area||'Sin área')}</option>`).join('');
 if(actual && trabajadores.some(t=>String(t.id)===String(actual))) sel.value=actual;
}
function esFeriado(fecha){return feriados.find(f=>f.fecha===fecha)}
function horasEsperadasFecha(fecha, rs=[]){
 if(esFeriado(fecha)) return 0;
 const dia=(new Date(fecha+'T12:00:00')).getDay();
 if(dia===0) return 0;
 if(dia===6){
   const trabajoTarde = rs.some(r=>{
     const tipo=normalizarTipo(r.tipo_registro);
     return tipo.includes('retorno') || tipo.includes('14:00') || tipo.includes('salida 18') || tipo.includes('completo');
   });
   return trabajoTarde ? 8 : 4;
 }
 return 8;
}
async function cargarFeriados(inicio,fin){
 const {data,error}=await sb.from('feriados').select('*').gte('fecha',inicio).lte('fecha',fin).order('fecha',{ascending:true});
 if(error){console.warn('Feriados no disponible:',error.message);feriados=[];return}
 feriados=data||[];
 renderFeriados();
}
function renderFeriados(){
 const box=$('listaFeriados'); if(!box)return;
 box.innerHTML=feriados.map(f=>`<div class="workerRow"><div><b>${esc(f.nombre)}</b><br><span class="muted">${f.fecha}</span></div><button class="btnDanger" onclick="eliminarFeriado('${f.id}')">Eliminar</button></div>`).join('') || '<p class="muted">No hay feriados registrados en este periodo.</p>';
}
async function agregarFeriado(){
 const fecha=$('feriadoFecha')?.value;
 const nombre=$('feriadoNombre')?.value.trim()||'Feriado';
 if(!fecha){alert('Elige la fecha del feriado.');return}
 const {error}=await sb.from('feriados').insert([{fecha,nombre}]);
 if(error){alert('Error agregando feriado: '+error.message);return}
 $('feriadoNombre').value='';
 await calcularPlanilla();
}
async function eliminarFeriado(id){
 if(!confirm('¿Eliminar feriado?'))return;
 const {error}=await sb.from('feriados').delete().eq('id',id);
 if(error){alert(error.message);return}
 await calcularPlanilla();
}
window.eliminarFeriado=eliminarFeriado;
async function calcularPlanilla(){
 const tabla=$('tablaPlanillas'), detalle=$('tablaDetallePlanilla');
 if(!tabla || !detalle) return;
 const {tipo,inicio,fin}=rangoPlanilla();
 await cargarFeriados(inicio,fin);
 $('plPeriodoTexto').textContent = tipo==='dia' ? inicio : `${inicio} al ${fin}`;
 tabla.innerHTML='<tr><td colspan="10" class="muted">Calculando...</td></tr>';
 detalle.innerHTML='<tr><td colspan="10" class="muted">Cargando registros...</td></tr>';
 let q=sb.from('asistencia').select('*').gte('fecha',inicio).lte('fecha',fin).order('fecha',{ascending:true}).order('created_at',{ascending:true});
 const trabajadorFiltro=$('trabajadorPlanilla')?.value || '';
 if(trabajadorFiltro) q=q.eq('trabajador_id',trabajadorFiltro);
 const {data,error}=await q;
 if(error){tabla.innerHTML=`<tr><td colspan="10" class="error">Error: ${esc(error.message)}</td></tr>`;detalle.innerHTML='';return}
 planillaRegistros=data||[];
 const trabajadoresBase=trabajadorFiltro ? trabajadores.filter(t=>String(t.id)===String(trabajadorFiltro)) : trabajadores;
 const dias=diasEntre(inicio,fin);
 const resumen=[], det=[];
 trabajadoresBase.forEach(t=>{
   let trabajadosMin=0, esperadasHoras=0, retrasos=0, feriadosPeriodo=0;
   dias.forEach(fecha=>{
     const fer=esFeriado(fecha);
     const rs=planillaRegistros.filter(r=>String(r.trabajador_id)===String(t.id) && r.fecha===fecha);
     const esperadas=horasEsperadasFecha(fecha,rs);
     if(fer) feriadosPeriodo++;
     esperadasHoras += esperadas;
     if(rs.some(r=>r.estado==='Retraso'||normalizarTipo(r.tipo_registro).includes('retraso'))) retrasos++;
     const calc=calcularHorasDia(rs);
     trabajadosMin += calc.minutos;
     if(rs.length || esperadas>0 || fer){
       det.push({fecha,trabajador:t.nombre,entrada:calc.entrada?.hora||'--',salida12:calc.salida12?.hora||'--',retorno:calc.retorno?.hora||'--',salida18:calc.salida18?.hora||'--',horas:minutosAHoras(calc.minutos),esperadas:esperadas+':00',feriado:fer?fer.nombre:'--',estado:rs.length?estadoTrabajadorPorRegistros(rs):(fer?'Feriado':'Ausente')});
     }
   });
   const trabajadasHoras=horasADecimal(trabajadosMin);
   const sueldo=Number(t.sueldo_mensual||0);
   const valorHora=esperadasHoras>0 ? sueldo/esperadasHoras : 0;
   const horasPagables=Math.min(trabajadasHoras,esperadasHoras);
   const totalPagar=valorHora*horasPagables;
   resumen.push({trabajador:t.nombre,area:t.area||'Sin área',sueldo,esperadasHoras,horas:minutosAHoras(trabajadosMin),trabajadasHoras,faltantes:Math.max(0,esperadasHoras-trabajadasHoras),extras:Math.max(0,trabajadasHoras-esperadasHoras),retrasos,feriadosPeriodo,totalPagar});
 });
 planillaResumen=resumen; planillaDetalle=det;
 $('plTotalHoras').textContent=minutosAHoras(resumen.reduce((a,b)=>a+(b.trabajadasHoras*60),0));
 $('plTotalPagar').textContent=dinero(resumen.reduce((a,b)=>a+b.totalPagar,0));
 tabla.innerHTML=resumen.map(r=>`<tr><td>${esc(r.trabajador)}</td><td>${esc(r.area)}</td><td>${dinero(r.sueldo)}</td><td>${r.esperadasHoras.toFixed(2)}</td><td><b>${r.horas}</b></td><td>${r.faltantes.toFixed(2)}</td><td>${r.extras.toFixed(2)}</td><td>${r.feriadosPeriodo}</td><td>${r.retrasos}</td><td><b>${dinero(r.totalPagar)}</b></td></tr>`).join('') || '<tr><td colspan="10" class="muted">Sin trabajadores.</td></tr>';
 detalle.innerHTML=det.map(r=>`<tr><td>${r.fecha}</td><td>${esc(r.trabajador)}</td><td>${r.entrada}</td><td>${r.salida12}</td><td>${r.retorno}</td><td>${r.salida18}</td><td><b>${r.horas}</b></td><td>${r.esperadas}</td><td>${esc(r.feriado)}</td><td>${badge(r.estado)}</td></tr>`).join('') || '<tr><td colspan="10" class="muted">Sin registros en este periodo.</td></tr>';
}
async function exportarPlanillaCSV(){
 if(!planillaResumen.length) await calcularPlanilla();
 if(!planillaResumen.length) return;
 const {tipo,inicio,fin}=rangoPlanilla();
 const headers=['Periodo','Inicio','Fin','Trabajador','Area','Sueldo mensual','Horas esperadas','Horas trabajadas','Horas faltantes','Horas extra','Feriados','Retrasos','Total a pagar'];
 const rows=planillaResumen.map(r=>[tipo,inicio,fin,r.trabajador,r.area,r.sueldo,r.esperadasHoras,r.trabajadasHoras,r.faltantes,r.extras,r.feriadosPeriodo,r.retrasos,r.totalPagar.toFixed(2)]);
 const csv=[headers,...rows].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a'); a.href=url; a.download=`planilla_mensual_${tipo}_${inicio}_${fin}.csv`; a.click(); URL.revokeObjectURL(url);
}

function realtime(){sb.channel('st-real').on('postgres_changes',{event:'*',schema:'public',table:'trabajadores'},loadAll).on('postgres_changes',{event:'*',schema:'public',table:'asistencia'},loadAll).subscribe()}
init();
