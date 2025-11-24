# Integración del SMP con Mira Bot

## 📋 Descripción

Este documento describe cómo está integrado el sistema de SMP (Survival Multiplayer) con el bot de Discord "Mira".

## 🗂️ Estructura

```
src/
├── commands/smp/
│   ├── whitelist/
│   │   └── slash.js          # Comando /smp whitelist
│   └── users/
│       └── slash.js          # Comando /users (placeholder)
├── database/
│   └── smpWhitelist.js       # Operaciones de base de datos del whitelist
└── utils/
    └── smpHelper.js          # Helper para comunicarse con servidor Minecraft
```

## 🎮 Comandos Disponibles

### `/smp whitelist`
Gestiona el whitelist del SMP vinculando cuentas de Discord con nombres de Minecraft.

**Subacciones:**
- `add <usuario> <nombre_minecraft>` - Agrega un usuario al whitelist
- `remove <usuario>` - Remueve un usuario del whitelist
- `list` - Muestra todos los usuarios en el whitelist
- `check <usuario>` - Verifica si un usuario está en el whitelist

**Ejemplo:**
```
/smp whitelist action:add user:@messlyyy minecraft_name:messlyyy
```

### `/users`
Muestra los jugadores conectados al servidor de Minecraft.

**Nota:** Actualmente usa datos placeholder. Requiere plugin del servidor.

## 🗄️ Base de Datos

### Tabla: `smp_whitelist`

```sql
CREATE TABLE smp_whitelist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT NOT NULL UNIQUE,         -- ID de Discord del usuario
    minecraft_name TEXT NOT NULL UNIQUE,     -- Nombre de Minecraft
    discord_username TEXT NOT NULL,          -- Username de Discord (para referencia)
    added_by TEXT,                           -- ID de Discord de quién lo agregó
    created_at INTEGER NOT NULL,             -- Timestamp de creación
    updated_at INTEGER NOT NULL              -- Timestamp de actualización
);
```

**Índices:**
- `idx_smp_whitelist_discord` - Búsqueda rápida por Discord ID
- `idx_smp_whitelist_minecraft` - Búsqueda rápida por nombre de Minecraft

## 🔌 Integración con Servidor Minecraft

### Variables de Entorno Requeridas

En tu archivo `.env`:

```env
# Servidor Minecraft (PLACEHOLDER - Configurar con valores reales)
MINECRAFT_API_URL=http://localhost:8080
MINECRAFT_API_KEY=your-api-key-here
```

### Endpoints Esperados (Plugin)

El servidor Minecraft debe exponer los siguientes endpoints:

```
GET /api/players/online
    Headers: Authorization: Bearer {MINECRAFT_API_KEY}
    Response: { "players": [{ "name": "player1", "uuid": "..." }] }

GET /api/server/info
    Headers: Authorization: Bearer {MINECRAFT_API_KEY}
    Response: { "max_players": 20, "motd": "...", ... }

POST /api/whitelist/add
    Headers: Authorization: Bearer {MINECRAFT_API_KEY}
    Body: { "player_name": "string", "uuid": "string?" }
    Response: { "success": true, "message": "..." }

POST /api/whitelist/remove
    Headers: Authorization: Bearer {MINECRAFT_API_KEY}
    Body: { "player_name": "string" }
    Response: { "success": true, "message": "..." }

GET /api/whitelist
    Headers: Authorization: Bearer {MINECRAFT_API_KEY}
    Response: { "players": [{ "name": "player1", "uuid": "..." }] }
```

## 📝 Módulos Creados

### `src/database/smpWhitelist.js`

Proporciona funciones para manipular el whitelist:

```javascript
const smpWhitelist = require('./src/database/smpWhitelist');

// Agregar usuario
smpWhitelist.add(discordId, minecraftName, discordUsername, addedBy);

// Obtener por Discord ID
smpWhitelist.getByDiscordId(discordId);

// Obtener por nombre de Minecraft
smpWhitelist.getByMinecraftName(minecraftName);

// Listar todos
smpWhitelist.getAll();

// Verificar existencia
smpWhitelist.exists(discordId);

// Remover
smpWhitelist.remove(discordId);

// Actualizar nombre de Minecraft
smpWhitelist.updateMinecraftName(discordId, newName);

// Contar
smpWhitelist.count();
```

### `src/utils/smpHelper.js`

Helper para comunicarse con el servidor Minecraft:

```javascript
const smpHelper = require('./src/utils/smpHelper');

// Obtener jugadores conectados
const players = await smpHelper.getConnectedPlayers();

// Obtener info del servidor
const info = await smpHelper.getServerInfo();

// Agregar a whitelist (servidor)
await smpHelper.addToWhitelist('playerName', 'uuid?');

// Remover de whitelist (servidor)
await smpHelper.removeFromWhitelist('playerName');

// Obtener whitelist del servidor
const whitelist = await smpHelper.getWhitelist();
```

## 🔄 Flujo de Uso

1. **Usuario ejecuta** `/smp whitelist action:add user:@nombre minecraft_name:miNombre`
2. **Bot valida** que el usuario no esté ya en el whitelist de Discord
3. **Bot almacena** la relación en la base de datos local (SQLite)
4. **Bot puede sincronizar** con el servidor Minecraft usando `smpHelper`
5. **Otros comandos** pueden consultar la BD para información del whitelist

## 🚀 Próximos Pasos

1. **Crear plugin Minecraft** que exponga los endpoints mencionados
2. **Configurar API_KEY** y variables de entorno
3. **Actualizar `/users`** para que muestre jugadores reales
4. **Agregar sincronización automática** entre Discord y Minecraft
5. **Crear comando de logs** para ver historial de conexiones

## 📌 Notas

- La estructura sigue el patrón existente del bot (slash commands)
- No rompe la estructura actual del bot
- Los comandos están en una categoría `smp` separada y limpia
- Usa los mismos embeds y utilidades que el resto del bot
- Está listo para ser expandido sin cambios arquitectónicos
