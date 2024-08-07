// Requirements and Variables
require("dotenv").config();
const keepAlive = require(`./server`);
const io = require("@pm2/io")
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const clientId = process.env["CLIENT_ID"];
const rest = new REST({ version: "9" }).setToken(process.env.BOT_TOKEN);
const mainGuildId = process.env["MAIN_GUILD_ID"];
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});
client.commands = new Collection();
client.cooldowns = new Collection();

// Ready Event
client.once("ready", async () => {
  try {
    console.log(`Bot is now online! | ${Date.now()}`);
    console.log(client)
    client.user.setStatus('idle');
    client.user.setActivity(``, { type: null });

    console.log(`Creating global commands...`);
    const getShopCommand = require("./commands/utility/getshop.js");
    const getStatsCommand = require("./commands/utility/getstats.js");
    const pingCommand = require("./commands/utility/ping.js");
    const commands = [getShopCommand, getStatsCommand, pingCommand];
    const data = commands.map((command) => ({
      ...command.data,
      integration_types: [0, 1],
      contexts: [0, 1, 2],
    }));
    console.log("Started refreshing application commands.");
    await rest.put(Routes.applicationCommands(clientId), { body: data });
    commands.forEach((command) => {
      client.commands.set(command.data.name, command);
      console.log(`Registered command: ${command.data.name}`);
    });
    console.log("Successfully reloaded application commands!");
    const devControlsCommand = require("./commands/dev/devcontrols.js");
    const playerDataCommand = require("./commands/dev/playerdata.js");
    console.log(`Started refreshing dev commands for guild: ${mainGuildId}.`);
    await rest.put(Routes.applicationGuildCommands(clientId, mainGuildId), {
      body: [
        devControlsCommand.data.toJSON(),
        playerDataCommand.data.toJSON(),
      ],
    });
    client.commands.set(devControlsCommand.data.name, devControlsCommand);
    console.log(`Registered command: ${devControlsCommand.data.name}`);
    client.commands.set(playerDataCommand.data.name, playerDataCommand);
    console.log(`Registered command: ${playerDataCommand.data.name}`);
    console.log(
      `Successfully reloaded dev commands for guild: ${mainGuildId}!`,
    );

  console.log("Starting tasks");
  console.log("Successfully started tasks!");

  client.user.setStatus('online');

  console.log(`Bot is ready! | ${Date.now()}`);
  } catch (error) {
    console.error(error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    const command = interaction.client.commands.get(interaction.commandName);

    const mainGuild = client.guilds.cache.get(mainGuildId);

    const member = await mainGuild.members.fetch(interaction.user.id);
    const isVerified = member && member.nickname; // If nickname isn't null, assume that Bloxlink verified the user

    if (!isVerified) {
      errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription(
          "<:Error:1225166842255904888> You must be in the official Before The Sunrise server and verified in order to use this command.",
        );

      const joinButton = new ButtonBuilder()
        .setLabel("Join The Server")
        .setURL(`https://discord.gg/${process.env.DISCORD_INVITE_CODE}`)
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder().addComponents(joinButton);

      return interaction.reply({
        embeds: [errorEmbed],
        components: [row],
        ephemeral: true,
      });
    }

    const requiredRoles = command.requiredRoles || [];
    let hasRequiredRole = false
    
    if (interaction.guildId === mainGuildId) {
      hasRequiredRole = interaction.member.roles.cache.some((role) =>
        requiredRoles.includes(role.id),
      );
    }

    if (requiredRoles.length !== 0 && !hasRequiredRole) {
      errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription(
          "<:Error:1225166842255904888> You don't have permission to run this command",
        );

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const { cooldowns } = interaction.client;

    if (!cooldowns.has(command.data.name)) {
      cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const defaultCooldownDuration = 3;
    const cooldownAmount =
      (command.cooldown ?? defaultCooldownDuration) * 1_000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime =
        timestamps.get(interaction.user.id) + cooldownAmount;

      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1_000);

        cooldownEmbed = new EmbedBuilder()
          .setColor(0x363940)
          .setTitle("Cooldown")
          .setDescription(
            "You can use this command again <t:" + expiredTimestamp + ":R>",
          );

        return interaction.reply({ embeds: [cooldownEmbed], ephemeral: true });
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`,
      );
      return;
    }

    let arguments = JSON.stringify(interaction.options);
    console.log(
      `Executing command: ${interaction.commandName}\nArguments: ${arguments}\nUser: ${interaction.user.tag} (${interaction.user.id})`,
    );

    const commandRuns = io.counter({
      name: `${interaction.commandName} Runs`
    });

    commandRuns.inc();

    await command.execute(client, interaction);
  } catch (error) {
    console.error(error);
    errorEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("Error")
      .setDescription(
        "<:Error:1225166842255904888> An error occurred while executing the command.",
      );
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
  }
});

process.on('SIGINT', function() {
  client.user.setStatus('idle');
})

// Bot Login
client.login(process.env.BOT_TOKEN);
console.log(`Logged into bot! | ` + Date.now());
keepAlive();
