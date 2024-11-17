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
            SOFTBAN: Colors.Yellow,
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

const createSoftbanEmbed = (user, reason, days, issuer) => {
    return new EmbedBuilder()
        .setColor(CONFIG.EMBED.COLORS.SOFTBAN)
        .setTitle(`User Softbanned by ${issuer.tag}`)
        .setThumbnail(CONFIG.EMBED.THUMBNAIL)
        .addFields([
            { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
            { name: 'Moderator', value: issuer.tag, inline: true },
            { name: 'Days of Messages Deleted', value: `${days} days`, inline: true },
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
        .setName('softban')
        .setDescription('Softbans a user (bans and immediately unbans to delete messages)')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to softban')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Number of days of messages to delete (1-7)')
                .setMinValue(1)
                .setMaxValue(7)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the softban')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('silent')
                .setDescription('Whether to silently softban the user')
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
            const days = interaction.options.getInteger('days');
            const reason = interaction.options.getString('reason');
            const silent = interaction.options.getBoolean('silent') ?? false;
            const member = await interaction.guild.members.fetch(user.id);

            // Check if user is bannable
            if (member && !member.bannable) {
                return interaction.reply({
                    content: 'I cannot softban this user. They may have higher permissions than me.',
                    ephemeral: true
                });
            }

            // Create softban embed
            const softbanEmbed = createSoftbanEmbed(user, reason, days, interaction.user);

            // Execute softban
            await member.ban({ deleteMessageDays: days, reason: `Softban: ${reason}` });
            await interaction.guild.members.unban(user.id, 'Softban complete');

            // Send log message
            const logChannel = interaction.guild.channels.cache.get(CONFIG.CHANNELS.LOGS);
            if (logChannel) {
                await logChannel.send({ embeds: [softbanEmbed] });
            }

            // Record infraction
            const infractions = await loadInfractions();
            if (!infractions[user.id]) {
                infractions[user.id] = [];
            }

            infractions[user.id].push({
                type: 'SOFTBAN',
                reason,
                days,
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
                                .setColor(CONFIG.EMBED.COLORS.SOFTBAN)
                                .setTitle('You have been softbanned')
                                .setDescription(`You have been softbanned from ${interaction.guild.name}`)
                                .addFields([
                                    { name: 'Reason', value: reason },
                                    { name: 'Message Deletion', value: `Last ${days} days of messages` },
                                    { name: 'Appeal', value: 'You can rejoin the server immediately, but your recent messages have been removed.' }
                                ])
                                .setTimestamp()
                        ]
                    });
                } catch (error) {
                    console.error('Failed to send DM to softbanned user:', error);
                }
            }

            // Reply to interaction
            await interaction.reply({
                content: `Successfully softbanned ${user.tag}${silent ? ' silently' : ''}.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error executing softban command:', error);
            await interaction.reply({
                content: 'There was an error executing the softban command.',
                ephemeral: true
            });
        }
    }
};
