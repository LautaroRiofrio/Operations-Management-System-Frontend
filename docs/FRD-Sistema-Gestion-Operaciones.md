# Documentacion de Requerimientos Funcionales

## 1. Historial de cambios

| Version | Fecha | Autor | Descripcion |
| --- | --- | --- | --- |
| 2.0 | 2026-06-18 | Codex | Reestructuracion integral del FRD tomando como base el BRD del 2026-04-22, el FRD de referencia y el estado real del frontend al 2026-06-18. |
| 1.0 | 2026-05-23 | Codex | Version inicial del FRD adaptada al proyecto actual de Operations Management System Frontend. |

## 2. Alcance

### 2.1 Descripcion del proyecto / Objetivos

El proyecto **Operations Management System Frontend** es una aplicacion web construida con Next.js 16, React 19 y TypeScript para operar el circuito completo de pedidos de un negocio de elaboracion y entrega.

El sistema cubre cuatro dominios funcionales principales:

- **Recepcion**: registro, consulta, visualizacion y edicion de pedidos.
- **Produccion**: toma de pedidos pendientes, visualizacion de recetas y seguimiento del avance por linea.
- **Entrega**: control final del pedido listo, consulta del detalle y cierre como entregado o cancelado.
- **Administracion y metricas**: mantenimiento de catalogos maestros y analitica operativa del negocio.

Objetivos del producto:

- Centralizar el ciclo operativo desde la creacion del pedido hasta su entrega.
- Reducir errores de coordinacion entre recepcion, produccion y entrega.
- Dar visibilidad del estado real de cada pedido.
- Mantener productos, categorias, ingredientes y recetas desde una interfaz administrativa.
- Exponer metricas de facturacion, tiempos operativos, clientes destacados, productos vendidos y rentabilidad.

### 2.2 Justificacion

Segun el BRD, el valor del sistema esta en registrar cada etapa del flujo de pedidos para generar informacion util para la operacion y para la toma de decisiones administrativas. El frontend materializa esa necesidad en tableros operativos y una capa administrativa que reemplaza trabajo disperso, consultas manuales y baja trazabilidad entre etapas.

### 2.3 Hipotesis

- El negocio opera sobre un flujo de estados reconocibles y consistentes.
- Cada pedido atraviesa recepcion, produccion y entrega, incluso cuando alguna etapa sea muy breve.
- El backend expone o seguira exponiendo recursos para ordenes, lineas, clientes, estados, catalogos, recetas, movimientos de stock y metricas.
- La mejora del registro operativo permitira detectar cuellos de botella, horarios pico y oportunidades de optimizacion.

### 2.4 Restricciones

- El frontend depende fuertemente de la disponibilidad y consistencia de la API.
- La resolucion de estados operativos se apoya en nombres devueltos por backend, no en una configuracion desacoplada del cliente.
- La gestion por estaciones de trabajo mencionada en el BRD no esta implementada en la interfaz actual.
- El frontend actual no expone autenticacion, autorizacion por rol, motivo de cancelacion ni historial de cambios de estado.
- Algunos componentes administrativos existen en codigo pero no estan publicados en la navegacion actual.

### 2.5 Dependencias

- API REST para ordenes, lineas de orden, clientes, categorias, ingredientes, productos, recetas y estados.
- API REST para tipos de movimiento de stock y movimientos de stock.
- API REST de metricas para facturacion total, concentracion horaria de entregas, tiempos promedio por estado, detalle por estado, costo/ganancia y productos mas vendidos.
- Configuracion correcta de estados operativos equivalentes a `pendiente`, `en produccion`, `listo`, `entregado` y `cancelado`.
- Configuracion correcta de tipos de movimiento de stock equivalentes a `en_produccion`, `entregado` y `cancelado_con_perdida`.

### 2.6 Alcance funcional del proyecto

Incluido en el alcance actual observable:

- Crear pedidos con cliente, entrega estimada, metodo de pago y productos.
- Seleccionar clientes existentes y crear clientes nuevos desde el flujo de recepcion.
- Buscar pedidos por nombre de cliente o numero de orden.
- Ver pedidos agrupados por estados no finales.
- Editar pedidos existentes.
- Proteger al usuario frente a cambios sin guardar.
- Tomar pedidos pendientes y moverlos a produccion.
- Consultar ingredientes y cantidades de receta por producto.
- Registrar avance de produccion por linea.
- Completar pedidos de produccion y moverlos a listos.
- Cancelar pedidos desde produccion o entrega.
- Sincronizar movimientos de stock operativos al completar produccion, entregar o cancelar.
- Gestionar categorias, ingredientes, productos y recetas desde el modulo administrativo.
- Consultar metricas con rango de fechas opcional.
- Analizar tiempos por estado con drilldown hasta el detalle de la orden.
- Consultar costo, facturacion, ganancia, productos mas vendidos, clientes destacados y horarios de entrega.

Considerado por el BRD pero no resuelto en la interfaz actual:

- Motivo obligatorio de cancelacion.
- Restriccion de una orden en produccion por estacion de trabajo.
- Historial visible de transiciones de estado con fecha y hora.
- Publicacion en navegacion de ABM de estados y tipos de movimiento de stock.

Fuera del alcance actual visible:

- Login y gestion de permisos por rol.
- Notificaciones automaticas a clientes.
- Integracion nativa con WhatsApp.
- Pasarela de pago o cobro online.
- Auditoria completa de acciones de usuario.

## 3. Informacion de requerimientos de negocio

### 3.1 Reglas de negocio

| ID | Regla | Estado en frontend |
| --- | --- | --- |
| RN-REC-01 | Toda orden debe tener un cliente valido asociado. | Implementado |
| RN-REC-02 | Toda orden debe contener al menos un producto con cantidad positiva. | Implementado |
| RN-REC-03 | Toda orden debe registrar entrega estimada y metodo de pago antes de guardarse. | Implementado |
| RN-REC-04 | Las nuevas ordenes se crean con un estado inicial configurado por defecto. | Implementado |
| RN-REC-05 | La busqueda en recepcion debe permitir localizar pedidos por cliente o numero ignorando mayusculas y tildes. | Implementado |
| RN-REC-06 | En la edicion actual de pedidos el cliente no se modifica desde la interfaz. | Implementado |
| RN-PRD-01 | Solo deben entrar a produccion pedidos reconocidos como pendientes. | Implementado, dependiente del naming de estados |
| RN-PRD-02 | La interfaz debe mostrar cola de pendientes y pedidos activos en produccion. | Implementado |
| RN-PRD-03 | Un pedido solo puede marcarse como listo cuando todas sus lineas alcanzan la cantidad requerida. | Implementado |
| RN-PRD-04 | Al completar produccion debe sincronizarse el movimiento de stock operativo antes de cerrar el pedido. | Implementado |
| RN-PRD-05 | Debe poder consultarse la receta asociada a cada producto durante produccion. | Implementado |
| RN-PRD-06 | La regla del BRD "una orden por estacion de trabajo" no esta modelada en el frontend actual. | Pendiente |
| RN-ENT-01 | Solo deben aparecer en entrega las ordenes reconocidas como listas. | Implementado |
| RN-ENT-02 | Desde entrega debe poder cerrarse un pedido como entregado o cancelado. | Implementado |
| RN-ENT-03 | Entrega y cancelacion final deben sincronizar el movimiento de stock correspondiente. | Implementado |
| RN-EST-01 | Todo pedido debe tener un estado valido dentro del flujo operativo. | Implementado, con dependencia de backend |
| RN-EST-02 | Los pedidos entregados o cancelados no deben figurar en tableros operativos de recepcion, produccion o entrega. | Implementado |
| RN-EST-03 | El flujo secuencial y el registro historico de fecha/hora por transicion pertenecen al dominio pero no tienen visualizacion dedicada en este frontend. | Parcial |
| RN-EST-04 | El motivo de cancelacion mencionado en el BRD no se captura en la interfaz actual. | Pendiente |
| RN-CAT-01 | El sistema debe permitir administrar categorias, ingredientes y productos. | Implementado |
| RN-CAT-02 | La receta de un producto se administra dentro del ABM de productos. | Implementado |
| RN-CAT-03 | Los ingredientes deben conservar nombre, unidad de medida y costo. | Implementado |
| RN-CAT-04 | Existen componentes para ABM de estados y tipos de movimiento de stock, pero hoy no estan expuestos en rutas funcionales. | Parcial |
| RN-MET-01 | El sistema debe permitir consultar metricas relacionadas al flujo de pedidos. | Implementado |
| RN-MET-02 | Las metricas deben permitir filtro por rango de fechas o usar el rango por defecto del backend. | Implementado |
| RN-MET-03 | La informacion debe presentarse de forma clara y permitir detectar rendimientos y cuellos de botella. | Implementado |
| RN-MET-04 | El analisis de tiempos debe permitir profundizar desde estado hacia detalle de orden. | Implementado |

### 3.2 Casos de negocio principales

#### Caso 1. Alta de pedido en recepcion

El operador selecciona un cliente existente o crea uno nuevo, define entrega estimada, medio de pago y productos. El sistema valida la informacion minima, calcula el total y crea la orden.

#### Caso 2. Edicion de pedido existente

El operador abre una orden desde recepcion, ajusta productos o datos operativos y guarda los cambios. Si intenta salir sin guardar, el sistema solicita confirmacion.

#### Caso 3. Inicio de produccion

El operador de produccion toma un pedido pendiente y lo mueve al estado operativo de produccion para comenzar su preparacion.

#### Caso 4. Preparacion por linea

Durante la produccion, el operador consulta la receta de cada producto, revisa ingredientes y registra avance por linea hasta completar la cantidad solicitada.

#### Caso 5. Cierre de produccion

Cuando todas las lineas estan completas, el sistema sincroniza el movimiento de stock operativo y deja la orden en estado listo.

#### Caso 6. Entrega o cancelacion final

El operador de entrega revisa el detalle del pedido listo y lo marca como entregado o cancelado. En ambos casos se actualiza el movimiento de stock correspondiente.

#### Caso 7. Mantenimiento de catalogos

El usuario administrativo gestiona categorias, ingredientes y productos. Para productos puede ademas cargar o modificar su receta con ingredientes y cantidades.

#### Caso 8. Analisis operativo

El usuario administrativo consulta indicadores de negocio, concentra la lectura por periodo y profundiza en tiempos promedio por estado hasta llegar a una orden puntual.

## 4. Requerimientos funcionales

### 4.1 Historias de usuario

#### Recepcion

- **RF-01** Como operador de recepcion, quiero ver pedidos agrupados por estado, para organizar mi trabajo diario.
- **RF-02** Como operador de recepcion, quiero buscar pedidos por cliente o numero, para encontrar rapidamente una orden puntual.
- **RF-03** Como operador de recepcion, quiero seleccionar un cliente existente desde un modal de busqueda, para iniciar la carga del pedido sin salir del flujo.
- **RF-04** Como operador de recepcion, quiero crear un cliente nuevo desde el mismo flujo de pedido, para no depender de otra pantalla administrativa.
- **RF-05** Como operador de recepcion, quiero crear una orden con entrega estimada, pago y productos, para registrar una venta completa.
- **RF-06** Como operador de recepcion, quiero editar una orden existente, para corregir cantidades, productos o datos operativos.
- **RF-07** Como operador, quiero recibir una advertencia si intento salir con cambios sin guardar, para evitar perdida de trabajo.
- **RF-08** Como operador, quiero ver el total acumulado del pedido mientras lo edito, para validar el resumen antes de guardar.

#### Produccion

- **RF-09** Como operador de produccion, quiero ver la cola de pedidos pendientes y los pedidos activos, para priorizar preparacion.
- **RF-10** Como operador de produccion, quiero iniciar la produccion de un pedido pendiente, para comenzar su elaboracion.
- **RF-11** Como operador de produccion, quiero consultar la receta e ingredientes de cada producto, para preparar correctamente la orden.
- **RF-12** Como operador de produccion, quiero registrar el avance por linea, para reflejar cuantas unidades ya fueron preparadas.
- **RF-13** Como operador de produccion, quiero cerrar un pedido como listo solo cuando todas sus lineas esten completas, para no derivar ordenes incompletas.
- **RF-14** Como operador de produccion, quiero cancelar un pedido desde mi tablero, para resolver incidencias operativas.

#### Entrega

- **RF-15** Como operador de entrega, quiero ver los pedidos listos con su detalle, para verificar cliente, pago y lineas antes del cierre.
- **RF-16** Como operador de entrega, quiero marcar un pedido como entregado, para cerrar correctamente el flujo operativo.
- **RF-17** Como operador de entrega, quiero cancelar un pedido listo, para reflejar una anulacion de ultima instancia.

#### Administracion

- **RF-18** Como usuario administrativo, quiero gestionar categorias, para mantener organizado el catalogo.
- **RF-19** Como usuario administrativo, quiero gestionar ingredientes con unidad y costo, para sostener recetas y analitica economica.
- **RF-20** Como usuario administrativo, quiero gestionar productos y su receta, para definir correctamente la composicion de cada item vendido.

#### Metricas

- **RF-21** Como usuario administrativo, quiero ver un dashboard con facturacion, ticket promedio, clientes unicos y ordenes relevadas, para tener una lectura ejecutiva del negocio.
- **RF-22** Como usuario administrativo, quiero filtrar metricas por rango de fechas o volver al rango por defecto, para comparar periodos.
- **RF-23** Como usuario administrativo, quiero ver concentracion horaria de entregas, para detectar picos operativos.
- **RF-24** Como usuario administrativo, quiero consultar clientes destacados y productos mas vendidos, para entender demanda y recurrencia.
- **RF-25** Como usuario administrativo, quiero analizar tiempos promedio por estado y profundizar hasta una orden concreta, para detectar cuellos de botella reales.
- **RF-26** Como usuario administrativo, quiero ver costo, ganancia y margen estimado, para evaluar rentabilidad operativa.

### 4.2 Criterios de aceptacion

#### CA-01 Creacion de orden

- Dado un formulario vacio, cuando el usuario completa cliente, entrega estimada, metodo de pago y al menos un producto valido, entonces el sistema permite crear la orden.
- Dado un formulario incompleto, cuando falta alguno de esos datos, entonces el sistema muestra un error y no envia la solicitud.

#### CA-02 Seleccion y alta de clientes

- Dado el modal de clientes abierto, cuando el usuario busca por nombre o WhatsApp, entonces el sistema filtra coincidencias sobre la lista cargada.
- Dado que el cliente no existe, cuando el usuario crea uno nuevo con nombre y WhatsApp numerico, entonces el sistema lo devuelve seleccionado al formulario de orden.

#### CA-03 Resumen de productos

- Dado un producto ya agregado, cuando el usuario vuelve a incorporarlo, entonces el sistema incrementa su cantidad en lugar de duplicar una linea nueva.
- Dado un cambio de cantidad, cuando el usuario aumenta o reduce unidades, entonces el total del pedido se recalcula en el resumen.

#### CA-04 Edicion y proteccion de cambios

- Dado un pedido en edicion, cuando el usuario intenta salir con cambios sin guardar, entonces el sistema muestra un dialogo de confirmacion.
- Dado un pedido en edicion, cuando el usuario consulta el formulario, entonces el cliente aparece bloqueado para modificacion en la interfaz actual.

#### CA-05 Listado por estado en recepcion

- Dado que existen estados no finales, cuando carga recepcion, entonces el sistema muestra una vista segmentada por esos estados.
- Dado un estado seleccionado, cuando existen ordenes asociadas, entonces la vista muestra solo los pedidos de ese estado.

#### CA-06 Busqueda operativa

- Dado un listado de pedidos, cuando el usuario escribe un nombre de cliente o numero de orden, entonces el sistema filtra coincidencias ignorando mayusculas y tildes.
- Dado que no hay resultados, cuando finaliza la busqueda, entonces la vista informa que no se encontraron ordenes.

#### CA-07 Inicio de produccion

- Dado un pedido pendiente y los estados correctamente configurados, cuando el operador lo toma, entonces la orden pasa a produccion y deja de figurar como pendiente.
- Dado que el estado operativo no puede resolverse, cuando el operador intenta iniciar produccion, entonces el sistema informa un error de configuracion.

#### CA-08 Produccion por linea

- Dado un pedido en produccion, cuando el operador incrementa una linea, entonces el contador no supera la cantidad requerida.
- Dado un producto con receta cargada, cuando el operador expande su detalle, entonces el sistema muestra ingredientes y cantidades.

#### CA-09 Cierre de produccion

- Dado un pedido con lineas incompletas, cuando el operador intenta cerrarlo, entonces la interfaz no debe considerarlo completo.
- Dado un pedido completo, cuando el operador lo cierra, entonces el sistema sincroniza movimiento de stock `en_produccion` y luego cambia la orden a estado listo.

#### CA-10 Entrega

- Dado un pedido listo, cuando el operador lo selecciona, entonces el sistema muestra cliente, WhatsApp, metodo de pago, total y lineas del pedido.
- Dado que el operador confirma la entrega, cuando la operacion finaliza correctamente, entonces la orden cambia a estado entregado y se sincroniza el movimiento de stock correspondiente.

#### CA-11 Cancelacion operativa

- Dado un pedido en produccion o listo, cuando el operador confirma la cancelacion, entonces el sistema cambia la orden a cancelado.
- Dado que la cancelacion se hace desde entrega, cuando finaliza correctamente, entonces el movimiento de stock se sincroniza como `cancelado_con_perdida`.

#### CA-12 ABM de productos y recetas

- Dado un producto nuevo o existente, cuando el usuario administrativo guarda el formulario, entonces el sistema persiste nombre, categoria, precio y receta asociada.
- Dado un producto sin ingredientes de receta, cuando el usuario lo guarda, entonces el producto se puede persistir igualmente y la receta queda vacia o sin crear segun corresponda.

#### CA-13 ABM de ingredientes

- Dado un ingrediente, cuando el usuario administrativo lo crea o edita, entonces el sistema valida costo numerico mayor o igual a cero y unidad de medida obligatoria.
- Dado un ingrediente eliminado, cuando la API responde correctamente, entonces la grilla administrativa se refresca.

#### CA-14 Dashboard de metricas

- Dado que la API devuelve informacion agregada, cuando el dashboard carga, entonces el sistema muestra facturacion, ticket promedio, ordenes relevadas y clientes unicos.
- Dado un rango de fechas valido, cuando el usuario lo aplica, entonces el dashboard vuelve a consultar sus fuentes con ese periodo.
- Dado que el usuario reinicia el filtro, cuando selecciona "Usar default", entonces la pantalla vuelve a consultar el rango por defecto definido por backend.

#### CA-15 Analisis de tiempos

- Dado un grafico de tiempos promedio por estado, cuando el usuario selecciona un estado, entonces el sistema muestra sus ocurrencias por orden.
- Dado el detalle de un estado, cuando el usuario selecciona una orden, entonces el sistema muestra el drilldown completo del pedido con cabecera, cliente y lineas.

## 5. Pantallas de usuario

### 5.1 Rutas activas actuales

| Ruta | Modulo | Objetivo |
| --- | --- | --- |
| `/recepcion` | Recepcion | Ver pedidos por estado, buscar, crear, ver y editar. |
| `/produccion` | Produccion | Tomar pedidos pendientes, registrar avance, revisar recetas y completar o cancelar. |
| `/entrega` | Entrega | Revisar pedidos listos, inspeccionar detalle y cerrar como entregado o cancelado. |
| `/administrativo/categorias` | Administrativo | Gestion de categorias. |
| `/administrativo/ingredientes` | Administrativo | Gestion de ingredientes con unidad y costo. |
| `/administrativo/productos` | Administrativo | Gestion de productos, precio, categoria y receta. |
| `/administrativo/metricas` | Metricas | Dashboard de indicadores operativos y analiticos. |

### 5.2 Componentes funcionales relevantes

- Modal de seleccion de clientes con busqueda local.
- Modal de alta rapida de clientes.
- Formulario de alta y formulario de edicion de pedidos.
- Dialogos de confirmacion para guardar, cancelar o descartar cambios.
- Tablero de pendientes y tablero de produccion activa.
- Vista de detalle para entrega.
- Drilldown de metricas desde estado hacia orden.

### 5.3 Componentes preparados pero no publicados hoy en la navegacion

- Componente de gestion de estados operativos.
- Componente de gestion de tipos de movimiento de stock.

Observacion: las rutas `/administrativo/estados` y `/administrativo/tipos-movimiento-stock` redirigen actualmente a `/administrativo/categorias`, por lo que esas capacidades no estan disponibles para usuarios finales desde la navegacion actual.

## 6. Requerimientos no funcionales

1. La interfaz debe responder correctamente en desktop y mobile.
2. Los errores de API deben mostrarse en lenguaje claro para el usuario operativo.
3. Las acciones sensibles deben confirmarse antes de ejecutarse.
4. Los cambios en pedidos deben reflejarse en otras vistas operativas sin requerir recarga manual completa.
5. El frontend debe tolerar variaciones menores en contratos de API mediante adaptadores y normalizacion de payloads.
6. La experiencia debe priorizar velocidad operativa, bajo numero de clicks y lectura clara del estado del pedido.

## 7. Brechas, riesgos y decisiones abiertas

1. La deteccion de estados operativos depende de nombres textuales devueltos por backend.
2. La sincronizacion de stock depende de que existan tipos de movimiento con naming exacto o compatible.
3. El BRD habla de estaciones de trabajo en produccion, pero el frontend actual no modela esa entidad.
4. El BRD pide motivo de cancelacion y registro temporal de cambios de estado; la interfaz actual no expone ninguno de los dos.
5. Los ABM de estados y tipos de movimiento de stock existen en codigo, pero hoy no son accesibles desde la navegacion publicada.
6. No se observa en este frontend control de acceso por roles ni autenticacion.
7. La rentabilidad y el dashboard administrativo dependen de endpoints de metricas especificos; si esos contratos cambian, el modulo es especialmente sensible.

## 8. Glosario

| Termino | Descripcion |
| --- | --- |
| Orden | Pedido registrado para un cliente, con productos, importe y estado. |
| Linea de orden | Producto individual dentro de una orden con cantidad y subtotal. |
| Estado | Etapa operativa del pedido dentro del flujo del negocio. |
| Recepcion | Modulo donde se registran, consultan y editan pedidos. |
| Produccion | Modulo donde se prepara la orden y se controla avance por linea. |
| Entrega | Modulo donde se revisa y cierra el pedido listo para el cliente. |
| Receta | Composicion de ingredientes y cantidades necesarias para un producto. |
| Movimiento de stock | Registro operativo asociado a una orden en produccion, entrega o cancelacion. |
| Dashboard | Vista consolidada de indicadores operativos y comerciales. |
| Drilldown | Navegacion desde una metrica agregada hacia su detalle por estado u orden. |

## 9. Notas de trazabilidad

Este documento fue reconstruido tomando como fuentes:

- El **BRD "Operations Management System" fechado el 2026-04-22**.
- El **FRD de referencia** provisto por el usuario como modelo de estructura.
- El **estado real del frontend** disponible en este repositorio al **2026-06-18**.

Cuando el BRD y la implementacion actual no coinciden, este FRD distingue explicitamente:

- lo **implementado hoy** en el frontend,
- lo **parcialmente cubierto**,
- y lo **pendiente o no visible** en la interfaz actual.

El objetivo es que el documento sirva tanto como fotografia fiel del sistema construido hasta ahora como base de trabajo para los proximos incrementos funcionales.
