const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
    AUTHORIZED_USERS: [
        'FILL-OUT',  // Add user description in comments
        'FILL-OUT'    // Add user description in comments
    ],
    PROTECTED_USERS: [
        'FILL-OUT',   // Add user description in comments
        'FILL-OUT',  // Add user description in comments
        'FILL-OUT',   // Add user description in comments
        'FILL-OUT'    // Add user description in comments
    ],
    FILES: {
        BLACKLIST: path.join(__dirname, '..', '..', 'data', 'blacklist.json')
    },
    EMBED: {
        COLORS: {
            SUCCESS: Colors.Green,
            ERROR: Colors.Red,
            INFO: Colors.Blue
        }
    }
};

// Utility Functions
const createBlacklistEmbed = (title, description, color) => {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp()
        .setFooter({ text: 'Georgia State Roleplay • Blacklist System' });
};

const getBlacklist = async () => {
    try {
        const data = await fs.readFile(CONFIG.FILES.BLACKLIST, 'utf8');
        const json = JSON.parse(data);
        return json.blacklisted || [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            await saveBlacklist([]); // Create file if it doesn't exist
            return [];
        }
        throw error;
    }
};

const saveBlacklist = async (blacklist) => {
    try {
        const dirPath = path.dirname(CONFIG.FILES.BLACKLIST);
        await fs.mkdir(dirPath, { recursive: true });
        await fs.writeFile(
            CONFIG.FILES.BLACKLIST,
            JSON.stringify({ blacklisted: blacklist }, null, 2),
            'utf8'
        );
    } catch (error) {
        console.error('Error saving blacklist:', error);
        throw new Error('Failed to save blacklist');
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Manage the blacklist')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to the blacklist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to blacklist')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for blacklisting')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from the blacklist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove from the blacklist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('View all blacklisted users')),

    async execute(interaction) {
        try {
            // Check authorization
            if (!CONFIG.AUTHORIZED_USERS.includes(interaction.user.id)) {
                const embed = createBlacklistEmbed(
                    '❌ Unauthorized',
                    'You do not have permission to use this command.',
                    CONFIG.EMBED.COLORS.ERROR
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'add': {
                    const user = interaction.options.getUser('user');
                    const reason = interaction.options.getString('reason');

                    if (CONFIG.PROTECTED_USERS.includes(user.id)) {
                        const embed = createBlacklistEmbed(
                            '❌ Protected User',
                            'This user cannot be blacklisted.',
                            CONFIG.EMBED.COLORS.ERROR
                        );
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }

                    const blacklist = await getBlacklist();
                    if (blacklist.includes(user.id)) {
                        const embed = createBlacklistEmbed(
                            '❌ Already Blacklisted',
                            'This user is already blacklisted.',
                            CONFIG.EMBED.COLORS.ERROR
                        );
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }

                    blacklist.push(user.id);
                    await saveBlacklist(blacklist);

                    const embed = createBlacklistEmbed(
                        '✅ User Blacklisted',
                        `Successfully blacklisted ${user.tag}\nReason: ${reason}`,
                        CONFIG.EMBED.COLORS.SUCCESS
                    );
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                case 'remove': {
                    const user = interaction.options.getUser('user');
                    const blacklist = await getBlacklist();

                    if (!blacklist.includes(user.id)) {
                        const embed = createBlacklistEmbed(
                            '❌ Not Blacklisted',
                            'This user is not on the blacklist.',
                            CONFIG.EMBED.COLORS.ERROR
                        );
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }

                    const updatedBlacklist = blacklist.filter(id => id !== user.id);
                    await saveBlacklist(updatedBlacklist);

                    const embed = createBlacklistEmbed(
                        '✅ User Removed',
                        `Successfully removed ${user.tag} from the blacklist.`,
                        CONFIG.EMBED.COLORS.SUCCESS
                    );
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                case 'list': {
                    const blacklist = await getBlacklist();
                    const userList = await Promise.all(
                        blacklist.map(async (id) => {
                            try {
                                const user = await interaction.client.users.fetch(id);
                                return `• ${user.tag} (${user.id})`;
                            } catch {
                                return `• Unknown User (${id})`;
                            }
                        })
                    );

                    const embed = createBlacklistEmbed(
                        '📋 Blacklisted Users',
                        userList.length ? userList.join('\n') : 'No users are blacklisted.',
                        CONFIG.EMBED.COLORS.INFO
                    );
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }
            }
        } catch (error) {
            console.error('Error in blacklist command:', error);
            const embed = createBlacklistEmbed(
                '❌ Error',
                'An error occurred while executing the command.',
                CONFIG.EMBED.COLORS.ERROR
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
