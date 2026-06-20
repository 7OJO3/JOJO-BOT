require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType, REST, Routes } = require('discord.js');
const express = require('express');

// Express لتثبيت البوت في الاستضافات
const app = express();
app.get('/', (req, res) => res.send('Bot is Alive!'));
app.listen(process.env.PORT || 3000);

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
    // حالة البث (الستريمنق)
    client.user.setActivity('JOJO’s Designs', {
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/discord'
    });

    // تسجيل الأمر الجديد (profile)
    const commands = [{
        name: 'profile',
        description: 'عرض بروفايل سريع',
        options: [{ name: 'user', type: 6, description: 'اختر مستخدم', required: true }]
    }];

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    
    console.log(`✅ البوت متصل الآن: ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'profile') {
        const user = interaction.options.getUser('user');
        
        // الرد الفوري (بدون إنتظار)
        await interaction.reply({
            embeds: [{
                color: 0x2b2d31,
                title: `بروفايل: ${user.username}`,
                image: { url: user.displayAvatarURL({ size: 1024, dynamic: true }) },
                footer: { text: 'تم الجلب فوراً وبدون تعليق' }
            }]
        });
    }
});

client.login(process.env.TOKEN);
