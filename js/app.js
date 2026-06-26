const sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
let trabajadores=[],registros=[],fotoFile=null,cameraStream=null,trabajadorSeleccionadoId=null;
const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
function msg(id,t,c=''){const e=$(id);if(!e)return;e.textContent=t;e.className='msg '+c}
function setSaving(show){const el=$('savingOverlay');if(el)el.classList.toggle('show',!!show)}
function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;")}
function init(){
 $('fechaFiltro').value=today();
 if($('mobileMenuBtn')) $('mobileMenuBtn').onclick=()=>document.body.classList.toggle('menuOpen');
 if($('mobileOverlay')) $('mobileOverlay').onclick=()=>document.body.classList.remove('menuOpen');
 document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>show(b.dataset.view,b));
 $('btnActualizar').onclick=loadAll;$('btnAgregarTrabajador').onclick=agregarTrabajador;$('btnGuardarAsistencia').onclick=registrarAsistencia;$('cerrarFoto').onclick=cerrarFoto;$('fechaFiltro').onchange=loadAll;
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
async function loadAll(){window.__loadingST=true;await cargarTrabajadores();await cargarRegistros();renderDashboard();renderTrabajadores();renderSelect();renderReporte();renderUltimasMarcaciones();renderPersonal();renderPlanillas();if($('lastUpdate'))$('lastUpdate').textContent='Actualizado: '+new Date().toLocaleTimeString('es-BO',{hour:'2-digit',minute:'2-digit'});window.__loadingST=false}
async function cargarTrabajadores(){const {data,error}=await sb.from('trabajadores').select('*').neq('estado','Inactivo').order('created_at',{ascending:true});if(error){alert('Error trabajadores: '+error.message);return}trabajadores=data||[]}
async function cargarRegistros(){const {data,error}=await sb.from('asistencia').select('*').eq('fecha',$('fechaFiltro').value||today()).order('created_at',{ascending:true});if(error){registros=[];console.warn(error.message);return}registros=data||[]}
async function agregarTrabajador(){const nombre=$('nuevoNombre').value.trim(),area=$('nuevaArea').value.trim()||'Sin área';if(!nombre){msg('msgTrabajador','Escribe el nombre.','error');return}msg('msgTrabajador','Guardando...');setSaving(true);const {error}=await sb.from('trabajadores').insert([{nombre,area,estado:'Activo'}]);if(error){setSaving(false);msg('msgTrabajador','Error: '+error.message,'error');return}$('nuevoNombre').value='';$('nuevaArea').value='';msg('msgTrabajador','Trabajador agregado correctamente.','success');setSaving(false);loadAll()}
async function desactivarTrabajador(id){if(!confirm('¿Desactivar trabajador?'))return;const {error}=await sb.from('trabajadores').update({estado:'Inactivo'}).eq('id',id);if(error)alert(error.message);loadAll()} window.desactivarTrabajador=desactivarTrabajador;
async function guardarPersonal(){const nombre=$('pNombre').value.trim(),ci=$('pCI').value.trim(),cargo=$('pCargo').value.trim(),area=$('pArea').value.trim()||'Sin área',telefono=$('pTelefono').value.trim(),fecha_ingreso=$('pIngreso').value||null,direccion=$('pDireccion').value.trim(),estado=$('pEstado').value||'Activo';if(!nombre){msg('msgPersonal','Escribe el nombre completo.','error');return}msg('msgPersonal','Guardando ficha...');setSaving(true);const {error}=await sb.from('trabajadores').insert([{nombre,area,estado,ci,cargo,telefono,fecha_ingreso,direccion}]);if(error){setSaving(false);msg('msgPersonal','Error: '+error.message,'error');return}['pNombre','pCI','pCargo','pArea','pTelefono','pIngreso','pDireccion'].forEach(id=>$(id).value='');$('pEstado').value='Activo';msg('msgPersonal','Ficha guardada correctamente.','success');setSaving(false);loadAll()}
async function registrarAsistencia(){const selectedWorkerId=trabajadorSeleccionadoId || $('trabajadorSelect').value;const t=trabajadores.find(x=>String(x.id)===String(selectedWorkerId));const tipo=$('tipoRegistro').value,observacion=$('observacion').value.trim();if(!t){msg('msgAsistencia','Selecciona trabajador.','error');return} if(!confirm('Vas a guardar asistencia para: '+t.nombre+'\nTipo: '+tipo+'\n\n¿Confirmar?')) return;if(!fotoFile&&tipo!=='Ausente'&&tipo!=='Permiso'){msg('msgAsistencia','La foto es obligatoria.','error');return}msg('msgAsistencia','Guardando...');setSaving(true);let foto_url='';if(fotoFile){foto_url=await subirFoto(fotoFile,t.nombre,tipo);if(!foto_url)return}const yaExiste=registros.some(r=>String(r.trabajador_id)===String(t.id)&&r.tipo_registro===tipo);if(yaExiste&&!confirm('Este trabajador ya tiene una marcación de este tipo hoy. ¿Guardar otra de todas formas?')){setSaving(false);return}const ahora=new Date(),fecha=ahora.toISOString().slice(0,10),hora=ahora.toLocaleTimeString('es-BO',{hour:'2-digit',minute:'2-digit'});const estado=tipo==='Ausente'?'Ausente':tipo==='Retraso'?'Retraso':tipo==='Permiso'?'Permiso':'Presente';const {error}=await sb.from('asistencia').insert([{trabajador_id:t.id,trabajador_nombre:t.nombre,area:t.area,tipo_registro:tipo,estado,observacion,foto_url,fecha,hora}]);if(error){setSaving(false);msg('msgAsistencia','Error: '+error.message,'error');return}$('observacion').value='';$('fotoInput').value='';$('preview').style.display='none';if($('cameraVideo'))$('cameraVideo').style.display='none';fotoFile=null;cerrarCamara();msg('msgAsistencia','Asistencia registrada correctamente.','success');setSaving(false);loadAll()}
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
function renderReporte(){if($('repTotal'))$('repTotal').textContent=registros.length;if($('repFotos'))$('repFotos').textContent=registros.filter(r=>r.foto_url).length;if($('repFecha'))$('repFecha').textContent=$('fechaFiltro').value||today();$('tablaReporte').innerHTML=registros.map(r=>`<tr><td>${r.hora||''}</td><td>${esc(r.trabajador_nombre)}</td><td>${esc(r.area)}</td><td>${esc(r.tipo_registro)}</td><td>${badge(r.estado)}</td><td>${fotoBtn(r.foto_url)}</td><td>${esc(r.observacion)}</td></tr>`).join('')||'<tr><td colspan="7" class="muted">Sin registros para esta fecha.</td></tr>'}
function renderUltimasMarcaciones(){const box=$('ultimasMarcaciones');if(!box)return;const ult=[...registros].reverse().slice(0,8);box.innerHTML=ult.map(r=>`<div class="recentItem"><div><b>${esc(r.trabajador_nombre)}</b><br><span class="muted">${esc(r.tipo_registro)} · ${r.hora||''}</span></div><div>${badge(r.estado)}</div></div>`).join('')||'<p class="muted">Aún no hay marcaciones hoy.</p>'}
function renderPlanillas(){if($('plTrabajados'))$('plTrabajados').textContent=registros.filter(r=>r.estado==='Presente').length;if($('plRetrasos'))$('plRetrasos').textContent=registros.filter(r=>r.estado==='Retraso').length;if($('plFaltas'))$('plFaltas').textContent=trabajadores.length-registros.filter(r=>r.estado==='Presente'||r.estado==='Retraso').length}
function badge(t){return `<span class="badge ${String(t).replace(/\s/g,'-')}">${esc(t)}</span>`}
function fotoBtn(u){return u?`<button class="fotoBtn" onclick="abrirFoto('${u}')">▧ Ver foto</button>`:'--'}
function abrirFoto(u){$('fotoGrande').src=u;$('fotoModal').classList.add('show')}window.abrirFoto=abrirFoto;function cerrarFoto(){$('fotoModal').classList.remove('show');$('fotoGrande').src=''}

function exportarCSV(){
 const fecha=$('fechaFiltro').value||today();
 const headers=['Fecha','Hora','Trabajador','Area','Registro','Estado','Observacion','Foto'];
 const rows=registros.map(r=>[fecha,r.hora||'',r.trabajador_nombre||'',r.area||'',r.tipo_registro||'',r.estado||'',r.observacion||'',r.foto_url||'']);
 const csv=[headers,...rows].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');
 a.href=url;
 a.download=`reporte_asistencia_${fecha}.csv`;
 a.click();
 URL.revokeObjectURL(url);
}

function realtime(){sb.channel('st-real').on('postgres_changes',{event:'*',schema:'public',table:'trabajadores'},loadAll).on('postgres_changes',{event:'*',schema:'public',table:'asistencia'},loadAll).subscribe()}
init();
