module.exports = {
    name: 'update',
    description: 'Sends a custom update message and appends the bot version!',
    execute(message, args) {
        // Check if the user is the one with the allowed ID
        if (message.author.id !== '1176361126578094080') {
            return message.channel.send('You do not have permission to use this command.');
        }

        // Check if there's a message to update
        const updateMessage = args.join(' ');
        if (!updateMessage) {
            return message.channel.send('Please provide a message to send with the update.');
        }

        // Send the update message with the version appended
        message.channel.send(`${updateMessage} **Bot Version**: 1.2V`);
    },
};
