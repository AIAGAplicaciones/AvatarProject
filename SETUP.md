# Avatar IA Interactivo - Guía de Configuración

## Requisitos Previos

- Node.js 18 o superior
- API Key de OpenAI
- (Opcional) API Key de ElevenLabs para voces realistas

## Pasos de Configuración

### 1. Configurar Variables de Entorno

Edita el archivo `.env.local` y añade tus API keys:

```env
OPENAI_API_KEY=sk-tu-api-key-de-openai-aqui
ELEVENLABS_API_KEY=tu-api-key-de-elevenlabs-aqui
```

**Obtener API Keys:**
- **OpenAI**: https://platform.openai.com/api-keys
- **ElevenLabs** (opcional): https://elevenlabs.io - Tier gratuito con 10,000 caracteres/mes

### 2. Añadir Avatar 3D (Opcional pero Recomendado)

Para usar un avatar 3D realista de Ready Player Me:

1. Ve a https://readyplayer.me
2. Crea tu avatar personalizado
3. Copia la URL del avatar (ej: `https://models.readyplayer.me/TU_ID.glb`)
4. Descarga el modelo con los morph targets:

```bash
# Reemplaza TU_ID con el ID de tu avatar
curl -L "https://models.readyplayer.me/TU_ID.glb?morphTargets=ARKit,Oculus%20Visemes" -o public/models/avatar.glb
```

Si no añades un avatar, se mostrará un avatar placeholder animado.

### 3. Ejecutar la Aplicación

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

Abre http://localhost:3000 en tu navegador.

## Uso

1. **Chat por texto**: Escribe en el campo de texto y presiona Enter o el botón de enviar
2. **Chat por voz**: Haz clic en el botón del micrófono 🎤 para hablar
3. **Mueve la cámara**: Arrastra con el ratón para rotar la vista

## Personalización

### Cambiar la Personalidad del Avatar

Edita `src/config/personality.ts`:

```typescript
export const avatarPersonality = {
  name: "Tu Asistente",
  role: "Tu rol personalizado",
  systemPrompt: `Tu prompt personalizado aquí...`,
  voiceId: "ID_de_voz_de_ElevenLabs",
  language: "es-ES"
};
```

### Voces de ElevenLabs Populares

| Nombre | ID | Descripción |
|--------|-----|-------------|
| Rachel | 21m00Tcm4TlvDq8ikWAM | Voz femenina tranquila |
| Domi | AZnzlk1XvdvUeBnXmlld | Voz femenina expresiva |
| Bella | EXAVITQu4vr4xnSDxMaL | Voz femenina suave |
| Antoni | ErXwobaYiN019PkySvjV | Voz masculina profunda |

## Estructura del Proyecto

```
src/
├── app/                 # Páginas y API routes
│   ├── api/chat/        # Endpoint de ChatGPT
│   └── api/tts/         # Endpoint de Text-to-Speech
├── components/
│   ├── Scene3D/         # Escena 3D y Avatar
│   └── Chat/            # Panel de chat
├── hooks/               # Hooks personalizados
├── config/              # Configuración
└── store/               # Estado global (Zustand)
```

## Solución de Problemas

### El avatar no habla
- Verifica que `OPENAI_API_KEY` esté configurada en `.env.local`
- Revisa la consola del navegador para errores

### La voz suena robótica
- Configura `ELEVENLABS_API_KEY` para voces más naturales
- Sin ElevenLabs se usa Web Speech API (voces del sistema)

### El micrófono no funciona
- Asegúrate de usar HTTPS o localhost
- Permite el acceso al micrófono cuando el navegador lo solicite
- Chrome y Edge tienen mejor soporte que Firefox

### El avatar 3D no carga
- Verifica que el archivo `public/models/avatar.glb` existe
- El archivo debe ser un GLB válido de Ready Player Me con morph targets
