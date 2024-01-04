import ApiWorker from "@api/ApiWorker";
import Command from "@discord/interfaces/Command";
import { successMessage } from "@discord/util/Replies";
import CONFIG from "config";
import { ChatInputCommandInteraction, inlineCode } from "discord.js";
import ExtendedClient from "@discord/ExtendedClient";

export default <Partial<Command>>{
  async execute(interaction: ChatInputCommandInteraction) {
    // Gather members with organizer role
    const client = interaction.client as ExtendedClient;
    const organizers = interaction
      .guild!.members.cache.filter(member => member.roles.cache.has(CONFIG.Organizer.Role))
      .map(e => e.id);

    // Repopulate the cache with current data
    await client.apiWorker.populateCache();
    const alreadyOrganizerIds = client.apiWorker.registrantCache
      .filter(e => e.is_organizer)
      .map(e => e.discord_user_id);
    const toSync = organizers.filter(id => !alreadyOrganizerIds.includes(id));
    let count = 0;
    // Sync with api
    for (const id of toSync) {
      const apiOk = await ApiWorker.updateOrganizer(id, true);
      if (apiOk) count++;
    }
    await interaction.followUp(
      successMessage(`Successfully synced ${inlineCode(`${count} of ${toSync.length}`)} organizers`),
    );
  },
};
