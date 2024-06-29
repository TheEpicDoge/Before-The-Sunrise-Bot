const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

const getStatsCommand = new SlashCommandBuilder()
  .setName("getstats")
  .setDescription(`Gets the stats of a public player's profile in-game`)
  .addStringOption((option) =>
    option
      .setName("username")
      .setDescription("The roblox username of the player to get the stats of")
      .setRequired(true),
  );

function getLevel(xp) {
  let XPBase = 10;
  let XPExponent = 1.11;

  let level = 1;
  let minimumXP = XPBase * XPExponent ** (level - 1) * level;
  while (xp >= minimumXP) {
    level = level + 1;
    minimumXP = XPBase * XPExponent ** (level - 1) * level;
  }
  return level - 1;
}

module.exports = {
  cooldown: 20,
  data: getStatsCommand,
  async execute(client, interaction) {
    // Acknowledge the interaction
    await interaction.deferReply();

    let username = "";
    let displayName = "";
    let userId = -1;
    let imageUrl = "";
    let playerData = {};

    const playerDataApiKey = process.env["ROBLOX_PLAYERDATA_KEY"];
    const settingsApiKey = process.env["ROBLOX_PLAYERSETTINGS_KEY"];
    const experienceId = process.env["ROBLOX_UNIVERSE_ID"];

    username = interaction.options.getString("username");

    try {
      console.log(`Getting player info`);

      const response = await axios.post(
        "https://users.roblox.com/v1/usernames/users",
        {
          usernames: [username],
          excludeBannedUsers: true,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.data.length === 0) {
        const statsEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Error")
          .setDescription("<:Error:1225166842255904888> Player could not be found");
        await interaction.editReply({ embeds: [statsEmbed] });
        console.log(`Player not found`);
        return;
      }

      userId = response.data.data[0].id;
      displayName = response.data.data[0].displayName;

      console.log(`Roblox User ID: ` + userId);
    } catch (error) {
      console.error(error);
      const statsEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription("<:Error:1225166842255904888> `Status error: " + error.response.status + "`");
      await interaction.editReply({ embeds: [statsEmbed] });
      console.log(`Error getting player info`);
      return;
    }

    try {
      console.log(`Retrieving player thumbnail`);

      const response = await axios.get(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=png`,
      );

      imageUrl = response.data.data[0].imageUrl;
    } catch (error) {
      console.error(error);
    }

    try {
      console.log(`Getting playerData`);

      let headers = {
        "x-api-key": `${playerDataApiKey}`,
      };

      let params = {
        datastoreName: "PlayerData",
        entryKey: userId,
      };

      let response = await axios.get(
        `https://apis.roblox.com/datastores/v1/universes/${experienceId}/standard-datastores/datastore/entries/entry`,
        { headers, params },
      );

      playerData = response.data;

      headers = {
        "x-api-key": `${settingsApiKey}`,
      };

      params = {
        datastoreName: "PlayerSettingsData",
        entryKey: userId,
      };

      response = await axios.get(
        `https://apis.roblox.com/datastores/v1/universes/${experienceId}/standard-datastores/datastore/entries/entry`,
        { headers, params },
      );

      if (response.data.VisibleProfile === false) {
        const statsEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Error")
          .setDescription(
            "<:Error:1225166842255904888> Either this player has not played the game yet, or they have requested to keep their profile hidden",
          );
        await interaction.editReply({ embeds: [statsEmbed] });
        console.log(`Player profile hidden`);
        return;
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 404) {
        const statsEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Error")
          .setDescription(
            "<:Error:1225166842255904888> Either this player has not played the game yet, or they have requested to keep their profile hidden",
          );
        await interaction.editReply({ embeds: [statsEmbed] });
        console.log(`Player profile hidden or not found`);
        return;
      }
      const statsEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription("<:Error:1225166842255904888> `Status error: " + error.response.status + "`");
      await interaction.editReply({ embeds: [statsEmbed] });
      console.log(`Error getting player data`);
      return;
    }

    if (imageUrl !== "") {
      if (playerData !== `error` && playerData !== `hidden`) {
        console.log(`Returning stats info`);
        const level = getLevel(playerData.Resources.XP);

        const statisticsString = Object.keys(playerData.Statistics)
          .sort()
          .map((key) => `**${key}:** ${playerData.Statistics[key]}`)
          .join("\n");

        const permUpgradesEquippedString =
          playerData.PermUpgrades.Equipped.sort()
            .map((value) => `- ${value}`)
            .join("\n");

        const permUpgradesUnequippedString =
          playerData.PermUpgrades.Unequipped.sort()
            .map((value) => `- ${value}`)
            .join("\n");

        const statsEmbed = new EmbedBuilder()
          .setColor(0xd5733d)
          .setTitle(`${displayName}'s Stats`)
          .setDescription(`Stats of ${displayName}'s profile in-game`)
          .addFields(
            {
              name: "Resources:",
              value: `>>> **Level:** ${level} *(${playerData.Resources.XP} xp)*\n**Dabloons:** ${playerData.Resources.Dabloons}\n**Keys:** ${playerData.Resources.Keys}\n`,
              inline: false,
            },
            {
              name: "Customizations:",
              value: `>>> **Equipped:**\n${permUpgradesEquippedString}\n**Unequipped:**\n${permUpgradesUnequippedString}`,
              inline: false,
            },
            {
              name: "Statistics:",
              value: `>>> ${statisticsString}`,
              inline: false,
            },
          )
          .setTimestamp()
          .setFooter({ text: `Stats` })
          .setThumbnail(imageUrl);

        await interaction.editReply({ embeds: [statsEmbed] });
        console.log(`Success! "getstats" command request completed.`);
      }
    } else {
      const statsEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription(`<:Error:1225166842255904888> Could not retrieve player profile`);
      await interaction.editReply({ embeds: [statsEmbed] });
      console.log(`Error: Could not retrieve player profile`);
    }
  },
};
