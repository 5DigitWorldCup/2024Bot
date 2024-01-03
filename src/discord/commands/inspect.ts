import Command from "@discord/interfaces/Command";
import CONFIG from "config";
import { SlashCommandBuilder, ChatInputCommandInteraction, codeBlock, inlineCode } from "discord.js";
import { errorMessage, successEmbed } from "@discord/util/Replies";
import type { KeyParam } from "@api/ApiWorker";
import ExtendedClient from "@discord/ExtendedClient";

export default <Command>{
  data: new SlashCommandBuilder()
    .setName("inspect")
    .setDescription("Inspect the database entry of a registrant")
    .setDefaultMemberPermissions(0)
    .addStringOption(o =>
      o.setName("search").setDescription("The osu / discord / user id to search for").setRequired(true),
    )
    .addStringOption(o =>
      o
        .setName("key")
        .setDescription("The type of id (osu / discord / id) being searched")
        .setRequired(true)
        .setChoices({ name: "discord", value: "discord" }, { name: "osu!", value: "osu" }, { name: "id", value: "id" }),
    )
    .addBooleanOption(o =>
      o.setName("full").setDescription("Whether to return the full entry or truncated. Defaults to true"),
    ),
  async execute(interaction: ChatInputCommandInteraction, client: ExtendedClient): Promise<void> {
    if (!CONFIG.Organizer.Whitelist.includes(interaction.user.id)) {
      this.logger.warn(`User missing permission [Command: ${this.data.name} | User: ${interaction.user.tag}]`);
      await interaction.reply(errorMessage("You do not have permission to use this command!"));
      return;
    }

    const search = interaction.options.getString("search", true);
    const key = interaction.options.getString("key", true) as KeyParam;
    const full = interaction.options.getBoolean("full", false) ?? true;

    await interaction.deferReply();
    const data = await client.apiWorker.getOneRegistrant(search, key, full);
    if (data) {
      await interaction.followUp({
        embeds: [
          successEmbed(codeBlock("json", JSON.stringify(data, null, "\t"))).setTitle(`Result for ${key} id ${search}:`),
        ],
      });
    } else {
      await interaction.followUp(
        errorMessage(`Unable to find the ${inlineCode(key)} user with id ${inlineCode(search)}`),
      );
    }
  },
};
