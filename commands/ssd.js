const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ssd',
    description: 'Announce that the in-game server has shut down.',
    async execute(message, args) {
        const allowedRoleID = '1265100975052554361';

        const isAdmin = message.member.permissions.has('ADMINISTRATOR');
        const isAllowedUser = message.member.roles.cache.has(allowedRoleID);

        if (isAdmin || isAllowedUser) {
            try {
                const shutdownTime = Math.floor(Date.now() / 1000);
                const avatarURL = message.author.displayAvatarURL(); // Assuming you want the user's avatar URL

                const embed = new EmbedBuilder()
                    .setColor('2d2d31')
                    .setTitle('Shutdown!')
                    .setDescription('The in-game server has now shut down! During this period, do not join the in-game server or moderation actions may be taken against you! Another session will occur shortly, thank you!')
                    .setFooter({
                        text: `Requested by ${message.member.displayName} `,
                        iconURL: avatarURL
                    })
                    .setImage('https://cdn.discordapp.com/attachments/1244697144754176201/1293754249980940419/image.png?ex=67088609&is=67073489&hm=e730bc8f7342474920798e0e0eac0a018124b7e455052e8b8a5c48a88070fee9&');

                const msg = await message.channel.send({ embeds: [embed] });

                const interval = setInterval(() => {
                    const currentUnixTime = Math.floor(Date.now() / 1000);
                    const relativeTime = `<t:${shutdownTime}:R>`;
                    embed.setDescription(`The in-game server has now shut down! During this period, do not join the in-game server or moderation actions may be taken against you! Another session will occur shortly, thank you!\n\nShutdown: ${relativeTime}`);
                    msg.edit({ embeds: [embed] });
                }, 1000);

                setTimeout(() => clearInterval(interval), 60000);

                await message.delete().catch(err => {
                    console.error('Error deleting command message:', err);
                });
            } catch (error) {
                console.error('Error sending shutdown message:', error);
                message.reply('There was an error sending the shutdown message.');
            }
        } 

        
    },
};
