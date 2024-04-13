const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const crypto = require("crypto");

const getStatsCommand = new SlashCommandBuilder()
  .setName("playerdata")
  .setDescription(`Returns a JSON file of a player's PlayerData in-game`)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("read")
      .setDescription("Get a JSON file of a player's PlayerData")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("The username of the player to get the PlayerData of")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("write")
      .setDescription(
        "Overwrites a player's PlayerData (Player must be offline to prevent data loss)",
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("The username of the player to get the PlayerData of")
          .setRequired(true),
      )
      .addAttachmentOption((option) =>
        option
          .setName("data")
          .setDescription(
            "JSON file of the data (use the /playerdata read command to get the format)",
          )
          .setRequired(true),
      ),
  );

module.exports = {
  cooldown: 20,
  requiredRoles: [
    "1224896193339854958",
    "1224896373628076033",
  ],
  data: getStatsCommand,
  async execute(client, interaction) {
    // Acknowledge the interaction
    await interaction.deferReply();

    let username = "";
    let userId = -1;
    let playerData = {};
    let attachment = null;
    let logEmbed = null;

    const playerDataApiKey = process.env["ROBLOX_PLAYERDATA_KEY"];
    const experienceId = process.env["ROBLOX_UNIVERSE_ID"];

    const logChannelId = process.env["LOG_CHANNEL_ID"];

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
        playerDataEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Error <:Error:1225166842255904888>")
          .setDescription("Player could not be found");
        playerData = `error`;
      } else {
        console.log(`Roblox User ID: ` + userId);
      }
    } catch (error) {
      console.error(error);
      playerDataEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription("`Status error: " + error.response.status + "` <:Error:1225166842255904888>");
      playerData = `error`;
    }

    if (playerData !== `error`) {
      try {
        if (interaction.options.getSubcommand() === "read") {
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

          console.log("Caching PlayerData");
          fileName = `playerData_${userId}.json`;
          filePath = `./cache/playerData/${fileName}`;
          fs.writeFileSync(filePath, JSON.stringify(playerData));

          attachment = new AttachmentBuilder(filePath);

          console.log(`Returning PlayerData json`);

          playerDataEmbed = new EmbedBuilder()
            .setColor(0x363940)
            .setTitle(`${username}'s PlayerData`)
            .setDescription(
              `The JSON file containing ${username}'s (${userId}) PlayerData was attached to this message`,
            );
        }
        if (interaction.options.getSubcommand() === "write") {
          console.log(`Writing to PlayerData`);

          attachedData = interaction.options.getAttachment("data");
          
          if (
            interaction.options.getAttachment("data").contentType ===
            "application/json; charset=utf-8"
          ) {
            const attachmentURL = interaction.options.getAttachment("data").url;
            response = await axios.get(attachmentURL);
            attachedJSON = response.data;
            
            JSONValue = JSON.stringify(attachedJSON);

            const convert = crypto
              .createHash("md5")
              .update(JSONValue)
              .digest("base64");

            headers = {
              "x-api-key": `${playerDataApiKey}`,
              "content-md5": `${convert}`,
              "content-type": "application/json",
            };

            params = {
              datastoreName: "PlayerData",
              entryKey: userId,
            };

            response = await axios.post(
              `https://apis.roblox.com/datastores/v1/universes/${experienceId}/standard-datastores/datastore/entries/entry`,
              JSONValue,
              { headers, params },
            );

            playerDataEmbed = new EmbedBuilder()
              .setColor(0x55ff00)
              .setTitle("Success")
              .setDescription(
                `${username}'s (${userId}) playerData has been overwritten`,
              );

            logEmbed = new EmbedBuilder()
              .setColor(0x00ff00)
              .setTitle("PlayerData updated")
              .setDescription(
                `${username}'s (${userId}) has been updated\nThe JSON file was attached to this message`,
              )
              .setFooter({
                text: `Executed by ${interaction.user.username} (${interaction.user.id})`,
              });
          } else {
            console.log("File given is not of type: json");
            playerDataEmbed = new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle("Error")
              .setDescription("File given is not of type: json");
          }
        }
      } catch (error) {
        console.error(error);
        if (error.response.status === 404) {
          playerDataEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Error <:Error:1225166842255904888>")
            .setDescription("This player does not have any PlayerData");
        } else {
          playerDataEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Error <:Error:1225166842255904888>")
            .setDescription("`Status error: " + error.response.status + "`");
        }
        playerData = `error`;
      }
    }

    // Send the response
    if (attachment) {
      await interaction.editReply({
        embeds: [playerDataEmbed],
        files: [attachment],
      });
      fs.unlinkSync(filePath);
    } else {
      await interaction.editReply({ embeds: [playerDataEmbed] });
    }

    // Send log message
    if (logEmbed) {
      const logChannel = client.channels.cache.get(logChannelId);
      if (attachedData) {
        logChannel.send({ embeds: [logEmbed], files: [attachedData.attachment] });
      } else {
        logChannel.send({ embeds: [logEmbed] });
      }
    }

    console.log(`Success! "playerdata" command request completed.`);
  },
};
