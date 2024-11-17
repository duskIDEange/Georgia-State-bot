const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('Request moderation support and notify the appropriate role.'),
        
    async execute(interaction) {
        const roleID = '1145560523316936734';
        const requiredRoleID = '1244398079852019812';
        const avatarURL = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 32 });

        // Check if the user has the required role
        if (!interaction.member.roles.cache.has(requiredRoleID)) {
            return interaction.reply({ content: 'You do not have the required role to request moderation support.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('Staff Request')
            .setDescription(`${interaction.member} has requested moderation backup in-game!`)
            .setColor('#2f3136')
            .setFooter({
                text: `Requested by ${interaction.member.displayName} | ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour12: true })} EDT`,
                iconURL: avatarURL
            });

        try {
            await interaction.channel.send({ content: `<@&${roleID}>`, embeds: [embed] });
            await interaction.reply({ content: 'Your request has been sent!', ephemeral: true });
        } catch (error) {
            console.error('Error executing command:', error);
            interaction.reply({ content: 'There was an error executing that command!', ephemeral: true });
        }
    },
};
