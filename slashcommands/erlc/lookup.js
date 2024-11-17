const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lookup')
        .setDescription('Looks up a Roblox user by username')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The Roblox username to look up')
                .setRequired(true)),
    async execute(interaction) {
        const username = interaction.options.getString('username');

        try {
            // Request Roblox API for user information
            const response = await axios.post('https://users.roblox.com/v1/usernames/users', {
                usernames: [username],
                excludeBannedUsers: false
            });

            if (response.data.data.length === 0) {
                return interaction.reply({ content: '🚫 User not found.', ephemeral: true });
            }

            const user = response.data.data[0];
            const userResponse = await axios.get(`https://users.roblox.com/v1/users/${user.id}`);
            const userInfo = userResponse.data;

            const lookupEmbed = new EmbedBuilder()
                .setColor('#2d2d31') // Discord's brand color
                .setTitle(`🔍 Roblox User Lookup: **${userInfo.name}**`)
                .setThumbnail(`https://cdn.discordapp.com/attachments/1245199287210479768/1263188390149361715/image_21.png?ex=66b3089d&is=66b1b71d&hm=639d2929e147a8c028f9fa68bb2785284942a43c546347e85dd35fc96432865b&`)
                .addFields(
                    { name: '🧑‍💻 Username', value: `\`${userInfo.name}\``, inline: true },
                    { name: '📛 Display Name', value: `\`${userInfo.displayName}\``, inline: true },
                    { name: '🆔 User ID', value: `\`${userInfo.id}\``, inline: true },
                    { name: '📄 Description', value: userInfo.description || '_No description available._', inline: false }
                )
                .setFooter({ text: 'Roblox User Lookup', iconURL: 'https://www.roblox.com/favicon.ico' })
                .setTimestamp();

            await interaction.reply({ embeds: [lookupEmbed] });
        } catch (error) {
            console.error('Error fetching user information:', error);
            await interaction.reply({ content: '⚠️ There was an error trying to fetch user information.', ephemeral: true });
        }
    }
};
