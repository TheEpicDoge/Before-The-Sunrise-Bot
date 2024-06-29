const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

const gameDataApiKey = process.env["ROBLOX_GAMEDATA_KEY"];
const experienceId = process.env["ROBLOX_UNIVERSE_ID"];

const getShopCommand = new SlashCommandBuilder()
  .setName("getshop")
  .setDescription(`Gets the current shop discount items`);

module.exports = {
  cooldown: 10,
  data: getShopCommand,
  async execute(client, interaction) {
    // Acknowledge the interaction
    await interaction.deferReply();

    let activeDiscounts = {
      Main: [],
      Pass: [],
    };

    const items = {
      BananaPeel: {
        Name: "Banana Peel",
        Emoji: "<:BananaPeel:1225047158533918770>",
        ItemCost: 15,
        ItemDiscountCostMax: 13,
        ItemDiscountCostMin: 10,
      },
      Flare: {
        Name: "Flare",
        Emoji: "<:Flare:1256384739640737893>",
        ItemCost: 22,
        ItemDiscountCostMax: 19,
        ItemDiscountCostMin: 15,
      },
      MedKit: {
        Name: "Med Kit",
        Emoji: "<:MedKit:1256384741892952204>",
        ItemCost: 24,
        ItemDiscountCostMax: 21,
        ItemDiscountCostMin: 16,
      },
      ProteinShake: {
        Name: "Protein Shake",
        Emoji: "<:ProteinShake:1256384743000506458>",
        ItemCost: 10,
        ItemDiscountCostMax: 9,
        ItemDiscountCostMin: 7,
      },
      StrongFlashlight: {
        Name: "Strong Flashlight",
        Emoji: "<:StrongFlashlight:1256384745395327006>",
        ItemCost: 48,
        ItemDiscountCostMax: 43,
        ItemDiscountCostMin: 37,
      },
      SprayBottle: {
        Name: "Spray Bottle",
        Emoji: "<:SprayBottle:1256384744095219732>",
        ItemCost: 21,
        ItemDiscountCostMax: 20,
        ItemDiscountCostMin: 18,
      },
      HandheldRadio: {
        Name: "HandheldRadio",
        Emoji: "<:HandheldRadio:1256384740697706547>",
        ItemCost: 24,
        ItemDiscountCostMax: 18,
        ItemDiscountCostMin: 15,
      },
    };

    const currentDate = new Date();
    const year = currentDate.getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 0));
    const diff = currentDate - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    const yday = Math.floor(diff / oneDay);
    const hour = currentDate.getUTCHours();
    const randomSeed = (year + 1) * (yday + 1) * (hour + 1);
    console.log(`Checking shop discounts from seed: ${randomSeed}`);

    try {
      console.log(`Getting stored shop data`);
      const headers = {
        "x-api-key": `${gameDataApiKey}`,
      };

      const params = {
        datastoreName: "GameData",
        entryKey: "MaxwellShop",
      };
      shopData = await axios.get(
        `https://apis.roblox.com/datastores/v1/universes/${experienceId}/standard-datastores/datastore/entries/entry`,
        { headers, params },
      );
      activeDiscounts = shopData.data.Discounts[randomSeed.toString()];
    } catch (error) {
      console.error(error);
      discountEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription("`Status error: " + error.response.status + "` <:Error:1225166842255904888>")
        .setAuthor({ name: displayName, iconURL: null, url: null });
      shopData = `error`;
    }

    if (shopData !== `error`) {
      console.log(`Returning shop data`);
      currentDate.setMinutes(0);
      currentDate.setSeconds(0);
      currentDate.setHours(currentDate.getHours() + 1);
      const nextHourTimestamp = Math.floor(currentDate.getTime() / 1000);
      if (activeDiscounts !== undefined) {
        discountEmbed = new EmbedBuilder()
          .setColor(0x000000)
          .setTitle("Maxwell's Shop Discounts")
          .setDescription(`New discounts <t:${nextHourTimestamp}:R>.`)
          .addFields(
            {
              name: "Main Discount:",
              value: `> ${items[activeDiscounts.Main[0].Item].Emoji} **${
                items[activeDiscounts.Main[0].Item].Name
              }**: __${activeDiscounts.Main[0].Percent}% OFF__ *(${
                activeDiscounts.Main[0].DiscountPrice
              } Dabloons)*\n`,
            },
            {
              name: "Gamepass Discount:",
              value: `> ${items[activeDiscounts.Pass[0].Item].Emoji} **${
                items[activeDiscounts.Pass[0].Item].Name
              }**: __${activeDiscounts.Pass[0].Percent}% OFF__ *(${
                activeDiscounts.Pass[0].DiscountPrice
              } Dabloons)*\n> ${items[activeDiscounts.Pass[1].Item].Emoji} **${
                items[activeDiscounts.Pass[1].Item].Name
              }**: __${activeDiscounts.Pass[1].Percent}% OFF__ *(${
                activeDiscounts.Pass[1].DiscountPrice
              } Dabloons)*\n[Get gamepass](https://www.roblox.com/game-pass/187162118/)`,
            },
          )
          .setTimestamp()
          .setFooter({ text: `Maxwell's Shop` });
      } else {
        discountEmbed = new EmbedBuilder()
          .setColor(0x000000)
          .setTitle("Maxwell's Shop Discounts")
          .setDescription(`New discounts <t:${nextHourTimestamp}:R>.`)
          .addFields({
            name: "Uh oh!",
            value: `It seems that nobody has played the game yet today.\nI'm unable to get the current discounts.`,
          })
          .setTimestamp()
          .setFooter({ text: `Maxwell's Shop` });
      }
    }
    // Send the response
    await interaction.editReply({ embeds: [discountEmbed] });

    console.log(`Success! "getshop" command request completed.`);
  },
};
