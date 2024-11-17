const { REST, Routes, Collection } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuration
const CONFIG = {
    COMMAND_DIRECTORIES: [
        'commands',
        'slashcommands/command',
        'slashcommands/moderation',
        'slashcommands/erlc',
        'slashcommands/infraction-system'
    ],
    CREDENTIALS: {
        TOKEN: process.env.BOT_TOKEN,
        CLIENT_ID: process.env.CLIENT_ID,
        GUILD_ID: process.env.GUILD_ID
    }
};

// Utility function to validate command structure
const validateCommand = (command, filePath) => {
    if (command.data?.name && command.execute) {
        return { isValid: true, type: 'SLASH' };
    } else if (command.name && command.execute) {
        return { isValid: true, type: 'REGULAR' };
    }
    
    console.warn(`Invalid command at ${filePath}: Missing required properties`);
    return { isValid: false, type: null };
};

// Command loading function
const loadCommandsFromDirectory = async (client, directory) => {
    try {
        if (!fs.existsSync(directory)) {
            console.warn(`Directory does not exist: ${directory}`);
            return;
        }

        const files = await fs.readdir(directory, { withFileTypes: true });
        
        for (const file of files) {
            const fullPath = path.join(directory, file.name);
            
            if (file.isDirectory()) {
                await loadCommandsFromDirectory(client, fullPath);
                continue;
            }

            if (!file.name.endsWith('.js')) continue;

            try {
                const command = require(fullPath);
                const validation = validateCommand(command, fullPath);

                if (!validation.isValid) continue;

                if (validation.type === 'SLASH') {
                    client.slashCommands.set(command.data.name, command);
                    client.commandArray.push(command.data.toJSON());
                    console.log(`Loaded slash command: ${command.data.name}`);
                } else {
                    client.commands.set(command.name, command);
                    console.log(`Loaded regular command: ${command.name}`);
                }
            } catch (error) {
                console.error(`Error loading command from ${fullPath}:`, error);
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${directory}:`, error);
    }
};

// Command registration function
const registerCommands = async (client) => {
    if (!CONFIG.CREDENTIALS.TOKEN || !CONFIG.CREDENTIALS.CLIENT_ID || !CONFIG.CREDENTIALS.GUILD_ID) {
        throw new Error('Missing required environment variables');
    }

    const rest = new REST({ version: '10' }).setToken(CONFIG.CREDENTIALS.TOKEN);

    try {
        console.log('Started refreshing application (/) commands...');

        const response = await rest.put(
            Routes.applicationGuildCommands(
                CONFIG.CREDENTIALS.CLIENT_ID, 
                CONFIG.CREDENTIALS.GUILD_ID
            ),
            { body: client.commandArray }
        );

        console.log(`Successfully reloaded ${response.length} application (/) commands.`);
        return response;
    } catch (error) {
        console.error('Error registering commands:', error);
        throw error;
    }
};

// Main handler function
const initializeCommands = async (client) => {
    try {
        // Initialize collections if they don't exist
        if (!client.commands) client.commands = new Collection();
        if (!client.slashCommands) client.slashCommands = new Collection();
        client.commandArray = [];

        // Load commands from all directories
        for (const directory of CONFIG.COMMAND_DIRECTORIES) {
            const fullPath = path.join(__dirname, directory);
            await loadCommandsFromDirectory(client, fullPath);
        }

        // Register commands with Discord
        await registerCommands(client);

        console.log('Command initialization complete!');
    } catch (error) {
        console.error('Error initializing commands:', error);
        process.exit(1); // Exit if initialization fails
    }
};

module.exports = {
    initializeCommands,
    // Export individual functions for testing
    loadCommandsFromDirectory,
    registerCommands,
    validateCommand
};

