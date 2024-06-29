const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const crypto = require("crypto");

const bansCommand = new SlashCommandBuilder()
  .setName("bans")
  .setDescription(`Controls the ban system`)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("timedban")
      .setDescription("Bans the player for the specified amount of time")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("reason")
          .setDescription("Reason to ban the player")
          .setRequired(true),
      )
      .addIntegerOption((option) =>
        option
          .setName("days")
          .setDescription("Days to ban the player")
          .setRequired(true),
      )
      .addIntegerOption((option) =>
        option
          .setName("hours")
          .setDescription("Hours to ban the player")
          .setRequired(true),
      )
      .addIntegerOption((option) =>
        option
          .setName("minutes")
          .setDescription("Minutes to ban the player")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("permban")
      .setDescription("Bans the player permanently")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("reason")
          .setDescription("Reason to ban the player")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("unban")
      .setDescription("Unbans the player manually")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("reason")
          .setDescription("Reason to unban the player")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("info")
      .setDescription("Gets info on a player's ban")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player")
          .setRequired(true),
      ),
  );

module.exports = {
  cooldown: 20,
  requiredRoles: [
    "1224896193339854958",
    "1224896373628076033",
  ],
  data: bansCommand,
  async execute(client, interaction) {
    // Acknowledge the interaction
    await interaction.deferReply();

    let username = "";
    let userId = -1;
    let banData = {};

    const banDataApiKey = process.env["ROBLOX_BANDATA_KEY"];
    const devControlsApiKey = process.env["ROBLOX_DEVCONTROLS_KEY"];
    const experienceId = process.env["ROBLOX_UNIVERSE_ID"];

    const logChannelId = process.env["LOG_CHANNEL_ID"];

    username = interaction.options.getString("username");

    try {
      console.log(`Getting player info`);

      response = await axios.post(
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
      userId = response.data.data[0].id;

      if (userId === null) {
        banEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Error")
          .setDescription("Player could not be found");
        banData = `error`;
      } else {
        console.log(`Roblox User ID: ` + userId);
      }
    } catch (error) {
      console.error(error);
      banEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription("`Status error: " + error.response?.status + "`");
      banData = `error`;
    }

    if (banData !== `error`) {
      try {
        if (interaction.options.getSubcommand() === "timedban") {
          const unixTime = Math.floor(Date.now() / 1000);
          const reason = interaction.options.getString("reason");
          const days = interaction.options.getInteger("days");
          const hours = interaction.options.getInteger("hours");
          const minutes = interaction.options.getInteger("minutes");
          console.log(
            `Banning player: ` +
              userId +
              ` with reason: ` +
              reason +
              ` for ` +
              days +
              ` days, ` +
              hours +
              ` hours, ` +
              minutes +
              ` minutes`,
          );
        
          if (
            unixTime + days * 86400 + hours * 3600 + minutes * 60 - unixTime >
            30
          ) {
            const JSONValue = JSON.stringify({
              BanMessage: reason,
              ExtraData: [unixTime + days * 86400 + hours * 3600 + minutes * 60, interaction.user.username],
              UnbanDate: unixTime + days * 86400 + hours * 3600 + minutes * 60,
              IsBanned: true,
            });
        
            const convert = crypto
              .createHash("md5")
              .update(JSONValue)
              .digest("base64");
        
            const headers = {
              "x-api-key": `${banDataApiKey}`,
              "content-md5": `${convert}`,
              "content-type": "application/json",
            };
        
            const params = {
              datastoreName: "BanData",
              entryKey: userId,
            };
        
            response = await axios.post(
              `https://apis.roblox.com/datastores/v1/universes/${experienceId}/standard-datastores/datastore/entries/entry`,
              JSONValue,
              { headers, params },
            );
        
            const banDate = new Date(unixTime * 1000);
            const banDateString = banDate.toLocaleDateString("en-US", {
              year: "2-digit",
              month: "2-digit",
              day: "2-digit",
            });
        
            const topic = "KickPlayer";
            const message = [
              username,
              `Banned on ${banDateString} for reason: ${reason}; Ban expires in ${days}d ${hours}h ${minutes}m 0s`,
            ];
            const messageString = JSON.stringify(message);
        
            response = await axios.post(
              `https://apis.roblox.com/messaging-service/v1/universes/${experienceId}/topics/${topic}`,
              {
                message: messageString,
              },
              {
                headers: {
                  "x-api-key": `${devControlsApiKey}`,
                },
              },
            );
        
            banEmbed = new EmbedBuilder()
              .setColor(0x00ff00)
              .setTitle("Success")
              .setDescription(
                `${username} (${userId}) has been banned for the reason: ${reason}\nBan will expire in ${days} days, ${hours} hours, and ${minutes} minutes`,
              );
            logEmbed = new EmbedBuilder()
              .setColor(0x00ff00)
              .setTitle("Player banned")
              .setDescription(
                `${username} (${userId}) has been banned for the reason: ${reason}\nBan will expire in ${days} days, ${hours} hours, and ${minutes} minutes`,
              )
              .setFooter({
                text: `Executed by ${interaction.user.username} (${interaction.user.id})`,
              });
          } else {
            banEmbed = new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle("Error")
              .setDescription("Choose a valid time");
          }
        }        
        if (interaction.options.getSubcommand() === "permban") {
          const reason = interaction.options.getString("reason");

          console.log(
            `Permanently banning player: ` + userId + ` with reason: ` + reason,
          );
          const unixTime = Math.floor(Date.now() / 1000);
          const JSONValue = JSON.stringify({
            BanMessage: reason,
            ExtraData: [interaction.user.username],
            IsBanned: true,
          });

          const convert = crypto
            .createHash("md5")
            .update(JSONValue)
            .digest("base64");

          const headers = {
            "x-api-key": `${banDataApiKey}`,
            "content-md5": `${convert}`,
            "content-type": "application/json",
          };

          const params = {
            datastoreName: "BanData",
            entryKey: userId,
          };

          response = await axios.post(
            `https://apis.roblox.com/datastores/v1/universes/${experienceId}/standard-datastores/datastore/entries/entry`,
            JSONValue,
            { headers, params },
          );

          const topic = "KickPlayer";
          const message = [
            username,
            `Permabanned for reason: ${reason}`,
          ];
          const messageString = JSON.stringify(message);

          response = await axios.post(
            `https://apis.roblox.com/messaging-service/v1/universes/${experienceId}/topics/${topic}`,
            {
              message: messageString,
            },
            {
              headers: {
                "x-api-key": `${devControlsApiKey}`,
              },
            },
          );

          banEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("Success")
            .setDescription(`${username} (${userId}) has been permanently banned for the reason: ${reason}`);
          logEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("Player permanently banned")
            .setDescription(`${username} (${userId}) has been permanently banned for the reason: ${reason}`)
            .setFooter({
              text: `Executed by ${interaction.user.username} (${interaction.user.id})`,
            });
        }

        if (interaction.options.getSubcommand() === "unban") {
          const reason = interaction.options.getString("reason");

          console.log(
            `Unbanning player: ` + userId + ` with reason: ` + reason,
          );
          const JSONValue = JSON.stringify({
            BanMessage: reason,
            ExtraData: [interaction.user.username],
            IsBanned: false,
          });

          const convert = crypto
            .createHash("md5")
            .update(JSONValue)
            .digest("base64");

          const headers = {
            "x-api-key": `${banDataApiKey}`,
            "content-md5": `${convert}`,
            "content-type": "application/json",
          };

          const params = {
            datastoreName: "BanData",
            entryKey: userId,
          };

          response = await axios.post(
            `https://apis.roblox.com/datastores/v1/universes/${experienceId}/standard-datastores/datastore/entries/entry`,
            JSONValue,
            { headers, params },
          );

          const topic = "KickPlayer";
          const message = [
            username,
            `Permabanned for reason: ${reason}`,
          ];
          const messageString = JSON.stringify(message);

          response = await axios.post(
            `https://apis.roblox.com/messaging-service/v1/universes/${experienceId}/topics/${topic}`,
            {
              message: messageString,
            },
            {
              headers: {
                "x-api-key": `${devControlsApiKey}`,
              },
            },
          );

          banEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("Success")
            .setDescription(`${username} (${userId}) has been permanently banned for the reason: ${reason}`);
          logEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("Player permanently banned")
            .setDescription(`${username} (${userId}) has been permanently banned for the reason: ${reason}`)
            .setFooter({
              text: `Executed by ${interaction.user.username} (${interaction.user.id})`,
            });
        }

        if (interaction.options.getSubcommand() === "info") {
          const JSONValue = JSON.stringify({
            BanMessage: reason,
            ExtraData: [interaction.user.username],
            IsBanned: false,
          });

          const convert = crypto
            .createHash("md5")
            .update(JSONValue)
            .digest("base64");

          const headers = {
            "x-api-key": `${banDataApiKey}`,
            "content-md5": `${convert}`,
            "content-type": "application/json",
          };

          const params = {
            datastoreName: "BanData",
            entryKey: userId,
          };

          response = await axios.post(
            `https://apis.roblox.com/datastores/v1/universes/${experienceId}/standard-datastores/datastore/entries/entry`,
            JSONValue,
            { headers, params },
          );

          const topic = "KickPlayer";
          const message = [
            username,
            `Permabanned for reason: ${reason}`,
          ];
          const messageString = JSON.stringify(message);

          response = await axios.post(
            `https://apis.roblox.com/messaging-service/v1/universes/${experienceId}/topics/${topic}`,
            {
              message: messageString,
            },
            {
              headers: {
                "x-api-key": `${devControlsApiKey}`,
              },
            },
          );

          banEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("Success")
            .setDescription(`${username} (${userId}) has been permanently banned for the reason: ${reason}`);
          logEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("Player permanently banned")
            .setDescription(`${username} (${userId}) has been permanently banned for the reason: ${reason}`)
            .setFooter({
              text: `Executed by ${interaction.user.username} (${interaction.user.id})`,
            });
        }
      } catch (error) {
        console.error(error);
        banEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Error")
          .setDescription("`Status error: " + error.response?.status + "`");
      }
    }

    await interaction.editReply({
      embeds: [banEmbed],
    });

    if (logChannelId && logEmbed) {
      const channel = await client.channels.fetch(logChannelId);
      channel.send({ embeds: [logEmbed] });
    }
  },
};
