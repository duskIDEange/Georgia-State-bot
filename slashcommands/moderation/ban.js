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
            BAN: Colors.Red,
            ERROR: Colors.Orange
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

const createBanEmbed = (user, reason, issuer) => {
    return new EmbedBuilder()
        .setColor(CONFIG.EMBED.COLORS.BAN)
        .setTitle(`User Banned by ${issuer.tag}`)
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
        .setName('ban')
        .setDescription('Bans a user from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for banning the user')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('silent')
                .setDescription('Whether to silently ban the user')
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

            // Check if user is bannable
            if (member && !member.bannable) {
                return interaction.reply({
                    content: 'I cannot ban this user. They may have higher permissions than me.',
                    ephemeral: true
                });
            }

            // Create ban embed
            const banEmbed = createBanEmbed(user, reason, interaction.user);

            // Execute ban
            await interaction.guild.members.ban(user, { reason });

            // Send log message
            const logChannel = interaction.guild.channels.cache.get(CONFIG.CHANNELS.LOGS);
            if (logChannel) {
                await logChannel.send({ embeds: [banEmbed] });
            }

            // Record infraction
            const infractions = await loadInfractions();
            if (!infractions[user.id]) {
                infractions[user.id] = [];
            }

            infractions[user.id].push({
                type: 'BAN',
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
                                .setColor(CONFIG.EMBED.COLORS.BAN)
                                .setTitle('You have been banned')
                                .setDescription(`You have been banned from ${interaction.guild.name}`)
                                .addFields([
                                    { name: 'Reason', value: reason },
                                    { name: 'Appeal', value: 'If you believe this was a mistake, you can appeal in our appeal server.' }
                                ])
                                .setTimestamp()
                        ]
                    });
                } catch (error) {
                    console.error('Failed to send DM to banned user:', error);
                }
            }

            // Reply to interaction
            await interaction.reply({
                content: `Successfully banned ${user.tag}${silent ? ' silently' : ''}.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error executing ban command:', error);
            await interaction.reply({
                content: 'There was an error executing the ban command.',
                ephemeral: true
            });
        }
    }
};
