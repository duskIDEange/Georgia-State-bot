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
            TIMEOUT: Colors.Yellow,
            ERROR: Colors.Red
        },
        THUMBNAIL: 'https://cdn.discordapp.com/attachments/1245199287210479768/1263188390149361715/image_21.png'
    },
    MAX_TIMEOUT: 28 * 24 * 60 // 28 days in minutes
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

const createTimeoutEmbed = (user, duration, reason, issuer) => {
    return new EmbedBuilder()
        .setColor(CONFIG.EMBED.COLORS.TIMEOUT)
        .setTitle(`User Timed Out by ${issuer.tag}`)
        .setThumbnail(CONFIG.EMBED.THUMBNAIL)
        .addFields([
            { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
            { name: 'Moderator', value: issuer.tag, inline: true },
            { name: 'Duration', value: `${duration} minute(s)`, inline: true },
            { name: 'Reason', value: reason, inline: false },
            { name: 'Expires', value: `<t:${Math.floor(Date.now() / 1000 + duration * 60)}:R>`, inline: false }
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
        .setName('timeout')
        .setDescription('Times out a user for a specified duration')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration of the timeout in minutes')
                .setMinValue(1)
                .setMaxValue(CONFIG.MAX_TIMEOUT)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for timing out the user')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('silent')
                .setDescription('Whether to silently timeout the user')
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
            const duration = interaction.options.getInteger('duration');
            const reason = interaction.options.getString('reason');
            const silent = interaction.options.getBoolean('silent') ?? false;
            const member = await interaction.guild.members.fetch(user.id);

            // Check if user is moderatable
            if (member && !member.moderatable) {
                return interaction.reply({
                    content: 'I cannot timeout this user. They may have higher permissions than me.',
                    ephemeral: true
                });
            }

            // Create timeout embed
            const timeoutEmbed = createTimeoutEmbed(user, duration, reason, interaction.user);

            // Execute timeout
            await member.timeout(duration * 60 * 1000, reason);

            // Send log message
            const logChannel = interaction.guild.channels.cache.get(CONFIG.CHANNELS.LOGS);
            if (logChannel) {
                await logChannel.send({ embeds: [timeoutEmbed] });
            }

            // Record infraction
            const infractions = await loadInfractions();
            if (!infractions[user.id]) {
                infractions[user.id] = [];
            }

            infractions[user.id].push({
                type: 'TIMEOUT',
                duration,
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
                                .setColor(CONFIG.EMBED.COLORS.TIMEOUT)
                                .setTitle('You have been timed out')
                                .setDescription(`You have been timed out in ${interaction.guild.name}`)
                                .addFields([
                                    { name: 'Duration', value: `${duration} minute(s)` },
                                    { name: 'Reason', value: reason },
                                    { name: 'Expires', value: `<t:${Math.floor(Date.now() / 1000 + duration * 60)}:R>` }
                                ])
                                .setTimestamp()
                        ]
                    });
                } catch (error) {
                    console.error('Failed to send DM to timed out user:', error);
                }
            }

            // Reply to interaction
            await interaction.reply({
                content: `Successfully timed out ${user.tag} for ${duration} minute(s)${silent ? ' silently' : ''}.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error executing timeout command:', error);
            await interaction.reply({
                content: 'There was an error executing the timeout command.',
                ephemeral: true
            });
        }
    }
};
