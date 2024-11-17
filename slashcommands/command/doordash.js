const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('doordash')
        .setDescription('Sends a friendly DoorDash link'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Feeling Hungry?')
            .setDescription('Don’t worry, we’ve got you covered! 🍔🍕\n\nTreat yourself to something delicious from DoorDash today.')
            .addFields(
                { name: 'Order your favorite meal:', value: '[Click here to order from DoorDash!](https://www.doordash.com)' },
                { name: 'Need recommendations?', value: 'Let me know if you need help deciding! 🍽️' }
            )
            .setColor('Green')
            .setFooter({ text: 'Enjoy your meal and take care! 😊' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
