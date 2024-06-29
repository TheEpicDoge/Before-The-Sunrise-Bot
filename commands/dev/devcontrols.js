const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const axios = require("axios");

const devControlsCommand = new SlashCommandBuilder()
  .setName("devcontrols")
  .setDescription(`Sends a command to the server`)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("updategame")
      .setDescription("Runs a soft shutdown to update the game"),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("resetserver")
      .setDescription(
        "Kick everyone in the current server without saving TransferData",
      )
      .addStringOption((option) =>
        option
          .setName("serverid")
          .setDescription(
            "The jobId of the server to run the command on (can not run on all servers)",
          )
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("kickplayer")
      .setDescription(
        "Kicks a player from a server without saving TransferData",
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player to run the command on")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("reason")
          .setDescription("Reason to kick the player")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("setday")
      .setDescription("Forces the time to day")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription(
            'Username of a player in the server to run the command on (use "-1" for all servers)',
          )
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("setnight")
      .setDescription("Forces the time to night")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription(
            'Username of a player in the server to run the command on (use "-1" for all servers)',
          )
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("giveflare")
      .setDescription(
        "Gives the player the Flare item (user must be currently in-game)",
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("givebananapeel")
      .setDescription(
        "Gives the player the Banana Peel item (user must be currently in-game)",
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("givestrongflashlight")
      .setDescription(
        "Gives the player the StrongFlashlight item (user must be currently in-game)",
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("giveproteinshake")
      .setDescription(
        "Gives the player the Protein Shake item (user must be currently in-game)",
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("givemedkit")
      .setDescription(
        "Gives the player the Med Kit item (user must be currently in-game)",
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("givespraybottle")
      .setDescription(
        "Gives the player the Spray Bottle item (user must be currently in-game)",
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("givehandheldradio")
      .setDescription(
        "Gives the player the Handheld Radio item (user must be currently in-game)",
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("showmap")
      .setDescription("Shows the debug map for the player")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("hidemap")
      .setDescription("Hides the debug map for the player")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Username of the player run the command on")
          .setRequired(true),
      ),
  );

module.exports = {
  cooldown: 5,
  requiredRoles: [
    "1224896193339854958", // Replace with actual role IDs
  ],
  data: devControlsCommand,
  async execute(client, interaction) {
    await interaction.deferReply();

    const devControlsApiKey = process.env.ROBLOX_DEVCONTROLS_KEY;
    const experienceId = process.env.ROBLOX_UNIVERSE_ID;

    const topicMapping = {
      updategame: "UpdateGame",
      resetserver: "ResetServer",
      kickplayer: "KickPlayer",
      setday: "SetDay",
      setnight: "SetNight",
      giveflare: "GiveFlare",
      givebananapeel: "GiveBananaPeel",
      givestrongflashlight: "GiveStrongFlashlight",
      giveproteinshake: "GiveProteinShake",
      givemedkit: "GiveMedKit",
      givespraybottle: "GiveSprayBottle",
      givehandheldradio: "GiveHandheldRadio",
      showmap: "ShowMap",
      hidemap: "HideMap",
    };

    const subcommand = interaction.options.getSubcommand();
    const topic = topicMapping[subcommand];
    const message = {
      Data: JSON.stringify(interaction.options),
    };

    try {
      await axios.post(
        `https://apis.roblox.com/messaging-service/v1/universes/${experienceId}/topics/${topic}`,
        message,
        {
          headers: {
            "x-api-key": devControlsApiKey,
          },
        }
      );

      const embed = new MessageEmbed()
        .setColor("#55ff00")
        .setTitle("Success")
        .setDescription(`Command "${subcommand}" successfully executed.`);
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error executing command:", error);
      
      const embed = new MessageEmbed()
        .setColor("#ff0000")
        .setTitle("Error")
        .setDescription("An error occurred while executing the command.");
      
      await interaction.editReply({ embeds: [embed] });
    }
  },
};
