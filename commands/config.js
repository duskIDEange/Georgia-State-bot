const { 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    EmbedBuilder,
    Colors
} = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
    ROLES: {
        ADMIN: '1307546484438466651'
    },
    EMBED: {
        COLOR: Colors.Blue,
        FOOTER: 'Georgia State Roleplay • Configuration'
    },
    CONFIG_PATH: path.join(__dirname, '..', 'config.json')
};

// Utility Functions
const loadConfig = async () => {
    try {
        const data = await fs.readFile(CONFIG.CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading config:', error);
        throw error;
    }
};

const saveConfig = async (config) => {
    try {
        await fs.writeFile(CONFIG.CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error saving config:', error);
        throw error;
    }
};

module.exports = {
    name: 'config',
    description: 'Manage bot configuration',
    async execute(message, args) {
        // Check permissions
        if (!message.member.roles.cache.has(CONFIG.ROLES.ADMIN)) {
            return message.reply('You do not have permission to use this command.');
        }

        const embed = new EmbedBuilder()
            .setColor(CONFIG.EMBED.COLOR)
            .setTitle('Configuration Panel')
            .setDescription([
                '**Available Configuration Options:**',
                '',
                '`!config prefix <new_prefix>` - Change command prefix',
                '`!config welcome <message>` - Set welcome message',
                '`!config channel welcome <channel_id>` - Set welcome channel',
                '',
                'Current Configuration:',
                'Use these commands to modify the bot settings.'
            ].join('\n'))
            .setFooter({ text: CONFIG.EMBED.FOOTER })
            .setTimestamp();

        if (!args.length) {
            // Show configuration help
            return message.reply({ embeds: [embed] });
        }

        try {
            const config = await loadConfig();
            const [option, ...values] = args;

            switch (option.toLowerCase()) {
                case 'prefix':
                    if (!values.length) return message.reply('Please provide a new prefix.');
                    config.prefix = values[0];
                    await saveConfig(config);
                    message.reply(`Prefix updated to: ${values[0]}`);
                    break;

                case 'welcome':
                    if (!values.length) return message.reply('Please provide a welcome message.');
                    config.welcome.message = values.join(' ');
                    await saveConfig(config);
                    message.reply('Welcome message updated!');
                    break;

                case 'channel':
                    if (values[0] === 'welcome') {
                        if (!values[1]) return message.reply('Please provide a channel ID.');
                        config.welcome.channelId = values[1];
                        await saveConfig(config);
                        message.reply('Welcome channel updated!');
                    } else {
                        message.reply('Invalid channel type. Available types: welcome');
                    }
                    break;

                default:
                    message.reply('Invalid configuration option. Use `!config` to see available options.');
            }
        } catch (error) {
            console.error('Error in config command:', error);
            message.reply('An error occurred while updating the configuration.');
        }
    }
};