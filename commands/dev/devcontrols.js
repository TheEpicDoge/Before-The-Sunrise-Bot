const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

const devControlsCommand = new SlashCommandBuilder()
  .setName("devcontrols")
  .setDescription(`Sends a command to the server`)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("updategame")
      .setDescription("Runs a soft shutdown to update the game")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("resetserver")
      .setDescription(
        "Kick everyone in the current server without saving TransferData"
      )
      .addStringOption((option) =>
        option
          .setName("serverid")
          .setDescription(
            "The jobId of the server to run the command on (can not run on all servers)"
          )
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("kickplayer")
      .setDescription(
        "Kicks a player from a server without saving TransferData"
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player to run the command on")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("reason")
          .setDescription("Reason to kick the player")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("setday")
      .setDescription("Forces the time to day")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription(
            'Username of a player in the server to run the command on (use "-1" for all servers)'
          )
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("setnight")
      .setDescription("Forces the time to night")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription(
            'Username of a player in the server to run the command on (use "-1" for all servers)'
          )
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("giveflare")
      .setDescription(
        "Gives the player the Flare item (user must be currently in-game)"
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("givebananapeel")
      .setDescription(
        "Gives the player the Banana Peel item (user must be currently in-game)"
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("givestrongflashlight")
      .setDescription(
        "Gives the player the StrongFlashlight item (user must be currently in-game)"
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("giveproteinshake")
      .setDescription(
        "Gives the player the Protein Shake item (user must be currently in-game)"
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("givemedkit")
      .setDescription(
        "Gives the player the Med Kit item (user must be currently in-game)"
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("givespraybottle")
      .setDescription(
        "Gives the player the Spray Bottle item (user must be currently in-game)"
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("givehandheldradio")
      .setDescription(
        "Gives the player the Handheld Radio item (user must be currently in-game)"
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("showmap")
      .setDescription("Shows the debug map for the player")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("hidemap")
      .setDescription("Hides the debug map for the player")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true)
      )
  );

module.exports = {
  cooldown: 5,
  requiredRoles: ["1224896193339854958"],
  data: devControlsCommand,
  async execute(client, interaction) {
    // Acknowledge the interaction
    await interaction.deferReply();

    const devControlsApiKey = process.env["ROBLOX_DEVCONTROLS_KEY"];
    const experienceId = process.env["ROBLOX_UNIVERSE_ID"];

    const logChannelId = process.env["LOG_CHANNEL_ID"];

    let topic = "";
    let message = [];
    let successMessage = "";
    if (interaction.options.getSubcommand() === "updategame") {
      topic = "UpdateGame";
      message = ["-1"];
      successMessage = `Updated the game`;
    }
    if (interaction.options.getSubcommand() === "resetserver") {
      topic = "ResetServer";
      message = [
        interaction.options.getString("serverid"),
        interaction.options.getString("reason"),
      ];
      successMessage = `Kicked everyone from ${interaction.options.getString(
        "serverid"
      )}`;
    }
    if (interaction.options.getSubcommand() === "kickplayer") {
      topic = "KickPlayer";
      message = [
        interaction.options.getString("username"),
        interaction.options.getString("reason"),
      ];
      successMessage = `Kicked ${interaction.options.getString(
        "username"
      )} from the server`;
    }
    if (interaction.options.getSubcommand() === "setday") {
      topic = "SetDay";
      message = [interaction.options.getString("username")];
      successMessage = `Set time to day in the server with ${interaction.options.getString(
        "username"
      )}`;
    }
    if (interaction.options.getSubcommand() === "setnight") {
      topic = "SetNight";
      message = [interaction.options.getString("username")];
      successMessage = `Set time to night in the server with ${interaction.options.getString(
        "username"
      )}`;
    }
    if (interaction.options.getSubcommand() === "setplayervalue") {
      topic = "SetPlayerValue";
      message = [
        interaction.options.getString("username"),
        interaction.options.getString("valuename"),
        interaction.options.getInteger("amount"),
      ];
      successMessage = `Set playerValue "${interaction.options.getString(
        "valuename"
      )}" for ${interaction.options.getString(
        "username"
      )} to ${interaction.options.getInteger("amount")}`;
    }
    if (interaction.options.getSubcommand() === "giveflare") {
      topic = "GiveFlare";
      message = [interaction.options.getString("username")];
      successMessage = `Gave ${interaction.options.getString(
        "username"
      )} the Flare item`;
    }
    if (interaction.options.getSubcommand() === "givebananapeel") {
      topic = "GiveBananaPeel";
      message = [interaction.options.getString("username")];
      successMessage = `Gave ${interaction.options.getString(
        "username"
      )} the Banana Peel item`;
    }
    if (interaction.options.getSubcommand() === "givestrongflashlight") {
      topic = "GiveStrongFlashlight";
      message = [interaction.options.getString("username")];
      successMessage = `Gave ${interaction.options.getString(
        "username"
      )} the Strong Flashlight item`;
    }
    if (interaction.options.getSubcommand() === "giveproteinshake") {
      topic = "GiveProteinShake";
      message = [interaction.options.getString("username")];
      successMessage = `Gave ${interaction.options.getString(
        "username"
      )} the Protein Shake item`;
    }
    if (interaction.options.getSubcommand() === "givemedkit") {
      topic = "GiveMedKit";
      message = [interaction.options.getString("username")];
      successMessage = `Gave ${interaction.options.getString(
        "username"
      )} the Med Kit item`;
    }
    if (interaction.options.getSubcommand() === "givespraybottle") {
      topic = "GiveSprayBottle";
      message = [interaction.options.getString("username")];
      successMessage = `Gave ${interaction.options.getString(
        "username"
      )} the Spray Bottle item`;
    }
    if (interaction.options.getSubcommand() === "givehandheldradio") {
      topic = "GiveHandheldRadio";
      message = [interaction.options.getString("username")];
      successMessage = `Gave ${interaction.options.getString(
        "username"
      )} the Handheld Radio item`;
    }
    if (interaction.options.getSubcommand() === "showmap") {
      topic = "ShowMap";
      message = [interaction.options.getString("username")];
      successMessage = `Enabled the debug map for ${interaction.options.getString(
        "username"
      )}`;
    }
    if (interaction.options.getSubcommand() === "hidemap") {
      topic = "HideMap";
      message = [interaction.options.getString("username")];
      successMessage = `Disabled the debug map for ${interaction.options.getString(
        "username"
      )}`;
    }

    const messageString = JSON.stringify(message);

    try {
      response = await axios.post(
        `https://apis.roblox.com/messaging-service/v1/universes/${experienceId}/topics/${topic}`,
        {
          message: messageString,
        },
        {
          headers: {
            "x-api-key": `${devControlsApiKey}`,
          },
        }
      );
      devControlsEmbed = new EmbedBuilder()
        .setColor(0x55ff00)
        .setTitle("Success")
        .setDescription(successMessage);
    } catch (error) {
      console.log(error);
      devControlsEmbed = new EmbedBuilder()
        .setColor(0x55ff00)
        .setTitle("Error")
        .setDescription("`Status error: " + error.response.status + "`");
    }

    if (interaction.options.getSubcommand() === "updategame") {
      const timeLeft = Math.floor(Date.now() / 1000) + 15;

      devControlsEmbed = new EmbedBuilder()
        .setColor(0x55ff00)
        .setTitle("Success")
        .setDescription(`Updating game <t:${timeLeft}:R>`);
    }

    // Send the response
    await interaction.editReply({ embeds: [devControlsEmbed] });

    console.log(`Success! "devcontrols" command request completed.`);
  },
};
