const configuracionCorreo = {
  clavePublica: '',
  servicio: '',
  plantilla: ''
};
const formatoMoneda = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const claveCarrito = 'books-imagination-carrito';
const claveSesion = 'books-imagination-sesion';
const categorias = [...new Set(libros.map(libro => libro.categoria))];
const estado = { busqueda: '', orden: 'recomendados', categoria: 'Ficción', limites: { clasicos: 5, populares: 5, categorias: 5 }, modoSesion: 'inicio', compraPendiente: false, comprando: false, favoritos: new Set() };
let carrito = leerAlmacenamiento(claveCarrito, []);
let sesion = leerAlmacenamiento(claveSesion, null);
carrito = Array.isArray(carrito) ? carrito.filter(item => libros.some(libro => libro.id === item.id) && Number.isInteger(item.cantidad) && item.cantidad > 0).map(item => ({ id: item.id, cantidad: Math.min(item.cantidad, 999) })) : [];
if (!sesion || typeof sesion.nombre !== 'string' || typeof sesion.correo !== 'string') sesion = null;
const modalLibro = new bootstrap.Modal(document.getElementById('modal-libro'));
const modalSesion = new bootstrap.Modal(document.getElementById('modal-sesion'));
const modalCompra = new bootstrap.Modal(document.getElementById('modal-compra'));
const notificacion = new bootstrap.Toast(document.getElementById('notificacion'), { delay: 3500 });
const observador = new IntersectionObserver(entradas => entradas.forEach(entrada => { if (entrada.isIntersecting) { entrada.target.classList.add('mostrado'); observador.unobserve(entrada.target); } }), { threshold: 0.04 });
function leerAlmacenamiento(clave, respaldo) {
  try { return JSON.parse(localStorage.getItem(clave)) ?? respaldo; } catch { return respaldo; }
}
function guardarAlmacenamiento(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { avisar('No pudimos conservar tus datos en este navegador.'); }
}
function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caracter]);
}
function normalizar(texto) { return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function estrellas(calificacion) {
  return `<span class="estrellas" aria-label="${calificacion} de 5 estrellas">${Array.from({ length: 5 }, (_, i) => `<i class="bi bi-star${calificacion >= i + 1 ? '-fill' : calificacion > i ? '-half' : ''}"></i>`).join('')}</span>`;
}
function portada(libro, grande = false) {
  const respaldo = `<span class="respaldo-portada tono-${libro.id % 3}"><i class="bi bi-flower1"></i><strong>${escapar(libro.titulo)}</strong><small>${escapar(libro.autor)}</small></span>`;
  return `<span class="zona-portada">${respaldo}${libro.portada ? `<img class="portada" src="${escapar(libro.portada)}" alt="Portada de ${escapar(libro.titulo)}" width="240" height="350" loading="${grande ? 'eager' : 'lazy'}" referrerpolicy="no-referrer">` : ''}</span>`;
}
function gestionarPortadas(contenedor) {
  contenedor.querySelectorAll('img.portada').forEach(imagen => {
    imagen.addEventListener('error', () => imagen.remove(), { once: true });
    imagen.addEventListener('load', () => { if (imagen.naturalWidth < 10) imagen.remove(); }, { once: true });
    if (imagen.complete && imagen.naturalWidth < 10) imagen.remove();
  });
}
function tarjeta(libro, indice) {
  const destacado = ['Cien años de soledad', 'La biblioteca de la medianoche', 'Hábitos atómicos'].includes(libro.titulo);
  return `<article class="tarjeta-libro revelar"><button class="favorito ${estado.favoritos.has(libro.id) ? 'seleccionado' : ''}" data-favorito="${libro.id}" aria-label="${estado.favoritos.has(libro.id) ? 'Quitar de' : 'Guardar en'} favoritos: ${escapar(libro.titulo)}" aria-pressed="${estado.favoritos.has(libro.id)}" title="Guardar favorito"><i class="bi bi-heart${estado.favoritos.has(libro.id) ? '-fill' : ''}"></i></button>${destacado ? `<span class="etiqueta-libro">${libro.catalogo === 'clasicos' ? 'IMPRESCINDIBLE' : 'FAVORITO DE LECTORES'}</span>` : ''}<button class="portada-enlace" data-libro="${libro.id}" aria-label="Ver ${escapar(libro.titulo)}">${portada(libro)}</button><div class="info-libro"><p class="categoria-libro">${escapar(libro.categoria)}</p><button class="titulo-libro" data-libro="${libro.id}">${escapar(libro.titulo)}</button><p class="autor-libro">${escapar(libro.autor)}</p><div class="valoracion">${estrellas(libro.calificacion)}<span>${libro.calificacion.toFixed(1)}</span><span class="cantidad-resenas">(${libro.resenas.length})</span></div><div class="precio-acciones"><span class="precio">${formatoMoneda.format(libro.precio)}<small>COP</small></span><button class="agregar-libro" data-agregar="${libro.id}" title="Añadir al carrito" aria-label="Añadir ${escapar(libro.titulo)} al carrito"><i class="bi bi-bag-plus"></i></button></div></div></article>`;
}
function ordenar(lista) {
  const copia = [...lista];
  if (estado.orden === 'precio-asc') copia.sort((a, b) => a.precio - b.precio);
  if (estado.orden === 'precio-desc') copia.sort((a, b) => b.precio - a.precio);
  if (estado.orden === 'calificacion') copia.sort((a, b) => b.calificacion - a.calificacion);
  if (estado.orden === 'recomendados') {
    const destacados = ['Cien años de soledad', 'El amor en los tiempos del cólera', 'Orgullo y prejuicio', 'Don Quijote de la Mancha', '1984', 'La biblioteca de la medianoche', 'Hábitos atómicos', 'La canción de Aquiles', 'La sombra del viento', 'Los siete maridos de Evelyn Hugo'];
    const prioridad = libro => { const indice = destacados.indexOf(libro.titulo); return indice < 0 ? 100 + libro.id : indice; };
    copia.sort((a, b) => prioridad(a) - prioridad(b));
  }
  return copia;
}
function librosFiltrados(seccion) {
  return ordenar(libros.filter(libro => (seccion === 'categorias' ? libro.categoria === estado.categoria : libro.catalogo === seccion) && (!estado.busqueda || normalizar(`${libro.titulo} ${libro.autor}`).includes(normalizar(estado.busqueda)))));
}
function mostrarCatalogo(seccion) {
  const lista = librosFiltrados(seccion);
  const contenedor = document.getElementById(`lista-${seccion}`);
  contenedor.innerHTML = lista.length ? lista.slice(0, estado.limites[seccion]).map(tarjeta).join('') : '<div class="sin-resultados"><i class="bi bi-search"></i>No encontramos esa historia. Prueba otro título o autor.</div>';
  gestionarPortadas(contenedor);
  contenedor.querySelectorAll('.revelar').forEach(elemento => observador.observe(elemento));
  document.querySelector(`[data-cargar="${seccion}"]`).hidden = estado.limites[seccion] >= lista.length;
  const cantidad = document.getElementById(`cantidad-${seccion}`);
  if (cantidad) cantidad.textContent = lista.length;
}
function mostrarCatalogos() { ['clasicos', 'populares', 'categorias'].forEach(mostrarCatalogo); }
function mostrarFiltros() {
  document.getElementById('filtros-categorias').innerHTML = categorias.map(categoria => `<button class="filtro ${estado.categoria === categoria ? 'activo' : ''}" data-categoria="${escapar(categoria)}" aria-pressed="${estado.categoria === categoria}">${escapar(categoria)} <span>· ${libros.filter(libro => libro.categoria === categoria).length}</span></button>`).join('');
}
function mostrarLibro(id) {
  const libro = libros.find(libro => libro.id === id);
  if (!libro) return;
  const contenedor = document.getElementById('detalle-libro');
  contenedor.innerHTML = `<div class="detalle-principal">${portada(libro, true)}<div class="detalle-texto"><p class="sobrelinea">${escapar(libro.categoria)}</p><h2 id="titulo-modal-libro">${escapar(libro.titulo)}</h2><p class="detalle-autor">${escapar(libro.autor)}</p><div class="valoracion">${estrellas(libro.calificacion)} ${libro.calificacion.toFixed(1)} · ${libro.resenas.length} reseñas</div><p class="sinopsis">${escapar(libro.sinopsis)}</p><span class="precio">${formatoMoneda.format(libro.precio)} <small>COP</small></span><button class="boton boton-musgo" data-agregar="${libro.id}"><i class="bi bi-bag-plus"></i> Añadir al carrito</button></div></div><div class="resenas"><h3>Entre lectores</h3><p class="aviso-resenas">Reseñas ficticias para esta demostración. No son testimonios verificados.</p>${libro.resenas.map(resena => `<div class="resena"><div class="resena-encabezado"><span class="avatar">${escapar(resena.nombre.split(' ').slice(0, 2).map(nombre => nombre[0]).join(''))}</span><strong>${escapar(resena.nombre)}</strong>${estrellas(resena.calificacion)}</div><p>${escapar(resena.comentario)}</p></div>`).join('')}</div>`;
  gestionarPortadas(contenedor);
  modalLibro.show();
}
function avisar(mensaje) { document.getElementById('texto-notificacion').textContent = mensaje; notificacion.show(); }
function guardarCarrito() { guardarAlmacenamiento(claveCarrito, carrito); mostrarCarrito(); }
function agregarLibro(id) {
  if (estado.comprando) return;
  const libro = libros.find(libro => libro.id === id);
  if (!libro) return;
  const item = carrito.find(item => item.id === id);
  if (item) { if (item.cantidad >= 999) { avisar('Alcanzaste el máximo de unidades.'); return; } item.cantidad++; } else carrito.push({ id, cantidad: 1 });
  guardarCarrito();
  avisar(`${libro.titulo} añadido a tu carrito.`);
}
function cambiarCantidad(id, cambio) {
  if (estado.comprando) return;
  const item = carrito.find(item => item.id === id);
  if (!item) return;
  item.cantidad = Math.min(999, item.cantidad + cambio);
  carrito = carrito.filter(item => item.cantidad > 0);
  guardarCarrito();
}
function totalCarrito(items = carrito) { return items.reduce((total, item) => total + (libros.find(libro => libro.id === item.id)?.precio ?? 0) * item.cantidad, 0); }
function mostrarCarrito() {
  const unidades = carrito.reduce((total, item) => total + item.cantidad, 0);
  document.getElementById('contador-carrito').textContent = unidades;
  const contenedor = document.getElementById('contenido-carrito');
  if (!carrito.length) { contenedor.innerHTML = '<div class="carrito-vacio"><i class="bi bi-bag-heart"></i><h3>Tu próxima aventura aún te espera</h3><p>Tu carrito está vacío. ¿Qué historia llevarás contigo?</p><a class="boton boton-musgo" href="#clasicos">Encontrar mi próxima lectura <i class="bi bi-arrow-right"></i></a></div>'; return; }
  contenedor.innerHTML = `<div class="carrito-distribucion"><div>${carrito.map(item => { const libro = libros.find(libro => libro.id === item.id); if (!libro) return ''; return `<div class="fila-carrito"><div class="mini-portada">${portada(libro)}</div><div class="nombre-carrito"><h3>${escapar(libro.titulo)}</h3><p>${escapar(libro.autor)}</p><span>${formatoMoneda.format(libro.precio)}</span></div><div class="control-cantidad"><button data-disminuir="${libro.id}" aria-label="Disminuir unidades de ${escapar(libro.titulo)}"><i class="bi bi-dash"></i></button><span>${item.cantidad}</span><button data-aumentar="${libro.id}" aria-label="Aumentar unidades de ${escapar(libro.titulo)}"><i class="bi bi-plus"></i></button></div><span class="precio">${formatoMoneda.format(libro.precio * item.cantidad)}</span><button class="eliminar" data-eliminar="${libro.id}" aria-label="Eliminar ${escapar(libro.titulo)}" title="Eliminar libro"><i class="bi bi-trash3"></i></button></div>`; }).join('')}</div><aside class="resumen-carrito"><h3>Tu selección</h3><p>${unidades} ${unidades === 1 ? 'libro' : 'libros'} para imaginar</p><div class="total"><span>Total</span><strong>${formatoMoneda.format(totalCarrito())} COP</strong></div><button id="confirmar-compra" class="boton boton-musgo" ${estado.comprando ? 'disabled' : ''}>${estado.comprando ? 'Confirmando…' : 'Confirmar compra'} <i class="bi bi-arrow-right"></i></button><p><i class="bi bi-shield-check"></i> Compra de demostración. No se realizarán cobros ni envíos físicos.</p>${sesion ? `<p>Sesión: ${escapar(sesion.nombre)}<br><button class="boton boton-borde" id="cerrar-sesion">Cerrar sesión</button></p>` : ''}</aside></div>`;
  gestionarPortadas(contenedor);
}
function cambiarModo(modo) {
  estado.modoSesion = modo;
  const registro = modo === 'registro';
  document.getElementById('campo-nombre').hidden = !registro;
  document.getElementById('campo-confirmacion').hidden = !registro;
  document.getElementById('nombre').required = registro;
  document.getElementById('confirmacion').required = registro;
  document.getElementById('clave').autocomplete = registro ? 'new-password' : 'current-password';
  document.getElementById('titulo-sesion').textContent = registro ? 'Tu historia empieza aquí' : 'Bienvenido de nuevo';
  document.getElementById('enviar-sesion').textContent = registro ? 'Crear cuenta de demostración' : 'Iniciar sesión';
  document.getElementById('error-sesion').textContent = '';
  document.querySelectorAll('[data-modo]').forEach(boton => boton.classList.toggle('activo', boton.dataset.modo === modo));
}
function validarSesion(nombre, correo, clave, confirmacion, registro) {
  if (registro && (nombre.trim().length < 5 || nombre.trim().split(/\s+/).length < 2)) return 'Escribe tu nombre y al menos un apellido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return 'Escribe un correo electrónico válido.';
  if (clave.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (registro && clave !== confirmacion) return 'Las contraseñas no coinciden. Escríbelas de nuevo.';
  return '';
}
function iniciarSesion(evento) {
  evento.preventDefault();
  const nombre = document.getElementById('nombre').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const clave = document.getElementById('clave').value;
  const confirmacion = document.getElementById('confirmacion').value;
  const registro = estado.modoSesion === 'registro';
  const error = validarSesion(nombre, correo, clave, confirmacion, registro);
  document.getElementById('error-sesion').textContent = error;
  if (error) return;
  sesion = { nombre: registro ? nombre : (sesion?.correo === correo ? sesion.nombre : correo.split('@')[0]), correo };
  guardarAlmacenamiento(claveSesion, sesion);
  document.getElementById('formulario-sesion').reset();
  mostrarCarrito();
  if (estado.compraPendiente) {
    document.getElementById('modal-sesion').addEventListener('hidden.bs.modal', () => completarCompra(), { once: true });
  } else avisar(`¡Bienvenido, ${sesion.nombre}!`);
  modalSesion.hide();
}
function confirmarCompra() {
  if (!carrito.length || estado.comprando) return;
  if (!sesion) { estado.compraPendiente = true; cambiarModo('inicio'); modalSesion.show(); return; }
  completarCompra();
}
async function enviarCorreo(pedido, total) {
  if (!configuracionCorreo.clavePublica || !configuracionCorreo.servicio || !configuracionCorreo.plantilla) return 'La compra fue simulada. No se envió un correo porque EmailJS aún no está configurado.';
  if (!window.emailjs) return 'La compra fue simulada, pero no se pudo cargar el servicio de correo.';
  const resumen = pedido.map(item => { const libro = libros.find(libro => libro.id === item.id); return libro ? `${item.cantidad} × ${libro.titulo}: ${formatoMoneda.format(libro.precio * item.cantidad)} COP` : ''; }).join('\n');
  try {
    await emailjs.send(configuracionCorreo.servicio, configuracionCorreo.plantilla, { to_email: sesion.correo, to_name: sesion.nombre, message: `¡Felicitaciones, ${sesion.nombre}!\n\nGracias por tu compra simulada en Books and Imagination.\n\nResumen del pedido:\n${resumen}\n\nTotal: ${formatoMoneda.format(total)} COP\n\nEsta compra es una simulación. No se ha realizado ningún cobro ni envío físico.\n\nGracias por dejar florecer tu imaginación.` }, { publicKey: configuracionCorreo.clavePublica });
    return `Enviamos el resumen a ${sesion.correo}. Revisa también tu carpeta de correo no deseado.`;
  } catch { return 'La compra fue simulada, pero no pudimos enviar el correo. Revisa la configuración de EmailJS y tu conexión.'; }
}
async function completarCompra() {
  estado.compraPendiente = false;
  if (!sesion || !carrito.length || estado.comprando) return;
  estado.comprando = true;
  const pedido = carrito.map(item => ({ ...item }));
  const total = totalCarrito(pedido);
  mostrarCarrito();
  document.getElementById('mensaje-compra').textContent = `${sesion.nombre}, tus próximas historias ya forman parte de esta compra simulada.`;
  document.getElementById('resumen-compra').innerHTML = pedido.map(item => { const libro = libros.find(libro => libro.id === item.id); return libro ? `<div><span>${item.cantidad} × ${escapar(libro.titulo)}</span><span>${formatoMoneda.format(libro.precio * item.cantidad)}</span></div>` : ''; }).join('') + `<div><strong>Total</strong><strong>${formatoMoneda.format(total)} COP</strong></div>`;
  document.getElementById('estado-correo').textContent = 'Confirmando tu pedido de demostración…';
  modalCompra.show();
  const resultado = await enviarCorreo(pedido, total);
  document.getElementById('estado-correo').textContent = resultado;
  carrito = [];
  estado.comprando = false;
  guardarCarrito();
}
function delegarAcciones(evento) {
  const boton = evento.target.closest('button, a');
  if (!boton) return;
  if (boton.dataset.libro) mostrarLibro(Number(boton.dataset.libro));
  if (boton.dataset.agregar) agregarLibro(Number(boton.dataset.agregar));
  if (boton.dataset.aumentar) cambiarCantidad(Number(boton.dataset.aumentar), 1);
  if (boton.dataset.disminuir) cambiarCantidad(Number(boton.dataset.disminuir), -1);
  if (boton.dataset.eliminar && !estado.comprando) { carrito = carrito.filter(item => item.id !== Number(boton.dataset.eliminar)); guardarCarrito(); }
  if (boton.dataset.favorito) { const id = Number(boton.dataset.favorito); estado.favoritos.has(id) ? estado.favoritos.delete(id) : estado.favoritos.add(id); boton.classList.toggle('seleccionado', estado.favoritos.has(id)); boton.setAttribute('aria-pressed', String(estado.favoritos.has(id))); boton.querySelector('i').className = `bi bi-heart${estado.favoritos.has(id) ? '-fill' : ''}`; avisar(estado.favoritos.has(id) ? 'Guardado en tus favoritos de esta visita.' : 'Quitado de tus favoritos.'); }
  if (boton.dataset.categoria) { estado.categoria = boton.dataset.categoria; estado.limites.categorias = 5; mostrarFiltros(); mostrarCatalogo('categorias'); }
  if (boton.dataset.cargar) { estado.limites[boton.dataset.cargar] += 10; mostrarCatalogo(boton.dataset.cargar); }
  if (boton.dataset.expandir) { evento.preventDefault(); estado.limites[boton.dataset.expandir] = 1000; mostrarCatalogo(boton.dataset.expandir); }
  if (boton.dataset.modo) cambiarModo(boton.dataset.modo);
  if (boton.id === 'confirmar-compra') confirmarCompra();
  if (boton.id === 'cerrar-sesion' && !estado.comprando) { sesion = null; guardarAlmacenamiento(claveSesion, null); mostrarCarrito(); avisar('Cerraste tu sesión de demostración.'); }
  if (boton.id === 'abrir-sesion') { estado.compraPendiente = false; if (sesion) { avisar(`Sesión de ${sesion.nombre}. Puedes cerrarla en tu carrito.`); } else { cambiarModo('inicio'); modalSesion.show(); } }
  if (boton.matches('.nav-link')) { document.querySelectorAll('.nav-link').forEach(enlace => enlace.classList.toggle('activo', enlace === boton)); const menu = bootstrap.Collapse.getInstance(document.getElementById('navegacion')); if (menu) menu.hide(); }
}
document.addEventListener('click', delegarAcciones);
document.getElementById('buscador').addEventListener('input', evento => { estado.busqueda = evento.target.value; estado.limites = { clasicos: 5, populares: 5, categorias: 5 }; mostrarCatalogos(); });
document.getElementById('ordenamiento').addEventListener('change', evento => { estado.orden = evento.target.value; mostrarCatalogos(); });
document.getElementById('formulario-sesion').addEventListener('submit', iniciarSesion);
document.getElementById('volver-arriba').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
window.addEventListener('scroll', () => document.getElementById('volver-arriba').classList.toggle('visible', window.scrollY > 450), { passive: true });
mostrarFiltros();
mostrarCatalogos();
mostrarCarrito();
