const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, CommandInteraction } = require('discord.js');

/**
 * @param {CommandInteraction} interaction
 */
async function execute(interaction) {
    try {
        // Defer the reply if the command involves async operations
        if (!interaction.deferred) {
            await interaction.deferReply({ ephemeral: true }); // Defer the reply and set it to ephemeral
        }

        // Create the embed message for the bot creator
        const embed = new EmbedBuilder()
            .setTitle('Bot Developer: Meet Angelandidk')
            .setDescription(
                "Hello! I'm Angelandidk, the creator of this bot designed specifically for the Georgia State Roleplay community. Here to help enhance your experience!"
            )
            .setColor(2502454) // Set color of the embed (hexadecimal format in decimal)
            .addFields([
                {
                    name: 'Frequently Asked Questions (FAQ):',
                    value:
                        '🔧 **Encountering an Error?**\nIf you\'re facing any issues, please create a ticket, and I\'ll assist you as soon as possible.\n\n📚 **Confused About a Command?**\nNot sure how a command works? Open a general ticket, and I\'ll guide you through it.\n\n🚨 **Bot Misuse?**\nIf you notice someone abusing the bot, please ping a member of the Directive, Management team, or <@1176361126578094080>.',
                },
            ])
            .setFooter({
                text: 'Georgia Utilities | Created by Angelandidk',
            })
            .setImage(
                'https://cdn.discordapp.com/attachments/1279579755540254833/1280377088268046408/Untitled_3.png?ex=66d7db96&is=66d68a16&hm=d8232ff46b011748003f6bc2a787b966ef4d8a8404132255c6d78c01f0bad053&'
            );

        // Send the embed message
        await interaction.editReply({
            embeds: [embed],
            ephemeral: true,
        });
    } catch (error) {
        console.error('Error executing command:', error);

        // Ensure we handle the interaction properly based on its state
        if (!interaction.replied && !interaction.deferred) {
            // If neither replied nor deferred, use reply
            await interaction.reply({ content: 'There was an error executing that command!', ephemeral: true });
        } else if (interaction.deferred && !interaction.replied) {
            // If deferred but not replied yet, use followUp
            await interaction.followUp({ content: 'There was an error executing that command!', ephemeral: true });
        } else if (interaction.replied) {
            // If already replied, we can only use followUp
            await interaction.followUp({ content: 'There was an error executing that command!', ephemeral: true });
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('creator')
        .setDescription('Displays information about the bot creators.'),
    execute,
};
