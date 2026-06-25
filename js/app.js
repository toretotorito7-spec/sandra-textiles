const sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
let trabajadores=[],registros=[],fotoFile=null,cameraStream=null;
const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
function msg(id,t,c=''){const e=$(id);e.textContent=t;e.className='msg '+c}
function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function init(){
 if($('mobileMenuBtn')) $('mobileMenuBtn').onclick=()=>document.body.classList.toggle('menuOpen');
 if($('mobileOverlay')) $('mobileOverlay').onclick=()=>document.body.classList.remove('menuOpen');
 $('fechaFiltro').value=today();
 document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>show(b.dataset.view,b));
 $('btnActualizar').onclick=loadAll;$('btnActualizarReporte').onclick=loadAll;$('btnAgregarTrabajador').onclick=agregarTrabajador;$('btnGuardarAsistencia').onclick=registrarAsistencia;$('cerrarFoto').onclick=cerrarFoto;$('fechaFiltro').onchange=loadAll; if($('btnGuardarPersonal')) $('btnGuardarPersonal').onclick=guardarPersonal; if($('buscarPersonal')) $('buscarPersonal').oninput=renderPersonal;
 if($('buscarTrabajador')) $('buscarTrabajador').oninput=renderTrabajadores;
 if($('btnAbrirCamara')) $('btnAbrirCamara').onclick=abrirCamara;
 if($('btnTomarFoto')) $('btnTomarFoto').onclick=tomarFoto;
 if($('btnCerrarCamara')) $('btnCerrarCamara').onclick=cerrarCamara;
 $('fotoInput').onchange=e=>{fotoFile=e.target.files[0]||null;if(fotoFile){const r=new FileReader();r.onload=()=>{$('preview').src=r.result;$('preview').style.display='block';if($('cameraVideo')) $('cameraVideo').style.display='none'};r.readAsDataURL(fotoFile)}};
 realtime();loadAll();setInterval(()=>{if(!window.__loadingST){loadAll()}},5000);
}
function show(v,b){document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));$(v).classList.remove('hidden');document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.body.classList.remove('menuOpen');loadAll()}
async function loadAll(){window.__loadingST=true;await cargarTrabajadores();await cargarRegistros();renderDashboard();renderTrabajadores();renderSelect();renderReporte();renderUltimasMarcaciones();renderPersonal();$('lastUpdate').textContent='Actualizado: '+new Date().toLocaleTimeString('es-BO',{hour:'2-digit',minute:'2-digit'});window.__loadingST=false}
async function cargarTrabajadores(){const {data,error}=await sb.from('trabajadores').select('*').neq('estado','Inactivo').order('created_at',{ascending:true});if(error){alert('Error trabajadores: '+error.message);return}trabajadores=data||[]}
async function cargarRegistros(){const {data,error}=await sb.from('asistencia').select('*').eq('fecha',$('fechaFiltro').value||today()).order('created_at',{ascending:true});if(error){registros=[];console.warn(error.message);return}registros=data||[]}
async function agregarTrabajador(){const nombre=$('nuevoNombre').value.trim(),area=$('nuevaArea').value.trim()||'Sin área';if(!nombre){msg('msgTrabajador','Escribe el nombre.','error');return}msg('msgTrabajador','Guardando...');const {error}=await sb.from('trabajadores').insert([{nombre,area,estado:'Activo'}]);if(error){msg('msgTrabajador','Error: '+error.message,'error');return}$('nuevoNombre').value='';$('nuevaArea').value='';msg('msgTrabajador','Trabajador agregado correctamente.','success');loadAll()}
async function desactivarTrabajador(id){if(!confirm('¿Desactivar trabajador?'))return;const {error}=await sb.from('trabajadores').update({estado:'Inactivo'}).eq('id',id);if(error)alert(error.message);loadAll()} window.desactivarTrabajador=desactivarTrabajador;
async function registrarAsistencia(){const t=trabajadores.find(x=>String(x.id)===String($('trabajadorSelect').value));const tipo=$('tipoRegistro').value,observacion=$('observacion').value.trim();if(!t){msg('msgAsistencia','Selecciona trabajador.','error');return}if(!fotoFile&&tipo!=='Ausente'&&tipo!=='Permiso'){msg('msgAsistencia','La foto es obligatoria.','error');return}msg('msgAsistencia','Guardando...');let foto_url='';if(fotoFile){foto_url=await subirFoto(fotoFile,t.nombre,tipo);if(!foto_url)return}const ahora=new Date(),fecha=ahora.toISOString().slice(0,10),hora=ahora.toLocaleTimeString('es-BO',{hour:'2-digit',minute:'2-digit'});const estado=tipo==='Ausente'?'Ausente':tipo==='Retraso'?'Retraso':tipo==='Permiso'?'Permiso':'Presente';const {error}=await sb.from('asistencia').insert([{trabajador_id:t.id,trabajador_nombre:t.nombre,area:t.area,tipo_registro:tipo,estado,observacion,foto_url,fecha,hora}]);if(error){msg('msgAsistencia','Error: '+error.message,'error');return}$('observacion').value='';$('fotoInput').value='';$('preview').style.display='none';if($('cameraVideo')) $('cameraVideo').style.display='none';fotoFile=null;cerrarCamara();msg('msgAsistencia','Asistencia registrada correctamente.','success');loadAll()}

async function abrirCamara(){
 try{
   if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
     msg('msgAsistencia','Este navegador no permite abrir cámara. Usa seleccionar archivo.','error');
     return;
   }

   cerrarCamara();

   cameraStream = await navigator.mediaDevices.getUserMedia({
     video: {
       facingMode: { ideal: 'environment' },
       width: { ideal: 1280 },
       height: { ideal: 720 }
     },
     audio: false
   });

   const video=$('cameraVideo');
   video.srcObject=cameraStream;
   video.style.display='block';
   $('preview').style.display='none';
   $('btnTomarFoto').disabled=false;
   $('btnCerrarCamara').disabled=false;
   msg('msgAsistencia','Cámara abierta. Presiona Tomar foto.','success');
 }catch(error){
   console.error(error);
   msg('msgAsistencia','No se pudo abrir la cámara. Revisa permisos o usa seleccionar archivo.','error');
 }
}
function cerrarCamara(){
 if(cameraStream){
   cameraStream.getTracks().forEach(track=>track.stop());
   cameraStream=null;
 }
 if($('cameraVideo')){
   $('cameraVideo').srcObject=null;
   $('cameraVideo').style.display='none';
 }
 if($('btnTomarFoto')) $('btnTomarFoto').disabled=true;
 if($('btnCerrarCamara')) $('btnCerrarCamara').disabled=true;
}
async function tomarFoto(){
 const video=$('cameraVideo');
 const canvas=$('cameraCanvas');
 if(!video || !cameraStream){
   msg('msgAsistencia','Primero abre la cámara.','error');
   return;
 }
 canvas.width=video.videoWidth || 1280;
 canvas.height=video.videoHeight || 720;
 const ctx=canvas.getContext('2d');
 ctx.drawImage(video,0,0,canvas.width,canvas.height);

 canvas.toBlob(blob=>{
   if(!blob){
     msg('msgAsistencia','No se pudo capturar la foto.','error');
     return;
   }
   fotoFile=new File([blob], `asistencia_${Date.now()}.jpg`, {type:'image/jpeg'});
   const url=URL.createObjectURL(blob);
   $('preview').src=url;
   $('preview').style.display='block';
   video.style.display='none';
   msg('msgAsistencia','Foto capturada correctamente.','success');
 },'image/jpeg',0.86);
}

async function subirFoto(file,nombre,tipo){const ext=file.name.split('.').pop()||'jpg';const clean=nombre.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]/g,'_');const path=`${today()}/${Date.now()}_${clean}_${tipo.replace(/\s+/g,'_')}.${ext}`;const {error}=await sb.storage.from(STORAGE_BUCKET).upload(path,file,{cacheControl:'3600',upsert:false});if(error){msg('msgAsistencia','Error foto: '+error.message,'error');return''}return sb.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl}
function estadoTrab(t){const rs=registros.filter(r=>String(r.trabajador_id)===String(t.id));let e='Ausente';if(rs.some(r=>r.estado==='Presente'))e='Presente';if(rs.some(r=>r.estado==='Retraso'))e='Retraso';if(rs.some(r=>r.estado==='Permiso'))e='Permiso';if(rs.some(r=>r.estado==='Ausente'))e='Ausente';return e}
function renderDashboard(){const rows=trabajadores.map((t,i)=>{const rs=registros.filter(r=>String(r.trabajador_id)===String(t.id));return{...t,idx:i+1,estado:estadoTrab(t),entrada:rs.find(r=>r.tipo_registro==='Entrada 08:00'),salida12:rs.find(r=>r.tipo_registro==='Salida 12:00'),retorno:rs.find(r=>r.tipo_registro==='Retorno 14:00'),salida18:rs.find(r=>r.tipo_registro==='Salida 18:00'),foto_url:[...rs].reverse().find(r=>r.foto_url)?.foto_url||''}});$('presentes').textContent=rows.filter(r=>r.estado==='Presente').length;$('ausentes').textContent=rows.filter(r=>r.estado==='Ausente').length;$('retrasos').textContent=rows.filter(r=>r.estado==='Retraso').length;$('total').textContent=trabajadores.length;$('tablaDashboard').innerHTML=rows.map(r=>`<tr><td>${r.idx}</td><td><span class="avatar">${esc(r.nombre).charAt(0)}</span>${esc(r.nombre)}</td><td>${esc(r.area)}</td><td>${r.entrada?.hora||'--'}</td><td>${r.salida12?.hora||'--'}</td><td>${r.retorno?.hora||'--'}</td><td>${r.salida18?.hora||'--'}</td><td>${badge(r.estado)}</td><td>${fotoBtn(r.foto_url)}</td></tr>`).join('')||'<tr><td colspan="9" class="muted">Sin trabajadores activos.</td></tr>'}
function renderTrabajadores(){const q=($('buscarTrabajador')?.value||'').toLowerCase().trim();const lista=trabajadores.filter(t=>!q||String(t.nombre).toLowerCase().includes(q)||String(t.area||'').toLowerCase().includes(q));$('listaTrabajadores').innerHTML=lista.map(t=>`<div class="workerRow"><div><b>${esc(t.nombre)}</b><br><span class="muted">${esc(t.area)}</span></div><button class="btnDanger" onclick="desactivarTrabajador('${t.id}')">Desactivar</button></div>`).join('')||'<p class="muted">No se encontraron trabajadores.</p>'}
function renderSelect(){$('trabajadorSelect').innerHTML=trabajadores.map(t=>`<option value="${t.id}">${esc(t.nombre)} - ${esc(t.area)}</option>`).join('')}
function renderReporte(){if($('repTotal'))$('repTotal').textContent=registros.length;if($('repFotos'))$('repFotos').textContent=registros.filter(r=>r.foto_url).length;if($('repFecha'))$('repFecha').textContent=$('fechaFiltro').value||today();$('tablaReporte').innerHTML=registros.map(r=>`<tr><td>${r.hora||''}</td><td>${esc(r.trabajador_nombre)}</td><td>${esc(r.area)}</td><td>${esc(r.tipo_registro)}</td><td>${badge(r.estado)}</td><td>${fotoBtn(r.foto_url)}</td><td>${esc(r.observacion)}</td></tr>`).join('')||'<tr><td colspan="7" class="muted">Sin registros para esta fecha.</td></tr>'}
function renderUltimasMarcaciones(){const box=$('ultimasMarcaciones');if(!box)return;const ult=[...registros].reverse().slice(0,6);box.innerHTML=ult.map(r=>`<div class="recentItem"><div><b>${esc(r.trabajador_nombre)}</b><br><span class="muted">${esc(r.tipo_registro)} · ${r.hora||''}</span></div><div>${badge(r.estado)}</div><div>${fotoBtn(r.foto_url)}</div></div>`).join('')||'<p class="muted">Aún no hay marcaciones hoy.</p>'}
function badge(t){return `<span class="badge ${String(t).replace(/\s/g,'-')}">${esc(t)}</span>`}function fotoBtn(u){return u?`<button class="fotoBtn" onclick="abrirFoto('${u}')">▧ Ver foto</button>`:'--'}function abrirFoto(u){$('fotoGrande').src=u;$('fotoModal').classList.add('show')}window.abrirFoto=abrirFoto;function cerrarFoto(){$('fotoModal').classList.remove('show');$('fotoGrande').src=''}

async function guardarPersonal(){
 const nombre=$('pNombre').value.trim();
 const ci=$('pCI').value.trim();
 const cargo=$('pCargo').value.trim();
 const area=$('pArea').value.trim()||'Sin área';
 const telefono=$('pTelefono').value.trim();
 const fecha_ingreso=$('pIngreso').value||null;
 const direccion=$('pDireccion').value.trim();
 const estado=$('pEstado').value||'Activo';
 if(!nombre){msg('msgPersonal','Escribe el nombre completo.','error');return}
 msg('msgPersonal','Guardando ficha...');
 const payload={nombre,area,estado,ci,cargo,telefono,fecha_ingreso,direccion};
 const {error}=await sb.from('trabajadores').insert([payload]);
 if(error){msg('msgPersonal','Error: '+error.message,'error');return}
 ['pNombre','pCI','pCargo','pArea','pTelefono','pIngreso','pDireccion'].forEach(id=>$(id).value='');
 $('pEstado').value='Activo';
 msg('msgPersonal','Ficha guardada correctamente.','success');
 loadAll();
}
function renderPersonal(){
 const box=$('listaPersonal'); if(!box) return;
 const q=($('buscarPersonal')?.value||'').toLowerCase().trim();
 const lista=trabajadores.filter(t=>{
   const texto=[t.nombre,t.ci,t.cargo,t.area,t.telefono].join(' ').toLowerCase();
   return !q || texto.includes(q);
 });
 box.innerHTML=lista.map(t=>`
   <div class="personalCard">
     <div class="personalHead">
       <div style="display:flex;gap:12px;align-items:center">
         <div class="personalAvatar">${esc(t.nombre).charAt(0)}</div>
         <div><b>${esc(t.nombre)}</b><br><span class="muted">${esc(t.cargo||'Sin cargo')} · ${esc(t.area||'Sin área')}</span></div>
       </div>
       ${badge(t.estado||'Activo')}
     </div>
     <div class="personalMeta">
       <div><b>CI:</b> ${esc(t.ci||'-')}</div>
       <div><b>Teléfono:</b> ${esc(t.telefono||'-')}</div>
       <div><b>Ingreso:</b> ${esc(t.fecha_ingreso||'-')}</div>
       <div><b>Dirección:</b> ${esc(t.direccion||'-')}</div>
     </div>
     <div class="personalActions">
       <button class="btnDanger" onclick="desactivarTrabajador('${t.id}')">Desactivar</button>
     </div>
   </div>
 `).join('') || '<p class="muted">No hay fichas registradas.</p>';
}

function realtime(){sb.channel('st-real').on('postgres_changes',{event:'*',schema:'public',table:'trabajadores'},loadAll).on('postgres_changes',{event:'*',schema:'public',table:'asistencia'},loadAll).subscribe()}
init();
