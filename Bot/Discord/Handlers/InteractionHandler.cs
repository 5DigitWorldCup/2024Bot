using Bot.Discord.Options;
using Discord;
using Discord.Commands;
using Discord.Interactions;
using Discord.WebSocket;
using Microsoft.Extensions.Options;
using System.Reflection;
using IResult = Discord.Interactions.IResult;

namespace Bot.Discord.Handlers
{
    public class InteractionHandler
    {
        private readonly DiscordSocketClient _client;
        private readonly InteractionService _interactionService;
        private readonly ILogger<InteractionHandler> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly IOptions<DiscordConfiguration> _discordConfig;

        public InteractionHandler(DiscordSocketClient client, InteractionService interactionService,
            ILogger<InteractionHandler> logger, IServiceProvider serviceProvider, IOptions<DiscordConfiguration> discordConfig)
        {
            _client = client;
            _interactionService = interactionService;
            _logger = logger;
            _serviceProvider = serviceProvider;
            _discordConfig = discordConfig;
        }

        public async Task InitCommands()
        {
            _interactionService.InteractionExecuted += InteractionExecutedAsync;

                try
                {
                    var moduleInfo = await _interactionService.AddModulesAsync(Assembly.GetEntryAssembly(), _serviceProvider);
                    _logger.LogInformation($"interactionService found {moduleInfo.Count()} modules to add");
                }
                catch (Exception ex)
                {
                    _logger.LogCritical($"Exception registering modules to interactionService: {ex.Message}", ex);
                }

            _interactionService.Log += LogMessage =>
            {
                if (LogMessage.Exception is CommandException cmdEx)
                {
                    _logger.Log(LogLevel.Error, cmdEx, $"Exception occured while executing Application Command. Message: {LogMessage.Message}");
                }
                else
                {
                    _logger.Log(LogLevel.Debug, $"Interaction service says: {LogMessage.Message}");
                }
                return Task.CompletedTask;
            };

            _client.InteractionCreated += HandleInteractionAsync;
        }

        // This feels sloppy af but if this doesnt happen (and there were changes to the commands) everything dies
        public async Task RegisterCommandsAsync(bool ToGlobal = false)
        {
            try
            {
                if (ToGlobal)
                {
                    var res = await _interactionService.RegisterCommandsGloballyAsync();
                    if (res != null)
                    {
                        _logger.LogInformation($"Successfully registered {res.Count} Application Commands globally");
                    }
                    else
                    {
                        throw new InvalidOperationException();
                    }
                }
                else
                {
                    var res = await _interactionService.RegisterCommandsToGuildAsync(_discordConfig.Value.GuildId);
                    if (res != null)
                    {
                        _logger.LogInformation($"Successfully registered {res.Count} Application Commands to guild");
                    }
                    else
                    {
                        throw new InvalidOperationException();
                    }
                }
            }  
            catch (Exception ex)
            {
                _logger.LogCritical("Failed to register Application Commands", ex);
            }
        }

        private async Task HandleInteractionAsync(SocketInteraction interaction)
        {
            try
            {
                if (interaction == null || interaction.User.IsBot) return;

                var ctx = new SocketInteractionContext(_client, interaction);
                await _interactionService.ExecuteCommandAsync(ctx, _serviceProvider);
            }
            catch (Exception ex)
            {
                _logger.Log(LogLevel.Error, ex,
                    $"Error handling interaction [User: {interaction.User} | Guild: {interaction.GuildId} | Channel: {interaction.Channel} | Id: {interaction.Id}]");
                if (!interaction.HasResponded)
                {
                    await interaction.RespondAsync("An error occured handling this interaction");
                }
                else
                {
                    await interaction.FollowupAsync("An error occured handling this interaction");
                }
            }
        }

        private Task InteractionExecutedAsync(ICommandInfo info, IInteractionContext context, IResult result)
        {
            // Command post-execution would live here
            return Task.CompletedTask;
        }
    }
}
