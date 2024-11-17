const { EmbedBuilder, Colors } = require('discord.js');

// Configuration
const CONFIG = {
    PREFIX: '!id',
    COOLDOWN: 120000, // 2 minutes in milliseconds
    EMBED: {
        COLOR: Colors.DarkButNotBlack,
        FOOTER: 'Georgia Utilities'
    }
};

// Cooldown management
const cooldowns = new Map();

// Utility Functions
const formatTimeLeft = (ms) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
};

const createIdEmbed = (user) => {
    return new EmbedBuilder()
        .setTitle('Your Discord ID')
        .setDescription([
            '**Here is your Discord information:**',
            '',
            `**Username:** ${user.username}`,
            `**Display Name:** ${user.displayName}`,
            `**ID:** ${user.id}`,
            `**Account Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
            '',
            `**Profile Link:** [Click Here](https://discord.com/users/${user.id})`
        ].join('\n'))
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setColor(CONFIG.EMBED.COLOR)
        .setFooter({ text: CONFIG.EMBED.FOOTER })
        .setTimestamp();
};

const handleCooldown = (userId) => {
    const now = Date.now();
    const cooldownEnd = cooldowns.get(userId);

    if (cooldownEnd && now < cooldownEnd) {
        const timeLeft = cooldownEnd - now;
        return { onCooldown: true, timeLeft };
    }

    cooldowns.set(userId, now + CONFIG.COOLDOWN);
    setTimeout(() => cooldowns.delete(userId), CONFIG.COOLDOWN);
    return { onCooldown: false };
};

module.exports = {
    name: 'id',
    description: 'Displays your Discord ID and user information.',
    cooldown: CONFIG.COOLDOWN / 1000, // Convert to seconds for display

    async execute(message) {
        try {
            // Check if command is properly triggered
            if (!message.content.startsWith(CONFIG.PREFIX) || message.author.bot) return;

            // Check cooldown
            const { onCooldown, timeLeft } = handleCooldown(message.author.id);
            if (onCooldown) {
                const reply = await message.reply({
                    content: `Please wait ${formatTimeLeft(timeLeft)} before using this command again.`,
                    ephemeral: true
                });

                // Delete cooldown message after 3 seconds
                setTimeout(() => {
                    reply.delete().catch(error => {
                        console.error('Error deleting cooldown message:', error);
                    });
                }, 3000);

                return;
            }

            // Create and send embed
            const embed = createIdEmbed(message.author);
            
            const response = await message.reply({ 
                embeds: [embed],
                allowedMentions: { repliedUser: false } // Don't ping the user
            });

            // Add reaction to show command success
            await response.react('✅').catch(() => null);

        } catch (error) {
            console.error('Error executing id command:', error);
            
            // Send error message to user
            await message.reply({ 
                content: 'There was an error executing this command. Please try again later.',
                ephemeral: true 
            }).catch(() => null);
        }
    }
};
