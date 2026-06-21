require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType, Events } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

// ضعي الآيدي الخاص بك هنا
const TARGET_CHANNEL_ID = '1501583456872829068';
const ROLE_ID = '1501374221992071348';
const EMOJI_ID = '1513336672870469793';

async function createProfileCard(bannerUrl, avatarUrl, member) {
    const canvas = createCanvas(1000, 600);
    const ctx = canvas.getContext('2d');
    
    // إعدادات النص الأساسية لضمان الظهور
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    // 1. الخلفية
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 1000, 600);
    
    // 2. البنر
    const banner = await loadImage(bannerUrl);
    ctx.drawImage(banner, 0, 0, 1000, 300);
    
    // 3. الأفاتار
    ctx.save();
    ctx.beginPath();
    ctx.arc(150, 400, 90, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const avatar = await loadImage(avatarUrl);
    ctx.drawImage(avatar, 60, 310, 180, 180);
    ctx.restore();
    
    // 4. النصوص (الاسم)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 45px sans-serif';
    ctx.fillText(member.user.username, 270, 370); // تم تعديل Y ليكون مرئياً
    
    // 5. اليوزر الفرعي
    ctx.fillStyle = '#888888';
    ctx.font = '22px sans-serif';
    ctx.fillText('@' + member.user.username.toLowerCase(), 270, 420);
    
    // 6. الخط الفاصل
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, 500); 
    ctx.lineTo(950, 500);
    ctx.stroke();
    
    // 7. التواريخ
    ctx.fillStyle = '#777777';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('MEMBER SINCE', 50, 520);
    ctx.fillText('JOINED SERVER', 500, 520);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px sans-serif';
    ctx.fillText(member.user.createdAt.toLocaleDateString('en-US'), 50, 550);
    ctx.fillText(member.joinedAt.toLocaleDateString('en-US'), 500, 550);
    
    return new AttachmentBuilder(await canvas.encode('png'), { name: 'profile.png' });
}

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.content.startsWith('!design')) return;
    if (!message.member.roles.cache.has(ROLE_ID)) return;
    if (message.attachments.size < 2) return;
    
    const att = Array.from(message.attachments.values());
    const card = await createProfileCard(att[0].url, att[1].url, message.member);
    
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('try_btn').setLabel('Try').setEmoji(EMOJI_ID).setStyle(ButtonStyle.Secondary)
    );

    const channel = client.channels.cache.get(TARGET_CHANNEL_ID);
    await channel.send({ files: [card], components: [row] });
});

client.login(process.env.TOKEN);
