const { 
    SlashCommandBuilder,
    PermissionFlagsBits 
} = require('@discordjs/builders');
const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    Colors
} = require('discord.js');
const fetch = require('node-fetch');

// Configuration object
const CONFIG = {
    ROLES: {
        REQUESTER: '1173794306511867905',
        STAFF: '1173795597703200799'
    },
    COOLDOWN: {
        DURATION: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
    },
    ROBLOX_API: {
        USERS_ENDPOINT: 'https://users.roblox.com/v1/usernames/users'
    },
    EMBEDS: {
        THUMBNAIL: 'https://cdn.discordapp.com/icons/1145425767283556532/b947aca545a7b23d0079c20b1fd01c29.png?size=512'
    },
    COLLECTOR: {
        TIMEOUT: 3600000 // 1 hour in milliseconds
    }
};

// Cooldown management
const cooldowns = new Map();

// Utility functions
const formatTimeLeft = (ms) => {
    const minutes = Math.ceil(ms / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
};

const handleError = async (interaction, error, message) => {
    console.error(`Ride-Along Error: ${message}`, error);
    const response = {
        content: `Error: ${message}. Please try again or contact support.`,
        ephemeral: true
    };
    
    if (interaction.deferred) {
        await interaction.followUp(response);
    } else {
        await interaction.reply(response);
    }
};

// Roblox API functions
async function fetchRobloxUserInfo(username) {
    try {
        const response = await fetch(CONFIG.ROBLOX_API.USERS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usernames: [username],
                excludeBannedUsers: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data?.[0] || null;
    } catch (error) {
        console.error(`Error fetching Roblox user info for ${username}:`, error);
        return null;
    }
}

// Create embed function
const createRequestEmbed = (user, robloxUsername, chosenTime) => {
    return new EmbedBuilder()
        .setColor(Colors.DarkButNotBlack)
        .setTitle(`${user.username}'s Ride-Along Request`)
        .setThumbnail(CONFIG.EMBEDS.THUMBNAIL)
        .setDescription(`
            <:info:1175203730392633475> **Roblox Username**: ${robloxUsername} <:WhiteDot:1257871656110784543>
            <:people:1247726625148239954> **Time Available**: ${chosenTime}
        `)
        .setFooter({ text: "Georgia Utilities © " })
        .setTimestamp();
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ride-along')
        .setDescription('Create a ride-along request.')
        .addStringOption(option =>
            option.setName('roblox_username')
                .setDescription('Enter your Roblox username')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('time_available')
                .setDescription('Enter the time for your request (e.g., 14:30 or 2:30 PM)')
                .setRequired(true)),

    async execute(interaction) {
        try {
            // Permission check
            if (!interaction.member.roles.cache.has(CONFIG.ROLES.REQUESTER)) {
                return interaction.reply({
                    content: 'You do not have permission to use this command.',
                    ephemeral: true
                });
            }

            // Cooldown check
            const now = Date.now();
            const cooldownExpiration = cooldowns.get(interaction.user.id);
            if (cooldownExpiration && now < cooldownExpiration) {
                const timeLeft = formatTimeLeft(cooldownExpiration - now);
                return interaction.reply({
                    content: `Please wait ${timeLeft} before making another request.`,
                    ephemeral: true
                });
            }

            // Get command options
            const robloxUsername = interaction.options.getString('roblox_username');
            const chosenTime = interaction.options.getString('time_available');

            // Validate Roblox username
            const robloxUser = await fetchRobloxUserInfo(robloxUsername);
            if (!robloxUser) {
                return interaction.reply({
                    content: `Could not find Roblox user: ${robloxUsername}. Please check the username and try again.`,
                    ephemeral: true
                });
            }

            // Create embed and buttons
            const embed = createRequestEmbed(interaction.user, robloxUsername, chosenTime);
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('claim_button')
                        .setLabel('Claim Request')
                        .setStyle(ButtonStyle.Primary)
                );

            // Send the request
            const message = await interaction.reply({
                content: `<@&${CONFIG.ROLES.STAFF}>`,
                embeds: [embed],
                components: [actionRow],
                allowedMentions: { roles: [CONFIG.ROLES.STAFF] },
                fetchReply: true
            });

            // Set up button collector
            const collector = message.createMessageComponentCollector({
                filter: i => i.customId === 'claim_button',
                time: CONFIG.COLLECTOR.TIMEOUT
            });

            collector.on('collect', async (i) => {
                // Validate claimer
                if (i.user.id === interaction.user.id) {
                    return i.reply({
                        content: "You cannot accept your own ride-along request.",
                        ephemeral: true
                    });
                }

                if (!i.member.roles.cache.has(CONFIG.ROLES.STAFF)) {
                    return i.reply({
                        content: "You do not have permission to claim this request.",
                        ephemeral: true
                    });
                }

                try {
                    // Update embed
                    embed.setDescription(`
                        <:info:1175203730392633475> **Roblox Username**: ${robloxUsername} <:WhiteDot:1257871656110784543>
                        <:people:1247726625148239954> **Time Available**: ${chosenTime}
                        \n**Claimed by**: ${i.user.username}
                    `);
                    embed.setThumbnail(i.user.displayAvatarURL({ dynamic: true }));

                    // Update message
                    await i.update({ embeds: [embed], components: [] });

                    // Send DMs to both parties
                    await Promise.all([
                        i.user.send({
                            embeds: [new EmbedBuilder()
                                .setTitle("<:Management:1204253973402615888> Ride-Along Request Details")
                                .setColor(Colors.DarkButNotBlack)
                                .addFields([
                                    { name: 'Discord Username', value: `${interaction.user.tag}`, inline: false },
                                    { name: 'Discord ID', value: interaction.user.id, inline: false },
                                    { name: 'Roblox Username', value: robloxUsername, inline: false },
                                    { name: 'Roblox ID', value: robloxUser.id.toString(), inline: false }
                                ])
                                .setTimestamp()
                            ]
                        }),
                        interaction.user.send({
                            embeds: [new EmbedBuilder()
                                .setTitle("Ride-Along Request Accepted")
                                .setColor(Colors.DarkButNotBlack)
                                .addFields([
                                    { name: 'Accepted By', value: i.user.tag, inline: true }
                                ])
                                .setTimestamp()
                            ]
                        })
                    ]).catch(error => console.error('Error sending DMs:', error));

                } catch (error) {
                    await handleError(i, error, 'Failed to process request claim');
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    embed.setDescription('This ride-along request has expired.');
                    await message.edit({ embeds: [embed], components: [] })
                        .catch(error => console.error('Error updating expired message:', error));
                }
            });

            // Set cooldown
            cooldowns.set(interaction.user.id, now + CONFIG.COOLDOWN.DURATION);

        } catch (error) {
            await handleError(interaction, error, 'An unexpected error occurred');
        }
    }
};
