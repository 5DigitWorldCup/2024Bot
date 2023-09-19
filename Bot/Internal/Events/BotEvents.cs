using Bot.Discord.Handlers;
using Discord.WebSocket;

namespace Bot.Internal.Events
{
    public class BotEvents
    {
        private readonly ILogger<BotEvents> _logger;
        private readonly DiscordSocketClient _client;
        private readonly InteractionHandler _interactionHandler;
        private readonly IWebHostEnvironment _env;

        public BotEvents(ILogger<BotEvents> logger, DiscordSocketClient client, InteractionHandler interactionHandler, IWebHostEnvironment env)
        {
            _logger = logger;
            _client = client;
            _interactionHandler = interactionHandler;
            _env = env;
        }

        public void InitEvents()
        {
            _logger.LogInformation("Events Initialized");

            _client.Ready += OnReady;
        }

        private async Task OnReady()
        {
            await _interactionHandler.RegisterCommandsAsync(!_env.IsDevelopment());
        }
    }
}
