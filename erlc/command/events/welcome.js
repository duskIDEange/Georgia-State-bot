const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../../commands/config.js'); // Make sure the correct path to config.js is provided

module.exports = (client) => {
  client.on('guildMemberAdd', async member => {
    const channelId = config.welcome.channelId; // Use the channel ID from the config
    const channel = member.guild.channels.cache.get(channelId);

    if (channel) {
      // Create buttons with dynamic member count
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Regulations')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discord.com/channels/${member.guild.id}/${channelId}`),
        );

      // Create a welcome message with placeholders replaced
      const welcomeMessage = config.welcome.message
        .replace('{member}', member.id)
        .replace('{memberCount}', member.guild.memberCount);

      // Send the message
      await channel.send({
        content: welcomeMessage,
        components: [row]
      });
    } else {
      console.error('Channel not found!');
    }
  });
};
