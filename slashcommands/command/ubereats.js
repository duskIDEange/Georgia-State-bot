const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ubereats')
        .setDescription('Sends a friendly Uber Eats link'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Craving Something Tasty?')
            .setDescription('We’ve got your back! 🍣🍔\n\nOrder your favorite meal from Uber Eats and enjoy some well-deserved deliciousness.')
            .addFields(
                { name: 'Order now:', value: '[Click here to order from Uber Eats!](https://www.ubereats.com)' },
                { name: 'Can’t decide?', value: 'Need help choosing something? Just ask! 🍕' }
            )
            .setColor('Blue')
            .setFooter({ text: 'Bon appétit! 😊' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
