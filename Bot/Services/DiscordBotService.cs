using Bot.Discord.Options;
using Discord;
using Discord.WebSocket;
using Microsoft.Extensions.Options;
using Bot.Internal.Extensions;
using Bot.Internal.Events;
using Bot.Discord.Handlers;

namespace Bot.Services
{
	public class DiscordBotService : IHostedService
	{
		private readonly DiscordSocketClient _client;
		private readonly IOptions<DiscordConfiguration> _discordConfig;
		private readonly ILogger<DiscordBotService> _logger;
		private readonly BotEvents _botEvents;
		private readonly InteractionHandler _interactionHandler;

		public DiscordBotService(IOptions<DiscordConfiguration> discordConfig, ILogger<DiscordBotService> logger,
			BotEvents botEvents, DiscordSocketClient client, InteractionHandler interactionHandler)
		{
			_client = client;
			_botEvents = botEvents;
			_discordConfig = discordConfig;
			_logger = logger;
			_interactionHandler = interactionHandler;
        }

		public async Task StartAsync(CancellationToken cancellationToken)
		{
            await _interactionHandler.InitCommands();

            _client.Log += LogMessage =>
			{
				_logger.Log(LogMessage.Severity.ToLogLevel(), LogMessage.Exception, LogMessage.Message);
				return Task.CompletedTask;
			};

			InitLogging();
			_botEvents.InitEvents();

			await _client.LoginAsync(TokenType.Bot, _discordConfig.Value.Token);
			await _client.StartAsync();
		}

		public async Task StopAsync(CancellationToken cancellationToken)
		{
			await _client.StopAsync();
			try
			{
				_client.Dispose();
			}
			catch (Exception ex)
			{
				_logger.Log(LogLevel.Error, ex, "Failed to dispose Client");
			}
		}

		#region Logging
		private void InitLogging()
		{
			_client.Ready += () =>
			{
				_logger.Log(LogLevel.Information, $"Client logged in as {_client.CurrentUser.Username}#{_client.CurrentUser.Discriminator}");

				return Task.CompletedTask;
			};

			_client.LoggedOut += () =>
			{
				_logger.Log(LogLevel.Debug, "Client logged out");

				return Task.CompletedTask;
			};

			_client.Disconnected += (ex) =>
			{
				_logger.Log(LogLevel.Error, ex, "Client disconnected from gateway");

				return Task.CompletedTask;
			};

			_client.JoinedGuild += (guild) =>
			{
				_logger.Log(LogLevel.Information, $"Joined Guild [Name: {guild.Name} | ID: {guild.Id}]");

				return Task.CompletedTask;
			};

			_client.LeftGuild += (guild) =>
			{
				_logger.Log(LogLevel.Information, $"Left Guild [Name {guild.Name} | ID: {guild.Id}]");

				return Task.CompletedTask;
			};

			_client.UserUpdated += (oldUser, newUser) =>
			{
				_logger.Log(LogLevel.Information,
					$"User Updated [Name: {oldUser.Username} | New Name: {newUser.Username} | ID: {oldUser.Id}]");

				return Task.CompletedTask;
			};
		}
	}
}
        #endregion