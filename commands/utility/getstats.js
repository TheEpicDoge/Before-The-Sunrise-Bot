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

    username = [interaction.options.getString("username")];

    try {
      console.log(`Getting player info`);

      response = await axios.post(
        "https://users.roblox.com/v1/usernames/users",
        {
          usernames: username,
          excludeBannedUsers: true,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      userId = response.data.data[0].id;
      displayName = response.data.data[0].displayName;

      if (userId === null) {
        statsEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Error")
          .setDescription("<:Error:1225166842255904888> Player could not be found");
        playerData = `error`;
      } else {
        console.log(`Roblox User ID: ` + userId);
      }
    } catch (error) {
      console.error(error);
      statsEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription("<:Error:1225166842255904888> `Status error: " + error.response.status + "`");
      playerData = `error`;
    }

    if (playerData !== `error`) {
      try {
        console.log(`Retreving player thumbnail`);
        response = await axios.get(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=png`,
        );
        imageUrl = response.data.data[0].imageUrl;
      } catch (error) {
        console.error(error);
      }

      try {
        console.log(`Getting playerData`);

        headers = {
          "x-api-key": `${playerDataApiKey}`,
        };

        params = {
          datastoreName: "PlayerData",
          entryKey: userId,
        };
        response = await axios.get(
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
          statsEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Error")
            .setDescription(
              "<:Error:1225166842255904888> Either this player has not played the game yet, or they have requested to keep their profile hidden",
            );
          playerData = `hidden`;
        }
      } catch (error) {
        console.error(error);
        if (error.response.status === 404) {
          statsEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Error")
            .setDescription(
              "<:Error:1225166842255904888> Either this player has not played the game yet, or they have requested to keep their profile hidden",
            );
        } else {
          statsEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Error")
            .setDescription("<:Error:1225166842255904888> `Status error: " + error.response.status + "`");
        }
        playerData = `error`;
      }

      if (imageUrl !== "") {
        if (playerData !== `error` && playerData !== `hidden`) {
          console.log(`Returning stats info`);
          const level = getLevel(playerData.Resources.XP);

          let statisticsString = Object.keys(playerData.Statistics)
            .sort()
            .map((key) => `**${key}:** ${playerData.Statistics[key]}`)
            .join("\n");

          let permUpgradesEquippedString =
            playerData.PermUpgrades.Equipped.sort()
              .map((value) => `- ${value}`)
              .join("\n");

          let permUpgradesUnequippedString =
            playerData.PermUpgrades.Unequipped.sort()
              .map((value) => `- ${value}`)
              .join("\n");

          statsEmbed = new EmbedBuilder()
            .setColor(0xd5733d)
            .setTitle(`${username}'s Stats`)
            .setDescription(`Stats of ${username}'s profile in-game`)
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
        }
      } else {
        statsEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Error")
          .setDescription(`<:Error:1225166842255904888> Could not retrieve player profile`);
      }
    }

    // Send the response
    await interaction.editReply({ embeds: [statsEmbed] });

    console.log(`Success! "getstats" command request completed.`);
  },
};
