const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsFilePath = path.resolve(__dirname, 'warnings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unbans a user from the server')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The ID of the user to unban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for unbanning the user')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason');
        const channelId = '1266070136956391484'; // Replace with the ID of the channel where you want to send the message

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
        }

        try {
            await interaction.guild.members.unban(userId, reason);

            const unbanEmbed = new EmbedBuilder()
                .setColor('2d2d31')
                .setTitle(`User Unbanned by ${interaction.user.tag}`)
                .setThumbnail('https://cdn.discordapp.com/attachments/1245199287210479768/1263188390149361715/image_21.png?ex=66b3b15d&is=66b25fdd&hm=6227917c185e32917810667a1e292b51ab65481367e67f6e0d4954ef42bc9915&')
                .setDescription(`User with ID **${userId}** has been unbanned from the server.`)
                .addFields(
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Unbanned By', value: interaction.user.tag, inline: true },
                );

            const channel = interaction.guild.channels.cache.get(channelId);
            if (channel) {
                await channel.send({ embeds: [unbanEmbed] });

                // Read existing warnings
                let warnings = {};
                if (fs.existsSync(warningsFilePath)) {
                    const data = fs.readFileSync(warningsFilePath);
                    warnings = JSON.parse(data);
                }

                // Add the new unban record
                if (!warnings[userId]) {
                    warnings[userId] = [];
                }
                warnings[userId].push({
                    action: 'unban',
                    reason: reason,
                    unbannedBy: interaction.user.tag,
                    date: new Date().toISOString()
                });

                fs.writeFileSync(warningsFilePath, JSON.stringify(warnings, null, 2));

                await interaction.reply({ content: 'User has been unbanned and the message has been sent to the specified channel.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Could not find the specified channel.', ephemeral: true });
            }
        } catch (error) {
            console.error('Error unbanning the user:', error);
            await interaction.reply({ content: 'There was an error trying to unban the user.', ephemeral: true });
        }
    }
};
