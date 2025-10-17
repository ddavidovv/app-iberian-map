# Diseño UX - Mantenimiento de Modelos Tarifarios

## Objetivo
Permitir a los equipos de pricing crear, consultar y mantener Modelos Tarifarios que agrupan productos con dos atributos clave por producto:

- **Disponible**: el producto se puede ofertar dentro del modelo.
- **Obligatorio**: la contratación del producto es requerida si se usa el modelo.

El flujo debe facilitar la revisión rápida del estado de cada producto y minimizar errores al activar productos obligatorios.

## Personas y necesidades
- **Analista de pricing**: configura modelos a partir de combinaciones de productos aprobadas.
- **Comercial senior**: consulta modelos existentes para definir ofertas personalizadas.
- **Administrador**: realiza cambios estructurales (renombrar, clonar, archivar).

Necesitan una visión clara del inventario de modelos, edición segura y trazabilidad de cambios.

## Casos de uso priorizados
1. Crear un nuevo modelo desde cero seleccionando productos relevantes.
2. Revisar y actualizar el estado (disponible/obligatorio) de productos dentro de un modelo existente.
3. Duplicar un modelo para usarlo como base de una variante.
4. Archivar/eliminar modelos que ya no se utilicen manteniendo histórico.
5. Consultar rápidamente qué productos son obligatorios en cada modelo.

## Arquitectura de información
- **Página**: `/admin/rate-models` (acceso desde menú Admin).
- **Layout**:
  - **Panel izquierdo (30%)**: listado de modelos con buscador, filtros (estado, última actualización), contador y botón “Nuevo modelo”.
  - **Panel derecho (70%)**: detalle editable del modelo seleccionado.
    - Cabecera: nombre del modelo, estado (Borrador/Activo/Archivado), meta (creador, fechas), acciones (Guardar, Cancelar, Duplicar, Archivar).
    - Sección “Productos”: tabla/matriz con filas por producto.
      - Columnas: Código, Nombre, Etiquetas, switches Disponibilidad y Obligatoriedad.
      - Reglas: Obligatorio deshabilitado si Disponible = off; activar Obligatorio fuerza Disponible on.
    - Sección “Notas internas”: campo multilinea para documentación breve.
    - Registro de actividad reciente (últimos 5 cambios) de forma compacta.

## Interacciones clave
- **Selección de modelo**: clic en tarjeta/ fila -> panel detalle se actualiza. Indicar selección con resalte.
- **Creación**:
  1. Botón “Nuevo modelo” abre modal/capa lateral.
  2. Formulario: nombre (obligatorio), descripción, lista rápida de productos (checkbox múltiple).
  3. Al confirmar, se crea en estado Borrador y se abre en el panel derecho para afinado.
- **Edición productos**:
  - Switch de “Disponible” activa/desactiva producto.
  - Checkbox/switch “Obligatorio” depende de Disponible. Tooltip explica restricción.
  - Botón “Marcar todos”/“Limpiar todos” en encabezado de tabla para acelerar cambios masivos.
- **Guardado**:
  - Botón “Guardar cambios” fijo en cabecera cuando hay modificaciones (sticky).
  - Mensajes toast para confirmación o error detallado.
  - Validaciones inline (p.ej., al intentar guardar con nombre vacío).
- **Duplicar**: acción abre modal para introducir nombre y estado inicial (Borrador/Activo).
- **Archivar/Eliminar**: requiere confirmación secundaria con texto explicativo; los modelos archivados se muestran con etiqueta y sólo lectura hasta reactivarlos.

## Estados vacíos y errores
- **Sin modelos**: mensaje con CTA “Crear primer modelo”.
- **Sin selección**: panel derecho muestra instrucciones breves.
- **Error de carga**: banner rojo con opción “Reintentar”.
- **Guardado en conflicto**: aviso amarillo con opción “Recargar modelo” o “Sobrescribir”.

## Responsive
- Desktop (>=1280px): layout dos columnas.
- Tablet (768-1279px): listado colapsable (accordion) sobre detalle.
- Mobile (<768px): flujo secuencial (lista -> detalle en página dedicada de pantalla completa).

## Elementos reutilizables
- **Tabla de productos**: usar componentes table existentes o crear `RatesModelProductRow`.
- **Toasts**: reutilizar mecanismo de notificaciones (añadir si no existe).
- **Confirm dialogs**: componente genérico en `src/components/common/ConfirmDialog`.

## Métricas de éxito
- Reducir tiempo de alta de modelo a <5 min.
- Evitar errores de obligatoriedad (ningún producto obligatorio marcado como no disponible).
- Trazabilidad: cada cambio persistente con sello de tiempo y usuario (mostrar en actividad).

## Próximos pasos técnicos
1. Diseñar API `ratesModels` con operaciones CRUD.
2. Definir esquema de datos compartido (`RatesModel`, `RatesModelProduct`).
3. Implementar página React con estado optimista y manejo de errores.
4. Añadir pruebas o fixtures de ejemplo en `workfiles/`.
