//Cliente Discord

const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();  // Cargar variables del archivo .env

// Configuración del cliente de Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// Iniciar sesión con el token del bot
client.login(process.env.DISCORD_BOT_TOKEN);

// Cierra la conexión cuando finalicen las pruebas
afterAll(async () => {
    if (client && client.destroy) {
        await client.destroy();  // Cierra la conexión de forma segura
    }
});

// Manejo de evento
client.once('ready', () => {
    console.log('El bot está listo y conectado a Discord');
});

// Crear un canal de voz para el juego
client.createGameChannel = async (gameId, gameName) => {
    try {
        // Asegurar de que el nombre del juego sea válido
        const channelName = gameName && gameName.length > 0 ? gameName : gameId;

        // Sanear el nombre del canal 
        const sanitizedChannelName = channelName.replace(/[^a-zA-Z0-9-_]/g, '-').substring(0, 100); // Límite a 100 caracteres

        const guild = await client.guilds.fetch(process.env.GUILD_ID); 

        // Verificar que el guild tenga permisos de gestión de canales
        if (!guild) {
            throw new Error('No se pudo encontrar el servidor de Discord');
        }

        const channel = await guild.channels.create({
            name: sanitizedChannelName,
            type: 2,
            // topic: "topic", ES OPCIONAL Y COMO DABA ERROR LO HE COMENTADO
        });

        return channel;
    } catch (error) {
        console.error('Error al crear el canal de voz en Discord:', error.message);
        throw error;
    }
};

// Crear un enlace de invitación único para un jugador
client.createGameInvite = async (channelId) => {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || channel.type !== 2) {
            throw new Error('No se encontró el canal de voz');
        }

        // Crear un enlace de invitación único con duración de 24 horas y un solo uso
        const invite = await channel.createInvite({
            maxAge: 86400,  // El enlace expirará en 24 horas (86400 segundos)
            maxUses: 1,     // El enlace solo puede ser usado por 1 persona
            unique: true,   // Hace que el enlace sea único cada vez que se crea
        });

        console.log('Enlace de invitación: ', invite.url)

        return invite.url;  // Devolver el enlace de invitación
    } catch (error) {
        console.error('Error al crear el enlace de invitación en Discord:', error.message);
        throw error;
    }
};

module.exports = client;
