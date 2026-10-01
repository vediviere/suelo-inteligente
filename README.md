# TLALCANI — Aplicación móvil

Aplicación móvil desarrollada con React Native y Expo para registrar, visualizar y analizar mediciones del suelo.

## Funcionalidades

- Inicio de sesión.
- Selección de zona y cultivo.
- Registro de lecturas del suelo.
- Análisis de pH, conductividad, humedad, ORP y temperatura.
- Consulta del historial.
- Interpretación generada mediante inteligencia artificial.
- Almacenamiento temporal de lecturas sin conexión.
- Sincronización automática con la API.
- Tema claro y oscuro.

## Tecnologías

- React Native
- Expo
- Expo Router
- TypeScript
- AsyncStorage
- React Native SVG

## Requisitos

- Node.js 22 o compatible.
- npm.
- Expo Go instalado en el dispositivo móvil.
- Conexión a Internet.

## Instalación

```bash
git clone https://github.com/vediviere/suelo-inteligente.git
cd suelo-inteligente
npm install
```

## Variables de entorno

Crear un archivo `.env` en la carpeta principal:

```env
EXPO_PUBLIC_API_URL=https://api-suelo-inteligente.onrender.com
EXPO_PUBLIC_USAR_MOCKS=true
```

| Variable                 | Descripción                                                                     |
| ------------------------ | ------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`    | Dirección de la API utilizada por la aplicación.                                |
| `EXPO_PUBLIC_USAR_MOCKS` | Activa las lecturas simuladas que sustituyen temporalmente al sensor Bluetooth. |

> Para esta demostración, `EXPO_PUBLIC_USAR_MOCKS` debe permanecer en `true`.

## Ejecución local

```bash
npx expo start
```

Si existen problemas de red:

```bash
npx expo start --tunnel
```

Para limpiar la caché:

```bash
npx expo start --tunnel --clear
```

Después, escanear el código QR con Expo Go.

## Credenciales de demostración

```text
Correo: demo@suelo.app
Contraseña: Demo1234
```

## Generación de la APK

El perfil `preview` de `eas.json` debe contener:

```json
"env": {
  "EXPO_PUBLIC_API_URL": "https://api-suelo-inteligente.onrender.com",
  "EXPO_PUBLIC_USAR_MOCKS": "true"
}
```

Generar la APK:

```bash
eas build -p android --profile preview
```

## Flujo de la demostración

1. El usuario inicia sesión.
2. Selecciona una zona y un cultivo.
3. La aplicación genera una lectura simulada.
4. La lectura se guarda temporalmente.
5. Si existe conexión, se envía a la API.
6. La API procesa los valores.
7. La aplicación muestra el análisis.
8. Si no existe conexión, la lectura queda pendiente.
9. Cuando regresa la conexión, la aplicación intenta sincronizarla.

## Estructura principal

```text
assets/
src/
├── Config/
├── Context/
├── Data/
├── Models/
├── Services/
└── app/
    ├── (Tabs)/
    ├── _layout.tsx
    └── login.tsx
```

## Consideraciones

- Bluetooth no está implementado en esta demostración.
- Las lecturas simuladas representan los datos que posteriormente enviará el sensor.
- Las lecturas sí se envían a la API publicada en Render.
- Render puede tardar algunos segundos en responder después de un periodo de inactividad.
- La clave de Groq nunca debe colocarse en la aplicación móvil.
