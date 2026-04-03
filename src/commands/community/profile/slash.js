const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embeds = require('../../../constants/embeds');
const { supabase } = require('../../../utils/supabase');

// Web app URL - change this to your Vercel deployment URL
const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:3000';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('view your profile or someone else\'s')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('user to view profile of')
                .setRequired(false)
        ),

    async execute(interaction) {
        // Check if Supabase is configured
        if (!supabase) {
            return interaction.reply({
                embeds: [embeds.error('profile system is not configured yet')],
                ephemeral: true
            });
        }

        // Defer reply to prevent interaction timeout
        await interaction.deferReply();

        // Animation delay (1200ms)
        await new Promise(resolve => setTimeout(resolve, 1200));

        const targetUser = interaction.options.getUser('user') || interaction.user;
        const isOwnProfile = targetUser.id === interaction.user.id;

        // Fetch profile from Supabase
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('discord_id', targetUser.id)
            .single();

        if (error || !profile) {
            if (isOwnProfile) {
                // Show setup button for own profile
                const setupButton = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Setup Profile')
                        .setStyle(ButtonStyle.Link)
                        .setURL(WEB_APP_URL)
                        .setEmoji('⚙️')
                );

                return interaction.editReply({
                    embeds: [embeds.info(`you don't have a profile yet! click the button below to set one up ✨`)],
                    components: [setupButton]
                });
            } else {
                return interaction.editReply({
                    embeds: [embeds.error(`${targetUser.username} doesn't have a profile set up yet`)]
                });
            }
        }

        // Display profile embed with data from Supabase
        const profileEmbed = new EmbedBuilder()
            .setColor(embeds.NEUTRAL_COLOR)
            .setAuthor({
                name: `${targetUser.username}'s profile`,
                iconURL: targetUser.displayAvatarURL({ dynamic: true })
            })
            .setDescription(
                `**minecraft:** ${profile.minecraft_username}\n` +
                `**peak elo:** ${profile.peak_elo}\n` +
                `**current elo:** ${profile.current_elo}\n` +
                `**location:** ${profile.city}, ${profile.state} ${profile.country_emoji}`
            )
            .setThumbnail(profile.skin_url)
            .setFooter({
                text: `profile created ${new Date(profile.created_at).toLocaleDateString()}`
            });

        await interaction.editReply({
            embeds: [profileEmbed]
        });
    }
};
