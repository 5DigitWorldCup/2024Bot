import ApiWorker from "@api/ApiWorker";
import Command from "@discord/interfaces/Command";
import { errorMessage, successMessage } from "@discord/util/Replies";
import CONFIG from "config";
import { ChatInputCommandInteraction, inlineCode } from "discord.js";

export default <Partial<Command>>{
  async execute(interaction: ChatInputCommandInteraction) {
    // Gather members with organizer role
    const organizers = interaction.guild!.members.cache.filter(member => member.roles.cache.has(CONFIG.Organizer.Role));
    // Get array of ids who are already organizers
    const registrants = await ApiWorker.getAllRegistrants();
    if (!registrants) {
      interaction.followUp(errorMessage("There was an error communicating with the api!"));
      return;
    }
    const alreadyOrganizerIds = registrants.filter(e => e.is_organizer).map(e => e.discord_user_id);
    const toSync = organizers.filter((_, id) => !alreadyOrganizerIds.includes(id));
    let count = 0;
    // Sync with api
    for (const [id] of toSync) {
      const apiOk = await ApiWorker.updateOrganizer(id, true);
      if (apiOk) count++;
    }
    await interaction.followUp(
      successMessage(`Successfully synced ${inlineCode(`${count} of ${toSync.size}`)} organizers`),
    );
  },
};
