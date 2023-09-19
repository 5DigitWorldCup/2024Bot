using Discord.Interactions;

namespace Bot.Discord.Modules
{
    public class TestModule : InteractionModuleBase<SocketInteractionContext>
    {
        [SlashCommand(name: "ping", description: "Gives latency measurements.")]
        public async Task PingCommandAsync()
            => await RespondAsync(text: $":ping_pong:\nClient latency: {Context.Client.Latency}ms", ephemeral: true);
    }
}
