const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

const pingCommand = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Sends latency info");

module.exports = {
  cooldown: 10,
  data: pingCommand,
  async execute(client, interaction) {
    console.log(`Getting response latency...`);
    const responseLatency = Date.now() - interaction.createdTimestamp;

    // Acknowledge the interaction
    await interaction.deferReply();

    console.log(`Getting discord API latency...`);
    const discordAPILatency = Math.round(client.ws.ping);

    const playerDataApiKey = process.env["ROBLOX_PLAYERDATA_KEY"];
    const experienceId = process.env["ROBLOX_UNIVERSE_ID"];

    console.log(`Getting roblox datastore API latency...`);
    const headers = {
      "x-api-key": `${playerDataApiKey}`,
    };

    const params = {
      datastoreName: "PlayerData",
      entryKey: "-1",
    };

    const startTime = Date.now();
    let robloxAPILatency = null;
    let robloxAPILatencyText = "";

    try {
      await axios.get(
        `https://apis.roblox.com/datastores/v1/universes/${experienceId}/standard-datastores/datastore/entries/entry`,
        { headers, params },
      );

      const endTime = Date.now();
      robloxAPILatency = endTime - startTime;
    } catch (error) {
      console.error(error);
      robloxAPILatencyText = "<:Error:1225166842255904888> `Status error: " + error.response.status + "`";
    }

    const responseLatencyText = `<:Check:1225166781455532123> ${responseLatency}ms`;
    const discordAPILatencyText = `<:Check:1225166781455532123> ${discordAPILatency}ms`;
    if (robloxAPILatency !== null) {
      robloxAPILatencyText = `<:Check:1225166781455532123> ${robloxAPILatency}ms`;
    }

    console.log(`Returning latency info...`);
    const latencyEmbed = new EmbedBuilder()
      .setColor(0x3c0064)
      .setTitle("Pong!")
      .setDescription(null)
      .addFields(
        { name: "Response latency", value: responseLatencyText },
        { name: "Discord API latency", value: discordAPILatencyText },
        { name: "Roblox datastore API latency", value: robloxAPILatencyText },
      )
      .setTimestamp(interaction.createdTimestamp);

    // Send the response
    await interaction.editReply({ embeds: [latencyEmbed] });

    console.log(`Success! "ping" command request completed.`);
  },
};
