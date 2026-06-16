# Documentacion de Requerimientos Funcionales

## 1. Historial de cambios

| Version | Fecha | Autor | Descripcion |
| --- | --- | --- | --- |
| 1.0 | 2026-05-23 | Codex | Version inicial del FRD adaptada al proyecto actual de Operations Management System Frontend. |

## 2. Alcance

### 2.1 Descripcion del proyecto / Objetivos

El proyecto **Operations Management System Frontend** es una aplicacion web desarrollada con Next.js 16, React 19 y TypeScript para operar el flujo completo de pedidos de un negocio de elaboracion y entrega.

El sistema organiza el trabajo en cuatro frentes principales:

- **Recepcion**: alta, consulta, edicion y seguimiento inicial de ordenes.
- **Produccion**: puesta en marcha del pedido, visualizacion de recetas e incremento de avance por linea.
- **Entrega**: control final del pedido listo, consulta del detalle y cierre como entregado o cancelado.
- **Administracion y metricas**: mantenimiento de catalogos operativos y visualizacion de indicadores del negocio.

Objetivos del producto:

- Centralizar el ciclo operativo de una orden desde su registro hasta su entrega.
- Reducir errores operativos entre las etapas de recepcion, cocina/produccion y despacho.
- Dar visibilidad del estado real de cada pedido.
- Facilitar la administracion de datos maestros como productos, categorias, ingredientes y estados.
- Exponer metricas de facturacion, clientes, tiempos por estado y concentracion horaria de entregas.

### 2.2 Justificacion

El proyecto responde a la necesidad de contar con una interfaz operativa unica para equipos que hoy dependen de informacion dispersa o procesos manuales. La aplicacion ordena el trabajo diario, hace mas trazable cada pedido y mejora la capacidad de control del negocio.

### 2.3 Hipotesis

- El negocio trabaja con un flujo de estados claramente diferenciados.
- Las ordenes necesitan atravesar las etapas de recepcion, produccion y entrega.
- El backend ya expone o expondra los recursos necesarios para ordenes, catalogos, recetas y metricas.
- Los usuarios operativos requieren pantallas simples, rapidas y orientadas a la tarea.

### 2.4 Restricciones

- El frontend depende de la disponibilidad y consistencia de la API.
- La logica de transicion entre estados se apoya parcialmente en nombres de estados devueltos por backend.
- Algunas metricas avanzadas, como margen o ganancias vs costos, aun no cuentan con endpoint dedicado.
- El alcance actual visible en el repositorio no incluye autenticacion, autorizacion por rol ni auditoria historica.

### 2.5 Dependencias

- API REST para ordenes, lineas de orden, clientes, productos, estados, recetas y metricas.
- Configuracion correcta de estados operativos como `pendiente`, `en produccion`, `listo`, `entregado` y `cancelado`.
- Catalogos administrativos cargados: categorias, productos, ingredientes, tipos de movimiento de stock y metodos de pago.
- Datos de recetas por producto para enriquecer la vista de produccion.

### 2.6 Alcance funcional

Incluido en el alcance actual:

- Crear, consultar y editar ordenes.
- Buscar ordenes por cliente o numero.
- Visualizar ordenes agrupadas por estado.
- Iniciar la produccion de un pedido pendiente.
- Consultar recetas e ingredientes por producto en produccion.
- Marcar el avance de produccion por linea.
- Completar o cancelar pedidos en produccion.
- Visualizar pedidos listos para entrega.
- Revisar detalle del pedido antes de despachar.
- Marcar pedidos como entregados o cancelados en entrega.
- Administrar entidades maestras desde el modulo administrativo.
- Consultar metricas de negocio y tiempos operativos por rango de fechas.

Fuera del alcance actual observado:

- Login y gestion de permisos.
- Notificaciones automaticas a clientes.
- Integracion nativa con WhatsApp o pasarelas de pago.
- Gestion de stock en tiempo real dentro del flujo operativo.
- Reportes de rentabilidad basados en costo real por pedido.

## 3. Informacion de requerimientos de negocio

### 3.1 Reglas de negocio

1. Toda orden debe tener un cliente valido, fecha/hora estimada de entrega, metodo de pago, estado y al menos una linea de producto.
2. Una orden no puede guardarse con productos inexistentes o cantidades no positivas.
3. La recepcion trabaja sobre estados no finales.
4. Produccion solo puede operar correctamente si existen estados reconocibles para pendiente, en produccion, listo y cancelado.
5. Entrega solo puede operar correctamente si existen estados reconocibles para listo, entregado y cancelado.
6. Un pedido puede pasar de pendiente a en produccion desde el tablero de produccion.
7. Un pedido solo puede completarse en produccion cuando todas sus lineas alcanzan la cantidad requerida.
8. Un pedido puede cancelarse tanto desde produccion como desde entrega.
9. La vista de produccion debe mostrar la receta asociada a cada producto cuando exista.
10. Las metricas deben poder filtrarse por rango de fechas cuando el backend lo soporte.
11. El dashboard debe mostrar valores agregados del negocio y permitir analizar cuellos de botella por estado.
12. Los cambios sobre ordenes deben refrescar el resto de vistas operativas mediante eventos del cliente (`orders:changed`).

### 3.2 Casos de negocio principales

#### Caso 1. Alta de pedido en recepcion

El operador de recepcion selecciona o crea un cliente, define entrega estimada, metodo de pago, estado inicial y agrega productos. El sistema valida la informacion minima y crea la orden.

#### Caso 2. Edicion de pedido existente

El operador abre una orden existente, ajusta datos generales o lineas y guarda los cambios. Si intenta salir con cambios sin persistir, el sistema solicita confirmacion.

#### Caso 3. Inicio de produccion

Desde el tablero de pendientes, el operador de produccion toma un pedido y lo mueve a estado en produccion para comenzar su preparacion.

#### Caso 4. Preparacion por linea

El operador consulta los productos del pedido, revisa ingredientes por receta e incrementa el avance por linea hasta completar las cantidades requeridas.

#### Caso 5. Cierre de produccion

Una vez completadas todas las lineas, el sistema habilita el cierre del pedido como listo para entrega.

#### Caso 6. Despacho del pedido

El operador de entrega selecciona un pedido listo, revisa el detalle del cliente y las lineas del pedido, y lo marca como entregado o cancelado.

#### Caso 7. Administracion de catalogos

Un usuario administrativo mantiene categorias, estados, ingredientes, productos y otros catalogos necesarios para la operacion.

#### Caso 8. Analisis operativo

Un usuario administrativo consulta metricas de facturacion, ticket promedio, clientes frecuentes, horarios de entrega y tiempos promedio por estado para detectar desbalances operativos.

## 4. Requerimientos funcionales

### 4.1 Historias de usuario

#### RF-01 Recepcion de pedidos

Como operador de recepcion, quiero ver las ordenes agrupadas por estado, para identificar rapidamente que pedidos debo revisar o actualizar.

#### RF-02 Busqueda de pedidos

Como operador de recepcion, quiero buscar ordenes por cliente o numero, para encontrar un pedido puntual sin recorrer toda la lista.

#### RF-03 Alta de pedido

Como operador de recepcion, quiero crear una orden con cliente, metodo de pago, horario estimado y productos, para registrar correctamente una venta.

#### RF-04 Edicion de pedido

Como operador de recepcion, quiero editar una orden existente, para corregir datos o ajustar productos antes de su procesamiento.

#### RF-05 Proteccion ante cambios sin guardar

Como operador, quiero recibir una advertencia si intento salir de una pantalla con cambios sin guardar, para evitar perder trabajo por error.

#### RF-06 Inicio de produccion

Como operador de produccion, quiero tomar un pedido pendiente y moverlo a produccion, para comenzar su preparacion.

#### RF-07 Visualizacion de receta

Como operador de produccion, quiero ver la receta e ingredientes de cada producto, para preparar el pedido sin depender de consultas externas.

#### RF-08 Registro de avance

Como operador de produccion, quiero incrementar la cantidad preparada por linea, para reflejar el progreso real del pedido.

#### RF-09 Cierre de produccion

Como operador de produccion, quiero completar un pedido solo cuando todas las lineas esten listas, para evitar enviar ordenes incompletas a entrega.

#### RF-10 Entrega del pedido

Como operador de despacho, quiero visualizar los pedidos listos y marcarlos como entregados, para cerrar el flujo operativo.

#### RF-11 Cancelacion operativa

Como operador, quiero poder cancelar un pedido desde produccion o entrega, para reflejar incidencias o anulaciones del negocio.

#### RF-12 Administracion de catalogos

Como usuario administrativo, quiero mantener entidades maestras del sistema, para que la operacion trabaje con datos actualizados.

#### RF-13 Dashboard operativo

Como usuario administrativo, quiero consultar metricas agregadas y analiticas por periodo, para tomar decisiones basadas en datos.

#### RF-14 Analisis de tiempos por estado

Como usuario administrativo, quiero analizar tiempos promedio por estado y profundizar hasta el detalle de una orden, para detectar cuellos de botella.

### 4.2 Criterios de aceptacion

#### CA-01 Creacion de orden

- Dado un formulario de orden vacio, cuando el usuario completa cliente, entrega estimada, metodo de pago, estado y al menos un producto valido, entonces el sistema permite guardar la orden.
- Dado un formulario incompleto, cuando falta alguno de esos campos, entonces el sistema muestra un error y no envia la solicitud.

#### CA-02 Validacion de lineas

- Dado un pedido con productos seleccionados, cuando una linea tiene producto invalido o cantidad no positiva, entonces el sistema bloquea la operacion.
- Dado un producto ya agregado, cuando el usuario vuelve a seleccionarlo, entonces el sistema incrementa su cantidad en vez de duplicar la linea.

#### CA-03 Navegacion con cambios sin guardar

- Dado un usuario creando o editando una orden, cuando intenta salir con cambios sin persistir, entonces el sistema muestra un dialogo de confirmacion.
- Dado que el usuario confirma descartar cambios, cuando continua la navegacion, entonces el sistema cambia de vista sin conservar ediciones temporales.

#### CA-04 Listado por estado en recepcion

- Dado que existen estados operativos no finales, cuando la vista de recepcion carga correctamente, entonces el sistema muestra tabs o botones por estado.
- Dado un estado seleccionado, cuando existen ordenes asociadas, entonces la vista lista solo las ordenes de ese estado.

#### CA-05 Busqueda de ordenes

- Dado un listado de ordenes, cuando el usuario escribe un cliente o numero, entonces la vista filtra coincidencias ignorando mayusculas y tildes.
- Dado que no hay coincidencias, cuando finaliza la busqueda, entonces la vista informa que no se encontraron ordenes.

#### CA-06 Inicio de produccion

- Dado un pedido pendiente, cuando el operador lo selecciona en el tablero lateral, entonces el sistema intenta moverlo a produccion.
- Dado que la transicion fue exitosa, cuando la operacion finaliza, entonces la orden deja de figurar como pendiente y aparece en produccion.

#### CA-07 Produccion por linea

- Dado un pedido en produccion, cuando el operador incrementa una linea, entonces el sistema actualiza el contador de unidades preparadas.
- Dado que una linea alcanza su cantidad requerida, cuando la vista se refresca, entonces la linea aparece como completa.

#### CA-08 Recetas en produccion

- Dado un producto con receta cargada, cuando el operador despliega su detalle, entonces el sistema muestra los ingredientes y cantidades.
- Dado un producto sin receta, cuando el operador abre el detalle, entonces el sistema informa que aun no existe receta cargada.

#### CA-09 Completar pedido

- Dado un pedido en produccion, cuando no todas las lineas estan completas, entonces el boton de completar no debe cerrar el pedido.
- Dado que todas las lineas estan completas, cuando el operador confirma el cierre, entonces el sistema mueve la orden al siguiente estado operativo de listo.

#### CA-10 Entrega

- Dado un pedido en estado listo, cuando el operador lo selecciona, entonces el sistema muestra cliente, whatsapp, medio de pago, total y lineas.
- Dado que el operador confirma la entrega, cuando la operacion termina, entonces la orden cambia a estado entregado.

#### CA-11 Cancelacion

- Dado un pedido seleccionado, cuando el operador confirma la cancelacion desde produccion o entrega, entonces el sistema cambia la orden al estado cancelado.

#### CA-12 Dashboard de metricas

- Dado que la API devuelve datos agregados, cuando el dashboard carga, entonces el sistema muestra facturacion total, ticket promedio, ordenes relevadas y clientes unicos.
- Dado un rango de fechas valido, cuando el usuario lo aplica, entonces el dashboard vuelve a consultar las metricas sobre ese periodo.

#### CA-13 Tiempos por estado

- Dado que existen metricas por estado, cuando el usuario selecciona un estado del grafico, entonces el sistema muestra el detalle de ocurrencias por orden.
- Dado una ocurrencia seleccionada, cuando el usuario profundiza al detalle, entonces el sistema muestra la informacion completa de la orden relacionada.

#### CA-14 Configuracion de estados

- Dado que la API no devuelve nombres de estados reconocibles, cuando carga la vista de produccion o entrega, entonces el sistema debe informar un error de configuracion operativa.

## 5. Pantallas de usuario

### 5.1 Pantallas operativas actuales

| Ruta | Modulo | Objetivo |
| --- | --- | --- |
| `/recepcion` | Recepcion | Gestionar ordenes por estado, buscar, crear, ver y editar. |
| `/produccion` | Produccion | Tomar pedidos pendientes, producir por linea, revisar recetas y completar o cancelar. |
| `/entrega` | Entrega | Revisar pedidos listos, inspeccionar detalle y cerrar como entregado o cancelado. |
| `/administrativo` | Administrativo | Punto de entrada al modulo de catalogos. |
| `/administrativo/categorias` | Administrativo | Gestion de categorias. |
| `/administrativo/estados` | Administrativo | Gestion de estados operativos. |
| `/administrativo/ingredientes` | Administrativo | Gestion de ingredientes. |
| `/administrativo/productos` | Administrativo | Gestion de productos. |
| `/administrativo/tipos-movimiento-stock` | Administrativo | Gestion de tipos de movimiento. |
| `/administrativo/metricas` | Metricas | Dashboard operativo y analitico. |

### 5.2 Componentes funcionales relevantes

- Selector y alta de clientes dentro del flujo de orden.
- Formularios de creacion y edicion de pedidos.
- Dialogos de confirmacion para acciones destructivas o perdida de cambios.
- Tableros de pendientes, produccion activa y pedidos listos.
- Drilldown de metricas por estado y por orden.

## 6. Requerimientos no funcionales observables

1. La interfaz debe responder bien en desktop y mobile.
2. Las operaciones sensibles deben confirmar acciones destructivas.
3. Los errores de API deben mostrarse en lenguaje claro al usuario.
4. El sistema debe reflejar cambios operativos sin recarga manual completa.
5. La busqueda y navegacion de ordenes deben priorizar rapidez visual y baja friccion operativa.

## 7. Riesgos y pendientes

1. La deteccion de estados operativos depende del nombre textual de cada estado en backend.
2. El dashboard identifica explicitamente una metrica faltante de ganancias vs costos, lo que bloquea analitica de margen real.
3. No se observa en este frontend una capa de seguridad por roles, por lo que el control de acceso podria estar pendiente o resuelto fuera de este repositorio.
4. La consistencia del flujo depende de que las APIs de ordenes, recetas y metricas mantengan contratos compatibles.

## 8. Glosario

| Termino | Descripcion |
| --- | --- |
| Orden | Pedido registrado para un cliente, con productos, importe y estado. |
| Linea de orden | Producto individual dentro de una orden con su cantidad y subtotal. |
| Estado | Etapa operativa de una orden dentro del flujo del negocio. |
| Recepcion | Modulo donde se registran y administran pedidos antes de produccion. |
| Produccion | Modulo donde se prepara cada pedido y se controla el avance por linea. |
| Entrega | Modulo donde se revisa y cierra el pedido listo para el cliente. |
| Receta | Relacion de ingredientes necesarios para preparar un producto. |
| Dashboard | Vista consolidada de indicadores operativos y comerciales. |
| Cuello de botella | Estado o tramo del flujo que concentra el mayor tiempo promedio por orden. |

## 9. Notas de trazabilidad

Este documento fue construido con base en el estado actual del frontend disponible en el repositorio al **2026-05-23**. Describe principalmente el comportamiento observable en las rutas, hooks y servicios implementados, y marca como dependencias o pendientes aquellos puntos que hoy recaen en la API o no aparecen resueltos en el codigo del cliente.
