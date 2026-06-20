require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Fake Streaming
    client.user.setPresence({
        activities: [{ 
            name: 'Watching .e_9', 
            type: ActivityType.Streaming,
            url: 'https://www.twitch.tv/fajer' 
        }],
        status: 'online'
    });
});

client.on('messageCreate', async message => {
    if (message.content === '!profile') {
        const card = await createProfileCard(message.member);
        const button = new ButtonBuilder()
            .setCustomId('get_original_assets')
            .setLabel('Try')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1513336672870469793');

        const row = new ActionRowBuilder().addComponents(button);
        const targetChannel = message.guild.channels.cache.get('1501583456872829068');
        
        if (targetChannel) {
            targetChannel.send({ files: [card], components: [row] });
        }
    }
});

client.on('interactionCreate', async i => {
    if (!i.isButton()) return;
    if (i.customId === 'get_original_assets') {
        const embed = new EmbedBuilder()
            .setTitle('Original Assets')
            .setImage(i.user.displayAvatarURL({ size: 1024 }))
            .setDescription('هذه صورة الأفاتار الأصلية');
        await i.reply({ embeds: [embed], ephemeral: true });
    }
});

async function createProfileCard(member) {
    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');
    
    // الخلفية
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, 800, 450);
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, 800, 200);

    // الأفاتار
    const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png' }));
    ctx.save();
    ctx.beginPath();
    ctx.arc(120, 200, 70, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, 50, 130, 140, 140);
    ctx.restore();

    // النصوص
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 35px Sans-serif';
    ctx.fillText(member.user.username, 220, 210);
    
    return new AttachmentBuilder(canvas.toBuffer(), { name: 'profile.png' });
}

client.login(process.env.TOKEN);
