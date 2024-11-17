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
            KICK: Colors.Orange,
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

const createKickEmbed = (user, reason, issuer) => {
    return new EmbedBuilder()
        .setColor(CONFIG.EMBED.COLORS.KICK)
        .setTitle(`User Kicked by ${issuer.tag}`)
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
        .setName('kick')
        .setDescription('Kicks a user from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for kicking the user')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('silent')
                .setDescription('Whether to silently kick the user')
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

            // Check if user is kickable
            if (member && !member.kickable) {
                return interaction.reply({
                    content: 'I cannot kick this user. They may have higher permissions than me.',
                    ephemeral: true
                });
            }

            // Create kick embed
            const kickEmbed = createKickEmbed(user, reason, interaction.user);

            // Execute kick
            await member.kick(reason);

            // Send log message
            const logChannel = interaction.guild.channels.cache.get(CONFIG.CHANNELS.LOGS);
            if (logChannel) {
                await logChannel.send({ embeds: [kickEmbed] });
            }

            // Record infraction
            const infractions = await loadInfractions();
            if (!infractions[user.id]) {
                infractions[user.id] = [];
            }

            infractions[user.id].push({
                type: 'KICK',
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
                                .setColor(CONFIG.EMBED.COLORS.KICK)
                                .setTitle('You have been kicked')
                                .setDescription(`You have been kicked from ${interaction.guild.name}`)
                                .addFields([
                                    { name: 'Reason', value: reason },
                                    { name: 'Appeal', value: 'If you believe this was a mistake, you can appeal in our appeal server.' }
                                ])
                                .setTimestamp()
                        ]
                    });
                } catch (error) {
                    console.error('Failed to send DM to kicked user:', error);
                }
            }

            // Reply to interaction
            await interaction.reply({
                content: `Successfully kicked ${user.tag}${silent ? ' silently' : ''}.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error executing kick command:', error);
            await interaction.reply({
                content: 'There was an error executing the kick command.',
                ephemeral: true
            });
        }
    }
};
