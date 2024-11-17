const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('application')
        .setDescription('Check the application status for a department')
        .addStringOption(option =>
            option.setName('department')
                .setDescription('The department to check')
                .setRequired(true)
                .addChoices(
                    { name: 'FSCO', value: 'FSCO' },
                    { name: 'AFD', value: 'AFD' },
                    { name: 'GSP', value: 'GSP' },
                    { name: 'APD', value: 'APD' }
                ))
        .addStringOption(option =>
            option.setName('status')
                .setDescription('The application status')
                .setRequired(true)
                .addChoices(
                    { name: 'Accepted', value: 'accepted' },
                    { name: 'Denied', value: 'denied' }
                ))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check the application status for')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('notes')
                .setDescription('Additional notes')
                .setRequired(false)),

    async execute(interaction) {
        // Permission check code remains the same

        const department = interaction.options.getString('department');
        const status = interaction.options.getString('status');
        const targetUser = interaction.options.getUser('user');
        const notes = interaction.options.getString('notes');
        const applicationViewer = interaction.user.id;

        let embed;
        let rolesToAdd = [];

        if (status === 'accepted') {
            if (department === 'FSCO') {
                embed = new EmbedBuilder()
                    .setTitle('Fulton County Sheriff\'s Office')
                    .setDescription(`> On behalf of the FCSO administration team, we would like to congratulate you on being **accepted** into the department! For more information head over to the department server.

             <:Application:1244373131657875497> **Application Viewer:** <@${applicationViewer}>${notes ? `\n<:SpeechBubble:1177680381986742302> **Notes:** ${notes}` : ''}`)
                    .setThumbnail('https://media.discordapp.net/attachments/919709999423434842/1248053170777751562/fcso.png?ex=66d3a497&is=66d25317&hm=490f74223f2e4cb91cc0076ab6a5e59213bc3a23de6e54f3f83a38f37856070f&format=webp&quality=lossless&width=1168&height=1036&')
                    .setImage('https://media.discordapp.net/attachments/919709999423434842/1248729045428863048/-_-_2024-06-06T194058.984.png?ex=66d3770c&is=66d2258c&hm=b0c2036a39e79dcff076ad07ec12ae99f9c4a528c33c2344b680dd29de2d68c6&format=webp&quality=lossless&width=3072&height=1076&')
                    .setColor('#2B2D31');

                rolesToAdd = ['1246498844594802800', '1245485251413676123'];

            } else if (department === 'AFD') {
                embed = new EmbedBuilder()
                    .setTitle('Atlanta Fire Department')
                    .setDescription(`> On behalf of the AFD administration team, we would like to congratulate you on being **accepted** into the department! For more information head over to the department server.

            <:Application:1244373131657875497> **Application Viewer:** <@${applicationViewer}>${notes ? `\n<:SpeechBubble:1177680381986742302> **Notes:** ${notes}` : ''}`)
                    .setThumbnail('https://media.discordapp.net/attachments/919709999423434842/1248728530100027565/2SO6mvka51OAAAAAElFTkSuQmCC.png?ex=66d37691&is=66d22511&hm=592e0006044678bf401182c6f4f4cc5896bd5c6877725a4f1d688fbf25cf8506&format=webp&quality=lossless&width=1198&height=1198&')
                    .setImage('https://media.discordapp.net/attachments/919709999423434842/1248729047018639360/-_-_2024-06-07T160240.861.png?ex=66d3770d&is=66d2258d&hm=9c24964b76fbc523bb1689db6268222e1ca6e69608f197dfb2d148fa37113c4f&format=webp&quality=lossless&width=1918&height=720&')
                    .setColor('#2B2D31');

                rolesToAdd = ['1246498874521157644', '1245485251413676123'];

            } else if (department === 'GSP') {
                embed = new EmbedBuilder()
                    .setTitle('Georgia State Patrol')
                    .setDescription(`> On behalf of the GSP administration team, we would like to congratulate you on being **accepted** into the department! For more information head over to the department server.
                
            <:Application:1244373131657875497> **Application Viewer:** <@${applicationViewer}>${notes ? `\n<:SpeechBubble:1177680381986742302> **Notes:** ${notes}` : ''}`)
                    .setThumbnail('https://media.discordapp.net/attachments/919709999423434842/1247714830501150730/N5AAAAABJRU5ErkJggg.png?ex=66d3bafd&is=66d2697d&hm=c44ccdf70447f7d2ae011295f8fd7a205c7e618784d20e4d6cdefeb66d24a71a&format=webp&quality=lossless&width=1052&height=1198&')
                    .setImage('https://media.discordapp.net/attachments/919709999423434842/1248409264461058218/-_-_2024-06-06T185226.323.png?ex=66d39eba&is=66d24d3a&hm=1161a8ca32ff31bbdb8181d77ce54e3df012a19b678263da37bab39719428c0a&format=webp&quality=lossless&width=1910&height=634&')
                    .setColor('#2B2D31');

                rolesToAdd = ['1246498779612581969', '1245485251413676123'];
            } else if (department === 'APD') {
                embed = new EmbedBuilder()
                    .setTitle('Atlanta Police Department')
                    .setDescription(`> On behalf of the APD administration team, we would like to congratulate you on being **accepted** into the department! For more information head over to the department server.

            <:Application:1244373131657875497> **Application Viewer:** <@${applicationViewer}>${notes ? `\n<:SpeechBubble:1177680381986742302> **Notes:** ${notes}` : ''}`)
                    .setThumbnail('https://media.discordapp.net/attachments/919709999423434842/1248728530100027565/2SO6mvka51OAAAAAElFTkSuQmCC.png')
                    .setImage('https://media.discordapp.net/attachments/919709999423434842/1248729047018639360/-_-_2024-06-07T160240.861.png')
                    .setColor('#2B2D31');

                rolesToAdd = [];
            }

            // Assign roles only if accepted
            if (rolesToAdd.length > 0) {
                await interaction.guild.members.cache.get(targetUser.id).roles.add(rolesToAdd);
            }
        } else if (status === 'denied') {
            // Create denial embeds without assigning roles
            if (department === 'FSCO') {
                embed = new EmbedBuilder()
                    .setTitle('Fulton County Sheriff\'s Office')
                    .setDescription(`> On behalf of the FCSO administration team, we would like to inform you on being **denied** into the department. Feel free to re-apply!
                
            <:Application:1244373131657875497> **Application Viewer:** <@${applicationViewer}>${notes ? `\n<:SpeechBubble:1177680381986742302> **Notes:** ${notes}` : ''}`)
                    .setThumbnail('https://media.discordapp.net/attachments/919709999423434842/1248053170777751562/fcso.png?ex=66643dd7&is=6662ec57&hm=07bf4e6f9410e74d7b9af914bee25ecf42dda2cbc023c6cc036af4d5ab5b29d1&=&format=webp&quality=lossless&width=1168&height=1036')
                    .setImage('https://media.discordapp.net/attachments/919709999423434842/1248729045764411484/-_-_2024-06-06T194122.573.png?ex=6664b90c&is=6663678c&hm=b99607ee742164076aad0f2a97054558722e3bc461a0b7a18123dac9693729a6&=&format=webp&quality=lossless&width=3072&height=1076')
                    .setColor('#2B2D31');
            } else if (department === 'AFD') {
                embed = new EmbedBuilder()
                    .setTitle('Atlanta Fire Department')
                    .setDescription(`> On behalf of the AFD administration team, we would like to inform you on being **denied** into the department. Feel free to re-apply!
                
            <:Application:1244373131657875497> **Application Viewer:** <@${applicationViewer}>${notes ? `\n<:SpeechBubble:1177680381986742302> **Notes:** ${notes}` : ''}`)
                    .setThumbnail('https://media.discordapp.net/attachments/919709999423434842/1248728530100027565/2SO6mvka51OAAAAAElFTkSuQmCC.png?ex=6664b891&is=66636711&hm=ec5a1f89f493e38c013eefde2e20b05789e89fec67dcd38dcd2522a3d4d6e6ba&=&format=webp&quality=lossless&width=1198&height=1198')
                    .setImage('https://media.discordapp.net/attachments/919709999423434842/1248729047379218663/-_-_2024-06-07T160310.759.png?ex=6664b90d&is=6663678d&hm=f9a1d40fc98fa3fb91ef75de682b0333923f56dd707fd82c60d191a34c707e38&=&format=webp&quality=lossless&width=1918&height=720')
                    .setColor('#2B2D31');
            } else if (department === 'GSP') {
                embed = new EmbedBuilder()
                    .setTitle('Georgia State Patrol')
                    .setDescription(`> On behalf of the GSP administration team, we would like to inform you on being **denied** into the department. Feel free to re-apply!

            <:Application:1244373131657875497> **Application Viewer:** <@${applicationViewer}>${notes ? `\n<:SpeechBubble:1177680381986742302> **Notes:** ${notes}` : ''}`)
                    .setThumbnail('https://media.discordapp.net/attachments/919709999423434842/1247714830501150730/N5AAAAABJRU5ErkJggg.png?ex=666302bd&is=6661b13d&hm=14d801f48a62018fb52fbac48336cf4c4a04c98a9fb491e9e27c96023792511c&=&format=webp&quality=lossless&width=1052&height=1198')
                    .setImage('https://media.discordapp.net/attachments/919709999423434842/1248410491043188786/-_-_2024-06-06T185723.913.png?ex=6663905f&is=66623edf&hm=03ddff97e9984c31b9af32f9403629681be93afe28b358d5a9817e72e5675669&=&format=webp&quality=lossless&width=1100&height=366')
                    .setColor('#2B2D31');
            } else if (department === 'APD') {
                embed = new EmbedBuilder()
                    .setTitle('Atlanta Police Department')
                    .setDescription(`> On behalf of the APD administration team, we would like to inform you on being **denied** into the department. Feel free to re-apply!

            <:Application:1244373131657875497> **Application Viewer:** <@${applicationViewer}>${notes ? `\n<:SpeechBubble:1177680381986742302> **Notes:** ${notes}` : ''}`)
                    .setThumbnail('https://media.discordapp.net/attachments/919709999423434842/1248728530100027565/2SO6mvka51OAAAAAElFTkSuQmCC.png')
                    .setImage('https://media.discordapp.net/attachments/919709999423434842/1248729047379218663/-_-_2024-06-07T160310.759.png')
                    .setColor('#2B2D31');
            }
        }

        const targetChannelId = '1175168162635980892';
        const targetChannel = await interaction.guild.channels.cache.get(targetChannelId);

        if (targetChannel) {
            targetChannel.send({ content: `${targetUser}`, embeds: [embed] });
            await interaction.reply({ content: 'Application status has been sent.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Could not find the target channel.', ephemeral: true });
        }
    }
};