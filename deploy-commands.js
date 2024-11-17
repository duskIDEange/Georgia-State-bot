const { REST, Routes } = require('discord.js');
const fs = require('fs').promises; // Use promise-based fs
const path = require('path');
require('dotenv').config();

// Configuration
const CONFIG = {
    TOKEN: process.env.BOT_TOKEN,
    CLIENT_ID: process.env.CLIENT_ID,
    GUILD_ID: process.env.GUILD_ID,
    COMMAND_DIRS: [
        'commands',
        'slashcommands',
        'command',
        'moderation',
        'erlc',
        'infraction-system'
    ]
};

// Utility function to validate command structure
const validateCommand = (command, filePath) => {
    if (!command.data?.name) {
        console.warn(`Warning: Command at ${filePath} is missing required "data.name" property.`);
        return false;
    }
    if (!command.execute) {
        console.warn(`Warning: Command at ${filePath} is missing required "execute" function.`);
        return false;
    }
    return true;
};

// Command loading function
const loadCommandsFromDirectory = async (directory, client) => {
    try {
        const files = await fs.readdir(directory, { withFileTypes: true });
        
        for (const file of files) {
            const fullPath = path.join(directory, file.name);
            
            if (file.isDirectory()) {
                // Recursively load commands from subdirectories
                await loadCommandsFromDirectory(fullPath, client);
                continue;
            }
            
            if (!file.name.endsWith('.js')) continue;

            try {
                const command = require(fullPath);
                
                if (validateCommand(command, fullPath)) {
                    client.slashCommands.set(command.data.name, command);
                    client.commandArray.push(command.data.toJSON());
                    console.log(`Loaded command: ${command.data.name}`);
                }
            } catch (error) {
                console.error(`Error loading command from ${fullPath}:`, error);
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${directory}:`, error);
    }
};

// Main command deployment function
const deployCommands = async (client) => {
    try {
        // Initialize command arrays
        client.commandArray = [];
        
        // Load all commands from configured directories
        for (const dir of CONFIG.COMMAND_DIRS) {
            const commandPath = path.join(__dirname, '..', dir);
            await loadCommandsFromDirectory(commandPath, client);
        }

        // Create REST instance
        const rest = new REST({ version: '10' }).setToken(CONFIG.TOKEN);

        console.log('Started refreshing application (/) commands...');

        // Deploy commands to Discord
        const data = await rest.put(
            Routes.applicationGuildCommands(CONFIG.CLIENT_ID, CONFIG.GUILD_ID),
            { body: client.commandArray }
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        
        return data;
    } catch (error) {
        console.error('Error deploying commands:', error);
        throw error; // Re-throw to handle in calling code
    }
};

// Event handler setup
const setupEventHandlers = async (client, basePath) => {
    try {
        const eventFiles = await fs.readdir(path.join(basePath, 'events'));
        
        for (const file of eventFiles) {
            if (!file.endsWith('.js')) continue;
            
            const event = require(path.join(basePath, 'events', file));
            
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
            
            console.log(`Loaded event: ${event.name}`);
        }
    } catch (error) {
        console.error('Error setting up event handlers:', error);
    }
};

// Export module functions
module.exports = {
    async initialize(client) {
        try {
            // Deploy commands
            await deployCommands(client);
            
            // Setup event handlers
            await setupEventHandlers(client, __dirname);
            
            console.log('Command and event initialization complete!');
        } catch (error) {
            console.error('Error during initialization:', error);
            process.exit(1); // Exit if initialization fails
        }
    },
    
    // Export individual functions for testing/specific use
    deployCommands,
    setupEventHandlers,
    loadCommandsFromDirectory
};
