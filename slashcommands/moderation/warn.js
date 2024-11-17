const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, Colors } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
    CHANNELS: {
        LOGS: '1266070136956391484',
        ALERTS: '1307542694414778408'
    },
    ROLES: {
        MODERATOR: '1244398079852012812',
        ADMIN: '1178444979153145866'
    },
    FILES: {
        INFRACTIONS: path.join(__dirname, '..', '..', 'data', 'infractions.json')
    },
    EMBED: {
        COLORS: {
            WARN: Colors.Yellow,
            ERROR: Colors.Red
        },
        THUMBNAIL: 'https://cdn.discordapp.com/attachments/1245199287210479768/1263188390149361715/image_21.png'
    }
};

// Utility Functions
const loadInfractions = async () => {
    try {
        const data = await fs.readFile(CONFIG.FILES.INFRACTIONS, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(CONFIG.FILES.INFRACTIONS, JSON.stringify({}));
            return {};
        }
        throw error;
    }
};

const saveInfractions = async (infractions) => {
    try {
        const dirPath = path.dirname(CONFIG.FILES.INFRACTIONS);
        await fs.mkdir(dirPath, { recursive: true });
        await fs.writeFile(CONFIG.FILES.INFRACTIONS, JSON.stringify(infractions, null, 2));
    } catch (error) {
        console.error('Error saving infractions:', error);
        throw error;
    }
};

const createWarnEmbed = (user, reason, issuer) => {
    return new EmbedBuilder()
        .setColor(CONFIG.EMBED.COLORS.WARN)
        .setTitle(`User Warned by ${issuer.tag}`)
        .setThumbnail(CONFIG.EMBED.THUMBNAIL)
        .addFields([
            { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
            { name: 'Moderator', value: issuer.tag, inline: true },
            { name: 'Reason', value: reason, inline: false },
            { name: 'Date', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
        ])
        .setFooter({ text: 'Georgia State Roleplay • Moderation' })
        .setTimestamp();
};

// Add permission check function
const hasModPermission = (member) => {
    return member.roles.cache.has(CONFIG.ROLES.MODERATOR) || 
           member.roles.cache.has(CONFIG.ROLES.ADMIN);
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warns a user in the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for warning the user')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('silent')
                .setDescription('Whether to silently warn the user')
                .setRequired(false)),

    async execute(interaction) {
        try {
            // Check permissions
            if (!hasModPermission(interaction.member)) {
                return interaction.reply({ 
                    content: 'You need Moderator permissions to use this command.',
                    ephemeral: true 
                });
            }

            const user = interaction.options.getUser('target');
            const reason = interaction.options.getString('reason');
            const silent = interaction.options.getBoolean('silent') ?? false;
            const member = await interaction.guild.members.fetch(user.id);

            // Create warn embed
            const warnEmbed = createWarnEmbed(user, reason, interaction.user);

            // Send log message
            const logChannel = interaction.guild.channels.cache.get(CONFIG.CHANNELS.LOGS);
            if (logChannel) {
                await logChannel.send({ embeds: [warnEmbed] });
            }

            // Record infraction
            const infractions = await loadInfractions();
            if (!infractions[user.id]) {
                infractions[user.id] = [];
            }

            infractions[user.id].push({
                type: 'WARN',
                reason,
                moderator: interaction.user.id,
                date: new Date().toISOString()
            });

            await saveInfractions(infractions);

            // Send DM to user if not silent
            if (!silent) {
                try {
                    await user.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(CONFIG.EMBED.COLORS.WARN)
                                .setTitle('You have been warned')
                                .setDescription(`You have been warned in ${interaction.guild.name}`)
                                .addFields([
                                    { name: 'Reason', value: reason },
                                    { name: 'Note', value: 'Please make sure to follow our server rules to avoid further warnings.' }
                                ])
                                .setTimestamp()
                        ]
                    });
                } catch (error) {
                    console.error('Failed to send DM to warned user:', error);
                }
            }

            // Reply to interaction
            await interaction.reply({
                content: `Successfully warned ${user.tag}${silent ? ' silently' : ''}.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error executing warn command:', error);
            await interaction.reply({
                content: 'There was an error executing the warn command.',
                ephemeral: true
            });
        }
    }
};
