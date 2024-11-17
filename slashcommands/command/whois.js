const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField, Colors } = require('discord.js');

// Configuration
const CONFIG = {
    ROLE_DISPLAY_LIMIT: 5,
    KEY_PERMISSIONS: [
        'Administrator',
        'ManageGuild',
        'ModerateMembers',
        'BanMembers',
        'KickMembers',
        'ManageChannels',
        'ManageRoles'
    ],
    EMBED_COLORS: {
        ADMIN: Colors.Red,
        MOD: Colors.Blue,
        DEFAULT: Colors.Green
    }
};

// Utility Functions
const formatPermissions = (permissions) => {
    return permissions
        .filter(perm => CONFIG.KEY_PERMISSIONS.includes(perm))
        .map(perm => `\`${perm.replace(/([A-Z])/g, ' $1').trim()}\``)
        .join(', ') || 'None';
};

const formatRoles = (roles, limit = CONFIG.ROLE_DISPLAY_LIMIT) => {
    if (roles.length === 0) return 'None';
    if (roles.length <= limit) return roles.join(', ');
    return `${roles.slice(0, limit).join(', ')}, and ${roles.length - limit} more roles`;
};

const getHighestRole = (member) => {
    return member.roles.highest.id === member.guild.id ? 'None' : member.roles.highest.toString();
};

const getUserStatus = (presence) => {
    if (!presence) return 'Offline';
    return {
        online: '🟢 Online',
        idle: '🟡 Idle',
        dnd: '🔴 Do Not Disturb',
        offline: '⚫ Offline'
    }[presence.status] || 'Unknown';
};

const getActivity = (presence) => {
    if (!presence || !presence.activities.length) return 'None';
    const activity = presence.activities[0];
    return `${activity.type.charAt(0) + activity.type.slice(1).toLowerCase()} ${activity.name}`;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whois')
        .setDescription('Displays detailed information about a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to get information about')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const user = interaction.options.getUser('target');
            const member = await interaction.guild.members.fetch(user.id);
            
            // Get user information
            const joinPosition = (await interaction.guild.members.fetch())
                .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
                .map(m => m.id)
                .indexOf(member.id) + 1;

            // Get roles excluding @everyone
            const roles = member.roles.cache
                .filter(role => role.id !== interaction.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(role => role.toString());

            // Determine embed color based on permissions
            const embedColor = member.permissions.has(PermissionsBitField.Flags.Administrator) 
                ? CONFIG.EMBED_COLORS.ADMIN 
                : member.permissions.has(PermissionsBitField.Flags.ModerateMembers) 
                    ? CONFIG.EMBED_COLORS.MOD 
                    : CONFIG.EMBED_COLORS.DEFAULT;

            const embed = new EmbedBuilder()
                .setTitle(`${user.tag}'s Information`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setColor(embedColor)
                .addFields([
                    { 
                        name: '👤 User Information',
                        value: [
                            `**Username:** ${user.username}`,
                            `**Display Name:** ${member.displayName}`,
                            `**ID:** ${user.id}`,
                            `**Status:** ${getUserStatus(member.presence)}`,
                            `**Activity:** ${getActivity(member.presence)}`,
                            `**Account Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
                            `**Profile:** [Link](https://discord.com/users/${user.id})`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '📋 Server Information',
                        value: [
                            `**Joined Server:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
                            `**Join Position:** ${joinPosition}`,
                            `**Highest Role:** ${getHighestRole(member)}`,
                            `**Key Permissions:** ${formatPermissions(member.permissions.toArray())}`,
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: `📝 Roles [${roles.length}]`,
                        value: formatRoles(roles),
                        inline: false
                    }
                ])
                .setFooter({ text: `Requested by ${interaction.user.tag}` })
                .setTimestamp();

            if (member.premiumSince) {
                embed.addFields({
                    name: '🌟 Boosting Since',
                    value: `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>`,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in whois command:', error);
            
            if (error.code === 10007) { // Unknown Member error
                await interaction.editReply({ 
                    content: 'This user is not a member of this server.',
                    ephemeral: true 
                });
            } else {
                await interaction.editReply({ 
                    content: 'An error occurred while fetching user information.',
                    ephemeral: true 
                });
            }
        }
    }
};