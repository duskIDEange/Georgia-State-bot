const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
    ROLES: {
        MODERATOR: '1244398079852012812',
        ADMIN: '1178444979153145866'
    },
    FILES: {
        INFRACTIONS: path.join(__dirname, '..', '..', 'data', 'infractions.json')
    },
    EMBED: {
        COLORS: {
            INFO: Colors.Blue,
            ERROR: Colors.Red
        }
    }
};

// Utility Functions
const loadInfractions = async () => {
    try {
        const data = await fs.readFile(CONFIG.FILES.INFRACTIONS, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        throw error;
    }
};

const formatInfractionType = (type) => {
    return {
        'WARN': '⚠️ Warning',
        'KICK': '👢 Kick',
        'BAN': '🔨 Ban',
        'TIMEOUT': '⏰ Timeout',
        'SOFTBAN': '🔄 Softban'
    }[type] || type;
};

const hasModPermission = (member) => {
    return member.roles.cache.has(CONFIG.ROLES.MODERATOR) || 
           member.roles.cache.has(CONFIG.ROLES.ADMIN);
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('viewmoderation')
        .setDescription('View moderation history of a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to check')
                .setRequired(true)),

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
            const infractions = await loadInfractions();
            const userInfractions = infractions[user.id] || [];

            if (userInfractions.length === 0) {
                return interaction.reply({ 
                    content: `${user.tag} has no moderation history.`,
                    ephemeral: true 
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('Moderation History')
                .setDescription(`Showing moderation history for ${user.tag}`)
                .setColor(CONFIG.EMBED.COLORS.INFO)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields([
                    { 
                        name: 'User Information',
                        value: [
                            `**Username:** ${user.tag}`,
                            `**ID:** ${user.id}`,
                            `**Total Infractions:** ${userInfractions.length}`
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setFooter({ text: 'Georgia State Roleplay • Moderation History' })
                .setTimestamp();

            // Add infraction fields
            userInfractions.forEach((inf, index) => {
                embed.addFields({
                    name: `${formatInfractionType(inf.type)} #${index + 1}`,
                    value: [
                        `**Moderator:** <@${inf.moderator}>`,
                        `**Reason:** ${inf.reason}`,
                        `**Date:** <t:${Math.floor(new Date(inf.date).getTime() / 1000)}:F>`,
                        inf.duration ? `**Duration:** ${inf.duration} minute(s)` : ''
                    ].filter(Boolean).join('\n'),
                    inline: false
                });
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Error executing viewmoderation command:', error);
            await interaction.reply({
                content: 'There was an error fetching the moderation history.',
                ephemeral: true
            });
        }
    }
};