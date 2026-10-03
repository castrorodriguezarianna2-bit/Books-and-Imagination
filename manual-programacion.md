# Manual de programación
## 1. Qué se entrega y por qué
El proyecto independiente está escrito con HTML5, CSS3 y JavaScript puro. Bootstrap 5, Bootstrap Icons, Google Fonts y EmailJS se cargan por CDN: el navegador los descarga desde sus distribuidores. No necesita instalar paquetes ni compilar código. Se usa Bootstrap para ventanas, navegación móvil y notificaciones; el aspecto propio se define en la hoja de estilos para evitar una plantilla genérica.

En Lovable, la página principal conserva el contenedor obligatorio de TanStack Start y muestra esta misma página independiente. El proyecto descargado no depende de React ni TanStack. Los cuatro archivos de código están completos y no contienen comentarios.

## 2. Estructura de carpetas
```text
Books-and-Imagination/
  index.html
  css/
    estilos.css
  js/
    datos.js
    app.js
  images/
    estanque.jpg
  manual-usuario.md
  manual-programacion.md
```

`index.html` contiene las secciones, los enlaces internos, las ventanas, el formulario y las referencias a las bibliotecas. Sus identificadores conectan los botones con las funciones de JavaScript.

`css/estilos.css` contiene los colores, las fuentes, los tamaños, las distribuciones, los efectos y los ajustes para pantallas pequeñas. Centralizar la apariencia permite cambiarla sin modificar cada tarjeta.

`js/datos.js` contiene un arreglo llamado `libros` con 200 objetos literales: 116 clásicos y 84 populares, distribuidos entre diez categorías de veinte títulos. No genera títulos repetidos para alcanzar las cantidades.

`js/app.js` contiene el estado de la visita, la creación de tarjetas, las búsquedas, las reseñas, el carrito, la sesión simulada y el envío de correo. Se carga después de datos.js porque necesita que el arreglo ya exista.

`images/estanque.jpg` es la imagen local del estanque. Se incluye para que la primera pantalla no dependa de una imagen externa cambiante.

## 3. Abrir el proyecto
Descomprime todo conservando las carpetas. Puedes abrir index.html para inspeccionar la página; para probar EmailJS y el almacenamiento de manera fiable, sirve la carpeta mediante un servidor local o publícala en un alojamiento estático con HTTPS. Si tienes Python instalado, abre una terminal en la carpeta y ejecuta `python3 -m http.server 8000`; visita `http://localhost:8000`.

Necesitas Internet para las fuentes, Bootstrap, los iconos, las portadas y EmailJS. No es una aplicación sin conexión. La carpeta completa puede publicarse en un alojamiento estático; no necesita un servidor privado.

## 4. Cómo leer un objeto libro
Cada libro tiene:
- `id`: número único que vincula detalles y carrito.
- `titulo` y `autor`: textos visibles y campos de búsqueda.
- `categoria`: uno de los diez géneros. La lista de botones se obtiene del arreglo.
- `catalogo`: `clasicos` o `populares`.
- `precio`: un número entero en COP, sin signos ni separadores; se formatea al mostrarlo.
- `sinopsis`: descripción breve específica de esa obra.
- `calificacion`: un número entre 1 y 5, independiente de los ejemplos de reseñas.
- `portada`: URL bibliográfica de Open Library o cadena vacía cuando no se obtuvo una cubierta.
- `resenas`: arreglo de entre una y cinco entradas con nombre, comentario y calificacion.

Los precios y las calificaciones son datos de demostración, no precios editoriales comprobados. Los comentarios y los nombres son ficticios; la reseña positiva de Jhoan Manrique se incluyó por requisito, sin atribuirle un testimonio real.

Se localizaron URLs bibliográficas para 160 títulos; los 40 restantes utilizan la cubierta decorativa. No todas las ediciones están en español ni todas las URLs han sido verificadas visualmente. Antes de publicar un catálogo real, revisa que cada imagen corresponda exactamente al título y a la edición vendida, y comprueba los permisos de uso.

## 5. Agregar o editar un libro
Abre datos.js y localiza un objeto por su título. Cambia sus campos conservando las comillas en textos y sin ponerlas alrededor del precio o el identificador. Para añadir un título, copia un objeto completo, coloca una coma entre objetos y asigna un id que no exista. Escoge una categoría existente para conservar los diez filtros. Si añades otra categoría, aparecerá automáticamente; actualiza los textos que anuncian diez géneros y revisa los requisitos de cantidad.

Mantén entre una y cinco reseñas por libro y calificaciones entre 1 y 5. Una URL vacía no rompe la tarjeta: activa el respaldo. Para una portada por ISBN utiliza `https://covers.openlibrary.org/b/isbn/ISBN-L.jpg?default=false`, sustituyendo ISBN por el de una edición real. `default=false` permite detectar la ausencia de imagen en lugar de aceptar una cubierta vacía.

No cambies el id de un libro que ya puede estar en carritos: el almacenamiento conserva ese identificador. Una eliminación del catálogo se limpia al recargar, para no dejar referencias inexistentes.

## 6. Búsqueda, orden y aparición
`normalizar` elimina las tildes y convierte el texto a minúsculas. Así, una búsqueda como Garcia encuentra García. `librosFiltrados` combina catálogo o categoría con título y autor. `ordenar` trabaja sobre una copia: no modifica el inventario original al cambiar el orden.

Cada colección empieza con cinco libros, añade diez con el botón correspondiente y permite expandirse completamente. Esto evita descargar doscientas portadas al abrir la página. Las imágenes utilizan carga diferida. Un observador de intersección revela las tarjetas al entrar en pantalla, sin consultar continuamente posiciones durante el desplazamiento. Si el visitante solicita movimiento reducido en su dispositivo, las animaciones se desactivan.

`escapar` transforma caracteres especiales antes de incluir textos en contenido HTML dinámico. Así, un título con símbolos no altera la estructura y el nombre o correo del formulario no se interpretan como etiquetas ejecutables.

## 7. Detalles, portadas y notificaciones
`mostrarLibro` busca el id en el arreglo y crea la ventana de Bootstrap. `estrellas` representa estrellas llenas, medias y vacías y añade una descripción accesible. `gestionarPortadas` detecta errores y cubiertas minúsculas; elimina la imagen fallida para descubrir el respaldo decorativo.

`avisar` actualiza una notificación de Bootstrap y la muestra durante unos segundos. El código usa un único manejador de clics para botones creados posteriormente; esto evita tener que volver a conectar cada tarjeta al cambiar filtros.

## 8. Carrito y persistencia
El carrito contiene solamente `{ id, cantidad }`. Los títulos y los precios se consultan en el catálogo para evitar mantener dos copias que podrían divergir.

`agregarLibro` crea un producto o aumenta su cantidad. `cambiarCantidad` aplica +1 o −1 y elimina cantidades iguales a cero. La papelera elimina directamente. `totalCarrito` multiplica cada precio por sus unidades y suma los resultados. `mostrarCarrito` vuelve a dibujar filas, contador y total tras cada modificación.

`guardarAlmacenamiento` utiliza localStorage, un espacio del navegador que persiste al cerrar la pestaña. `leerAlmacenamiento` contempla contenido ausente o JSON inválido. Al iniciar, se descartan ids desconocidos y cantidades incorrectas. Las cantidades se limitan a 999 para evitar entradas descontroladas.

Este almacenamiento no sincroniza dispositivos, no protege información comercial y puede ser modificado por el usuario. Por eso no debe usarse como fuente de precios o pedidos en una tienda real.

## 9. Sesión de demostración
`validarSesion` comprueba nombre y apellido en registro, forma del correo, ocho caracteres mínimos y coincidencia de contraseñas. `iniciarSesion` guarda únicamente nombre y correo en localStorage y borra el formulario. Nunca guarda ni envía contraseñas.

**No hay autenticación real:** no existe servidor de cuentas, no se comprueba una contraseña contra una cuenta previa y el registro solo crea una identidad de demostración en ese navegador. Se eligió así porque la compra es una simulación y porque una web estática no puede custodiar contraseñas de forma segura. Para cuentas reales se necesita un servicio de autenticación y validación del lado del servidor; no basta con ampliar localStorage.

La sesión sirve exclusivamente para identificar al destinatario del resumen. No concede permisos, acceso administrativo ni acceso a datos privados.

## 10. Flujo de compra
`confirmarCompra` comprueba que existan productos. Si falta sesión, señala que hay una compra pendiente y abre la ventana. Al cerrar esa ventana después de un formulario válido, continúa el proceso, evitando apilar ventanas.

`completarCompra` hace una copia del pedido y calcula el total. Bloquea modificaciones mientras confirma, muestra el resumen y llama a `enviarCorreo`. Después informa del resultado y vacía el carrito. No hay tarjeta bancaria, pasarela de pagos ni datos financieros.

El éxito visible corresponde a la simulación, no a un cobro ni a una entrega de correo. Cuando EmailJS está sin configurar o falla, el mensaje lo indica expresamente. No se anuncia un envío que no ocurrió.

## 11. Configurar EmailJS paso a paso
1. Crea una cuenta en EmailJS y revisa los límites vigentes de su plan gratuito. No se garantizan cuotas ilimitadas.
2. En Email Services, añade el servicio de correo que utilizarás y completa la autorización que solicita EmailJS. Copia su Service ID.
3. En Email Templates, crea una plantilla para el resumen de compra. En el destinatario escribe `{{to_email}}`. En el nombre del destinatario utiliza `{{to_name}}`.
4. Establece un asunto como `Gracias por tu compra simulada en Books and Imagination`.
5. El contenido debe ser de **texto plano**, sin imágenes ni HTML: utiliza `{{message}}`. Selecciona el formato de texto plano si tu editor lo ofrece. El código manda agradecimiento, líneas del pedido y total en esa variable. No añadas promociones.
6. Guarda la plantilla y copia su Template ID.
7. En Account o API Keys, copia la Public Key de EmailJS. No copies una clave privada o contraseña del correo.
8. Abre js/app.js. Su primer objeto es `configuracionCorreo`. Sustituye las cadenas vacías de `clavePublica`, `servicio` y `plantilla` por la Public Key, el Service ID y el Template ID, respectivamente. No cambies sus nombres ni la estructura.
9. En la configuración de seguridad de EmailJS, limita los dominios autorizados al dominio real de tu web y al origen local si vas a probar allí. Estas claves públicas son visibles desde el navegador; no equivalen a un secreto de servidor.
10. Prueba una compra con tu propio correo y productos en el carrito. Busca el resumen recibido y revisa correo no deseado. No consideres verificado el envío solo porque aparece el mensaje de compra.
11. Si falla, revisa IDs, destinatario, dominios permitidos, conexión y cuota. La web informa del fallo y no reintenta en bucle, para evitar mensajes duplicados.

EmailJS se invoca solo una vez para el destinatario de esa compra. El código no envía listas, campañas ni promociones. Una solución exclusivamente del lado del cliente no puede impedir toda manipulación o abuso: configura las restricciones del proveedor y no utilices esta demostración como comercio real sin controles adicionales. El envío real no fue probado porque no se proporcionaron claves.

## 12. Cambiar paleta y tipografías
Al principio de estilos.css encontrarás las variables principales en `:root`. `--verde-oscuro`, `--verde-musgo`, `--beige`, `--rosa` y `--verde-medianoche` corresponden, en formato perceptual OKLCH, a la paleta solicitada: #0A3323, #839958, #F7F4D5, #D3968C y #105666. Los tonos auxiliares se usan para superficies, contraste y bordes. Para cambiar un color, modifica su variable; revisa también los tonos auxiliares para conservar armonía.

Las fuentes son Lora para títulos y DM Sans para texto. Se cargan en el encabezado HTML y se referencian con `--fuente-titulo` y `--fuente-texto`. Si cambias las fuentes, actualiza tanto el enlace de Google Fonts como esas variables.

La imagen del estanque tiene una capa de color por encima para que el texto se lea sin ocultar las flores. Los degradados pertenecen a las variables de estilos; no se repiten colores arbitrarios en las tarjetas. Las esquinas y sombras también están centralizadas.

## 13. Antes de convertirla en una librería real
Sustituye el correo `.example`, verifica portadas, precios, disponibilidad y derechos de las imágenes; elimina las reseñas ficticias o conserva su aviso. Añade autenticación real, pedidos verificados y políticas de privacidad adecuadas. No quites los avisos de simulación mientras no exista una tienda real. El proyecto no contiene comentarios en HTML, CSS o JavaScript; las explicaciones se mantienen en estos manuales para que el código permanezca limpio.
