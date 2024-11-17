const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

let botStatus = "Online ✅"; // Default bot status
let statusNotes = ""; // Notes to be displayed in the embed
const thumbnailURL = 'https://cdn.discordapp.com/icons/1145425767283556532/2430c4025bc711937c207422abc687e0.png?size=512'; // Replace with your thumbnail URL
const botOwner = "<@707706372053008557>"; // Bot owner ID

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot')
        .setDescription('Bot commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('admin')
                .setDescription('Change the status of the bot')
                .addStringOption(option =>
                    option.setName('status')
                        .setDescription('The new status of the bot')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Online ✅', value: 'Online ✅' },
                            { name: 'Updating 🟡', value: 'Updating 🟡' },
                            { name: 'Shutdown 🔴', value: 'Shutdown 🔴' }
                        ))
                .addStringOption(option =>
                    option.setName('notes')
                        .setDescription('Optional notes to display in the status embed')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Show the status of the bot')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'status') {
            const uptime = process.uptime(); // Get the bot's uptime in seconds
            const days = Math.floor(uptime / (60 * 60 * 24));
            const hours = Math.floor((uptime % (60 * 60 * 24)) / (60 * 60));
            const minutes = Math.floor((uptime % (60 * 60)) / 60);
            const seconds = Math.floor(uptime % 60);

            const embed = new EmbedBuilder()
                .setTitle('Bot Status')
                .setThumbnail(thumbnailURL)
                .setColor(botStatus.includes('Online') ? '#00FF00' : botStatus.includes('Updating') ? '#FFFF00' : '#FF0000')
                .addFields(
                    { name: 'Status', value: botStatus, inline: true },
                    { name: 'Uptime', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
                    { name: 'Bot Developer', value: botOwner, inline: true },
                )
                .setFooter({ text: 'Georgia Utilities', iconURL: thumbnailURL })
                .setTimestamp();

            if (statusNotes) {
                embed.addFields({ name: 'Notes', value: statusNotes });
            }

            await interaction.reply({ embeds: [embed] });
        } else if (subcommand === 'admin') {
            if (interaction.user.id !== '707706372053008557') {
                return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
            }

            botStatus = interaction.options.getString('status');
            const notes = interaction.options.getString('notes');

            if (notes) {
                statusNotes = notes;
            }

            await interaction.reply(`Bot status updated to **${botStatus}**${notes ? ` with notes: **${notes}**` : ''}`);
        }
    },
};
