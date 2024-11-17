const { EmbedBuilder, Colors } = require('discord.js');

// Configuration
const CONFIG = {
    ALERT_CHANNEL_ID: '1307542694414778408',
    ERROR_MESSAGES: {
        COMMAND_NOT_FOUND: 'Command not found!',
        SUBCOMMAND_NOT_FOUND: 'Subcommand not found!',
        EXECUTION_ERROR: 'There was an error while executing this command!'
    }
};

// Utility function to send error alerts
const sendErrorAlert = async (client, error, interaction, type) => {
    try {
        const channel = await client.channels.fetch(CONFIG.ALERT_CHANNEL_ID);
        if (!channel) return;

        const alertEmbed = new EmbedBuilder()
            .setTitle('⚠️ Command Error')
            .setColor(Colors.Red)
            .setDescription('An error occurred while executing a command.')
            .addFields([
                { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'Command', value: interaction.commandName, inline: true },
                { name: 'Error Type', value: type, inline: true },
                { name: 'Error Message', value: error.message || 'No error message', inline: false },
                { name: 'Channel', value: `${interaction.channel.name} (${interaction.channel.id})`, inline: false },
                { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            ])
            .setTimestamp();

        await channel.send({ embeds: [alertEmbed] });
    } catch (err) {
        console.error('Error sending error alert:', err);
    }
};

// Handle interaction response
const handleInteractionResponse = async (interaction, content, error = false) => {
    const response = { 
        content,
        ephemeral: true 
    };

    try {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(response);
        } else {
            await interaction.reply(response);
        }
    } catch (err) {
        console.error('Error responding to interaction:', err);
    }
};

// Execute command function
const executeCommand = async (command, interaction, client) => {
    try {
        if (command.data.options?.some(option => option.type === 'SUB_COMMAND')) {
            const subcommand = interaction.options.getSubcommand();

            if (command.subcommands?.[subcommand]) {
                await command.subcommands[subcommand](interaction, client);
            } else {
                console.error(`Subcommand not found: ${subcommand}`);
                await handleInteractionResponse(interaction, CONFIG.ERROR_MESSAGES.SUBCOMMAND_NOT_FOUND);
                await sendErrorAlert(client, new Error('Subcommand not found'), interaction, 'SUBCOMMAND_NOT_FOUND');
            }
        } else {
            await command.execute(interaction, client);
        }
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        await handleInteractionResponse(interaction, CONFIG.ERROR_MESSAGES.EXECUTION_ERROR);
        await sendErrorAlert(client, error, interaction, 'COMMAND_EXECUTION_ERROR');
    }
};

// Permission check function
const checkPermissions = async (command, interaction) => {
    if (command.permissions) {
        const missingPermissions = command.permissions.filter(perm => !interaction.member.permissions.has(perm));
        if (missingPermissions.length > 0) {
            await handleInteractionResponse(interaction, `You are missing the following permissions: ${missingPermissions.join(', ')}`);
            return false;
        }
    }
    return true;
};

// Main interaction handler
module.exports = async (client, interaction) => {
    // Only handle command interactions
    if (!interaction.isCommand()) return;

    try {
        const command = client.slashCommands.get(interaction.commandName);

        // Check if command exists
        if (!command) {
            console.error(`Command not found: ${interaction.commandName}`);
            await handleInteractionResponse(interaction, CONFIG.ERROR_MESSAGES.COMMAND_NOT_FOUND);
            await sendErrorAlert(client, new Error('Command not found'), interaction, 'COMMAND_NOT_FOUND');
            return;
        }

        // Check permissions
        if (!await checkPermissions(command, interaction)) {
            return;
        }

        // Execute command
        await executeCommand(command, interaction, client);

    } catch (error) {
        console.error('Interaction handling error:', error);
        await handleInteractionResponse(interaction, CONFIG.ERROR_MESSAGES.EXECUTION_ERROR);
        await sendErrorAlert(client, error, interaction, 'INTERACTION_HANDLER_ERROR');
    }
};
  