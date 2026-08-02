# ResGuard — Gestión de copropiedad

ResGuard es una aplicación web pensada para **conjuntos residenciales y administradores de propiedad horizontal**. Centraliza en un solo lugar la información y las tareas cotidianas: quién entra, cómo van los pagos, qué se comunica a los residentes y cómo se ve el conjunto en conjunto.

Esta guía está escrita para **personas que usan la herramienta**, no para equipos de desarrollo.

---

## Para qué sirve

- **Seguridad y portería**: registro de visitantes, control visual del conjunto y alertas cuando algo requiere atención.
- **Administración del edificio**: residentes, parqueaderos, comunicados y reportes del conjunto asignado.
- **Supervisión global** (cuando aplica): visión de varios conjuntos y estado general del servicio.
- **Residentes**: consultar avisos, pagos, solicitudes relacionadas con su unidad y el uso común.

La pantalla que ve cada persona depende de su **rol**: no todos tienen las mismas opciones, para proteger la privacidad y evitar cambios accidentales.

---

## Cómo entrar a la aplicación

### Modo demostración (sin cuenta real)

Si la organización aún no ha configurado inicio de sesión con cuentas corporativas, verás una **pantalla de bienvenida** donde puedes:

1. Elegir el **tipo de perfil** (por ejemplo, residente, portería o administración).
2. Seleccionar un **usuario de ejemplo** asociado a ese perfil.
3. Pulsar **Ingresar al sistema** para explorar el tablero como si fueras esa persona.

Ese modo sirve para **capacitación, presentaciones o pruebas**. Los datos mostrados son de ejemplo y no sustituyen la información real del conjunto.

### Modo con cuenta (cuando esté activado)

Cuando el administrador del sistema active el acceso con **cuentas reales**, verás una pantalla de **inicio de sesión seguro**. Debes usar el correo y el método de acceso que te haya indicado tu administración (por ejemplo, correo y contraseña o acceso social, según lo configurado).

Si no tienes acceso, solicita al **administrador de tu copropiedad** o al **equipo de ResGuard** que te den de alta con el rol adecuado.

---

## Roles y qué puede hacer cada uno (resumen)

| Rol | En pocas palabras |
| --- | --- |
| **Super administrador** | Visión amplia del servicio y de los conjuntos conectados; orientado a quien gestiona la plataforma a nivel general. |
| **Administrador del edificio** | Gestiona un conjunto: residentes, comunicaciones, pagos y configuración operativa de ese edificio. |
| **Vigilante / portero** | Enfocado en acceso, visitantes y seguridad perimetral del conjunto. |
| **Residente** | Consulta y acciones propias de su unidad: avisos, pagos, solicitudes, etc. |

Los nombres exactos en pantalla pueden variar ligeramente, pero la idea de cada rol es la misma.

---

## Privacidad y buenas prácticas

- No compartas tu sesión con otras personas; cada cuenta debe corresponder a quien la usa.
- Si ves datos que no deberían mostrarse, avisa de inmediato al administrador del conjunto o a soporte.
- Cierra sesión al usar equipos compartidos (portería, sala de reuniones, etc.).

---

## Próximos pasos del producto

La hoja de ruta incluye módulos como **secretaría documental**, **asambleas virtuales con votación**, **finanzas**, **mantenimiento**, **convivencia y PQRS** y **citofonía virtual**. Algunas funciones pueden estar en preparación o mostrarse con datos de prueba según el entorno.

---

## Soporte

Para dudas sobre permisos, altas de usuario o uso en tu copropiedad, contacta al **administrador de tu conjunto** o al canal de soporte que te haya indicado tu organización.

---

_Documentación orientada a usuarios finales. La configuración técnica de servidores, bases de datos y despliegues la gestiona el equipo de implementación._

---

## Anexo breve para equipos de implementación

- Hay un archivo **`.env.example`** en la raíz con el nombre de las variables (sin secretos); sirve de guía para entornos local, QA y productivo.
- Las dependencias del proyecto se instalan con **pnpm** (`pnpm install`).
