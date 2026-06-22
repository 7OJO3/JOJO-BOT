require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType, Events, PermissionsBitField } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const express = require('express');
const path = require('path');
const fs = require('fs');

// --- 1. إعداد الخط ---
const fontPath = path.join(__dirname, 'font.ttf');
if (fs.existsSync(fontPath)) {
    GlobalFonts.registerFromPath(fontPath, 'MyCustomFont');
}

// --- 2. إعداد الخادم ---
const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(process.env.PORT || 3000);

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates] 
});

const TARGET_CHANNEL_ID = '1501583456872829068';
const VOICE_CHANNEL_ID = '1518127536834613360';
const EMOJI_ID = '1513336672870469793';
const ROLE_ID = '1501374221992071348';
const MY_USER_ID = '890586243346354216'; 
const designCache = new Map();

// دالة قص الصورة (Cover)
function drawImageCover(ctx, img, x, y, width, height) {
    const imgRatio = img.width / img.height;
    const destRatio = width / height;
    let sWidth, sHeight, sx, sy;

    if (imgRatio > destRatio) {
        sWidth = img.height * destRatio;
        sHeight = img.height;
        sx = (img.width - sWidth) / 2;
        sy = 0;
    } else {
        sWidth = img.width;
        sHeight = img.width / destRatio;
        sx = 0;
        sy = (img.height - sHeight) / 2;
    }
    ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, width, height);
}

async function createProfileCard(bannerUrl, avatarUrl, member) {
    const canvas = createCanvas(900, 400);
    const ctx = canvas.getContext('2d');
    
    // خلفية داكنة (نفس لون خلفية الصورة المرفقة)
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 900, 400);
    
    // رسم البانر (بدون حواف جانبية ليطابق التصميم)
    const bannerW = 900;
    const bannerH = 220;
    const banner = await loadImage(bannerUrl);
    drawImageCover(ctx, banner, 0, 0, bannerW, bannerH);
    
    // إطار الأفاتار الدائري (موقع الأفاتار في صورتك)
    const avatarSize = 130;
    const avatarX = 40;
    const avatarY = 220; 
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, 65, 0, Math.PI * 2); 
    ctx.clip();
    const avatar = await loadImage(avatarUrl);
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
    
    const font = fs.existsSync(fontPath) ? '"MyCustomFont"' : 'sans-serif';
    
    // الاسم والمعرف
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 32px ${font}`;
    ctx.fillText(member.user.username, 190, 270);
    
    ctx.fillStyle = '#888888';
    ctx.font = `18px ${font}`;
    ctx.fillText('@' + member.user.username.toLowerCase(), 190, 300);
    
    // الخط الفاصل
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 340);
    ctx.lineTo(860, 340);
    ctx.stroke();
    
    // البيانات (MEMBER SINCE / JOINED SERVER)
    ctx.fillStyle = '#777777';
    ctx.font = `bold 12px ${font}`;
    ctx.fillText('MEMBER SINCE', 40, 370);
    ctx.fillText('JOINED SERVER', 500, 370);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `14px ${font}`;
    ctx.fillText(member.user.createdAt.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}), 40, 390);
    ctx.fillText(member.joinedAt.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}), 500, 390);
    
    return new AttachmentBuilder(await canvas.encode('png'), { name: 'profile.png' });
}

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.content.startsWith('!design')) return;
    if (!message.member.roles.cache.has(ROLE_ID)) return message.reply('❌ ليس لديك الصلاحية.');
    if (message.attachments.size < 2) return message.reply('⚠️ يرجى إرفاق صورتين.');
    
    const targetChannel = client.channels.cache.get(TARGET_CHANNEL_ID);
    if (!targetChannel) return message.reply('❌ الروم المحدد غير موجود!');
    
    const att = Array.from(message.attachments.values());
    const data = { bannerUrl: att[0].url, avatarUrl: att[1].url };
    designCache.set(message.author.id, data);
    
    try {
        const card = await createProfileCard(data.bannerUrl, data.avatarUrl, message.member);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('try_btn').setLabel('Try').setEmoji(EMOJI_ID).setStyle(ButtonStyle.Secondary)
        );
        await targetChannel.send({ files: [card], components: [row] });
        await message.reply('✅ تم إرسال التصميم للروم.');
    } catch (err) {
        console.error(err);
        message.reply('❌ حدث خطأ أثناء المعالجة.');
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton() || interaction.customId !== 'try_btn') return;
    const data = designCache.get(interaction.user.id);
    if (!data) return interaction.reply({ content: '❌ لا توجد بيانات.', ephemeral: true });
    await interaction.reply({ content: `الصور الأصلية:\nالبنر: ${data.bannerUrl}\nالأفاتار: ${data.avatarUrl}`, ephemeral: true });
});

client.login(process.env.TOKEN);
