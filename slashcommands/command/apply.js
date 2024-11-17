const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

// Configuration
const CONFIG = {
    FORMS: {
        STAFF: 'https://docs.google.com/forms/d/e/1FAIpQLSfDL6fLPmqFgGSS8sjlWizS8J6o3NZqkuo5euw7TNeQlaOsOw/viewform',
        DEPARTMENTS: {
            GSP: 'https://docs.google.com/forms/d/e/1FAIpQLSfDL6fLPmqFgGSS8sjlWizS8J6o3NZqkuo5euw7TNeQlaOsOw/viewform',
            FCSO: 'https://docs.google.com/forms/d/e/1FAIpQLSfDL6fLPmqFgGSS8sjlWizS8J6o3NZqkuo5euw7TNeQlaOsOw/viewform',
            AFD: 'https://docs.google.com/forms/d/e/1FAIpQLSfDL6fLPmqFgGSS8sjlWizS8J6o3NZqkuo5euw7TNeQlaOsOw/viewform'
        }
    },
    COOLDOWN: 60000, // 1 minute cooldown
    ROLES: {
        STAFF: '1244398079852012812' // Staff role ID
    }
};

// Cooldown management
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('apply')
        .setDescription('View application information and links')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of application')
                .setRequired(true)
                .addChoices(
                    { name: 'Staff Team', value: 'staff' },
                    { name: 'Georgia State Patrol', value: 'gsp' },
                    { name: 'Fulton County Sheriff Office', value: 'fcso' },
                    { name: 'Atlanta Fire Department', value: 'afd' }
                )),

    async execute(interaction) {
        try {
            // Check cooldown
            const { user } = interaction;
            const now = Date.now();
            const cooldownEnd = cooldowns.get(user.id);

            if (cooldownEnd && now < cooldownEnd) {
                const remainingTime = Math.ceil((cooldownEnd - now) / 1000);
                return interaction.reply({
                    content: `Please wait ${remainingTime} seconds before using this command again.`,
                    ephemeral: true
                });
            }

            const applicationType = interaction.options.getString('type');
            let embed, buttons;

            switch (applicationType) {
                case 'staff':
                    embed = new EmbedBuilder()
                        .setTitle('🛡️ Staff Application')
                        .setDescription([
                            '**Welcome to the Staff Application Process!** 💼',
                            '',
                            '**Requirements:**',
                            '• Must be 13+ years old',
                            '• Must have Discord and Roblox accounts',
                            '• Must be active in the community',
                            '• Must have a clean moderation history',
                            '',
                            '**What we look for:**',
                            '• Maturity and professionalism',
                            '• Strong communication skills',
                            '• Ability to handle difficult situations',
                            '• Dedication to helping the community',
                            '',
                            '**Click the button below to start your application!**'
                        ].join('\n'))
                        .setColor(Colors.Purple)
                        .setFooter({ text: 'Good luck with your application! 🌟' })
                        .setTimestamp();

                    buttons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('Apply for Staff')
                                .setStyle(ButtonStyle.Link)
                                .setURL(CONFIG.FORMS.STAFF)
                                .setEmoji('📝'),
                            new ButtonBuilder()
                                .setLabel('Staff Guidelines')
                                .setStyle(ButtonStyle.Link)
                                .setURL('https://docs.google.com/forms/d/e/1FAIpQLSfDL6fLPmqFgGSS8sjlWizS8J6o3NZqkuo5euw7TNeQlaOsOw/viewform')
                                .setEmoji('📚')
                        );
                    break;

                case 'gsp':
                case 'fcso':
                case 'afd':
                    const deptNames = {
                        gsp: 'Georgia State Patrol',
                        fcso: 'Fulton County Sheriff Office',
                        afd: 'Atlanta Fire Department'
                    };

                    embed = new EmbedBuilder()
                        .setTitle(`${deptNames[applicationType]} Application`)
                        .setDescription([
                            `**Welcome to the ${deptNames[applicationType]} Application Process!** 🚔`,
                            '',
                            '**Requirements:**',
                            '• Must be in good standing with the community',
                            '• Must have a clean record',
                            '• Must be active and professional',
                            '',
                            '**Process:**',
                            '1. Submit your application',
                            '2. Wait for application review',
                            '3. Attend an interview if selected',
                            '4. Complete training if accepted',
                            '',
                            'Click the button below to begin your application!'
                        ].join('\n'))
                        .setColor(Colors.Blue)
                        .setFooter({ text: 'Thank you for your interest! 🌟' })
                        .setTimestamp();

                    buttons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel(`Apply for ${deptNames[applicationType]}`)
                                .setStyle(ButtonStyle.Link)
                                .setURL(CONFIG.FORMS.DEPARTMENTS[applicationType.toUpperCase()])
                                .setEmoji('📝')
                        );
                    break;
            }

            await interaction.reply({
                embeds: [embed],
                components: [buttons],
                ephemeral: true
            });

            // Set cooldown
            cooldowns.set(user.id, now + CONFIG.COOLDOWN);
            setTimeout(() => cooldowns.delete(user.id), CONFIG.COOLDOWN);

        } catch (error) {
            console.error('Error in apply command:', error);
            await interaction.reply({
                content: 'There was an error processing your application request. Please try again later.',
                ephemeral: true
            });
        }
    }
};
