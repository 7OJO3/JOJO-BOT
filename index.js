require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType, Events, PermissionsBitField } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const express = require('express');
const path = require('path');
const fs = require('fs');

// تحميل الخط المخصص (تأكد أن الملف باسم font.ttf في نفس مجلد الكود)
const fontPath = path.join(__dirname, 'font.ttf');
if (fs.existsSync(fontPath)) {
    GlobalFonts.registerFromPath(fontPath, 'MyCustomFont');
}

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates] 
});

// الثوابت الخاصة بك
const TARGET_CHANNEL_ID = '1501583456872829068';
const VOICE_CHANNEL_ID = '1518127536834613360';
const EMOJI_ID = '1513336672870469793';
const ROLE_ID = '1501374221992071348';
const MY_USER_ID = '890586243346354216'; 
const designCache = new Map();

// دالة قص احترافية (Cover) تقص الحواف وتملأ المساحة بدون أي مطّ
function drawImageCover(ctx, img, x, y, width, height) {
    const ratio = Math.max(width / img.width, height / img.height);
    const sWidth = width / ratio;
    const sHeight = height / ratio;
    const sx = (img.width - sWidth) / 2;
    const sy = (img.height - sHeight) / 2;
    ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, width, height);
}

async function createProfileCard(bannerUrl, avatarUrl, member) {
    // أبعاد الكانفاس مطابقة تماماً للنموذج المرفق
    const canvas = createCanvas(1000, 600); 
    const ctx = canvas.getContext('2d');
    
    // خلفية داكنة موحدة
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(0, 0, 1000, 600);
    
    // 1. البانر: قص الحواف وتغطية المساحة العلوية
    const banner = await loadImage(bannerUrl);
    drawImageCover(ctx, banner, 0, 0, 1000, 350);
    
    // 2. الأفاتار: الموقع الدقيق كما في صورتك
    ctx.save();
    ctx.beginPath();
    ctx.arc(160, 420, 110, 0, Math.PI * 2);
    ctx.clip();
    const avatar = await loadImage(avatarUrl);
    ctx.drawImage(avatar, 50, 310, 220, 220);
    ctx.restore();
    
    const font = fs.existsSync(fontPath) ? '"MyCustomFont"' : 'sans-serif';
    
    // 3. النصوص: نفس حجم الخط الصغير في صورتك
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 40px ${font}`;
    ctx.fillText(member.user.username, 300, 430);
    
    ctx.fillStyle = '#aaaaaa';
    ctx.font = `24px ${font}`;
    ctx.fillText('@' + member.user.username.toLowerCase(), 300, 470);
    
    // 4. الخط الفاصل
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 530);
    ctx.lineTo(950, 530);
    ctx.stroke();
    
    // 5. التواريخ: توزيع مطابق
    ctx.fillStyle = '#666666';
    ctx.font = `bold 18px ${font}`;
    ctx.fillText('MEMBER SINCE', 50, 570);
    ctx.fillText('JOINED SERVER', 550, 570);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `20px ${font}`;
    ctx.fillText(member.user.createdAt.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}), 50, 595);
    ctx.fillText(member.joinedAt.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}), 550, 595);
    
    return new AttachmentBuilder(await canvas.encode('png'), { name: 'profile.png' });
}

// الكود الباقي للأوامر والربط (كما طلبت سابقاً):
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.content.startsWith('!design')) return;
    if (!message.member.roles.cache.has(ROLE_ID)) return message.reply('❌ ليس لديك الصلاحية.');
    if (message.attachments.size < 2) return message.reply('⚠️ يرجى إرفاق صورتين.');
    
    const targetChannel = client.channels.cache.get(TARGET_CHANNEL_ID);
    if (!targetChannel) return;
    
    const att = Array.from(message.attachments.values());
    try {
        const card = await createProfileCard(att[0].url, att[1].url, message.member);
        await targetChannel.send({ files: [card] });
        await message.reply('✅ تم إنشاء التصميم.');
    } catch (err) {
        message.reply('❌ خطأ في التصميم.');
    }
});

client.login(process.env.TOKEN);
