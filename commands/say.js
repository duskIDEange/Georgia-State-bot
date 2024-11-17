module.exports = {
    name: 'say',
    description: 'Repeats the message provided by the user and deletes the command message.',
    async execute(message, args) {
        const allowedRoleID = '1173795575251095562';

        // Check if the user has the required role
        if (!message.member.roles.cache.has(allowedRoleID)) {
            // Simply return without sending a reply if the user doesn't have the required role
            return;
        }

        // Join the arguments into a single string message
        const sayMessage = args.join(' ');

        // Check if a message was provided
        if (!sayMessage) {
            return message.reply('You need to provide a message for me to say!')
                .then(reply => {
                    setTimeout(() => reply.delete(), 5000);
                });
        }

        try {
            // Send the message and delete the command message
            await message.channel.send(sayMessage);
            await message.delete();
        } catch (error) {
            console.error('Error executing command:', error);
            message.reply('There was an error executing that command!');
        }
    },
};
