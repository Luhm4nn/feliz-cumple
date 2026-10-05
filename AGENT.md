# Reglas y Directivas para el Asistente (AGENT.md)

## Verificación de Código y Entorno de Desarrollo (Next.js)

- **NO ejecutar `next build` / `pnpm build` para verificar código en desarrollo**:
  - Ejecutar `build` genera la carpeta `.next` con artefactos de producción compilados, lo que interfiere con el servidor de desarrollo (`next dev`) y rompe el Fast Refresh / Hot Reload en tiempo real.
  - Para chequear validez de sintaxis y tipos sin interferir con la caché del servidor dev, utilizar únicamente chequeo de tipos de TypeScript:
    ```bash
    pnpm --filter feliz-cumple-front tsc --noEmit
    ```
- **Si en algún momento excepcional se requiere ejecutar `build`**:
  - Es **obligatorio borrar la caché compilada (`front/.next`)** inmediatamente después para no afectar el flujo del desarrollador:
    ```bash
    Remove-Item -Recurse -Force front\.next
    ```
