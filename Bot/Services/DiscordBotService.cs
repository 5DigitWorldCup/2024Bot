using Bot.Discord.Options;
using Discord;
using Discord.WebSocket;
using Microsoft.Extensions.Options;

namespace Bot.Services
{
	public class DiscordBotService : IHostedService
	{
		private readonly DiscordSocketClient _client;
		private readonly IOptions<DiscordConfiguration> _discordConfig;
		private readonly ILogger<DiscordBotService> _logger;

		public DiscordBotService(IOptions<DiscordConfiguration> discordConfig, ILogger<DiscordBotService> logger)
		{
			_client = new DiscordSocketClient(new DiscordSocketConfig
			{
				GatewayIntents = GatewayIntents.All
			});

			_discordConfig = discordConfig;
			_logger = logger;

			_client.Log += LogMessage;
			_client.Ready += OnReady;
			_client.MessageReceived += OnMessageRecieved;
		}

		public async Task StartAsync(CancellationToken cancellationToken)
		{
			_logger.Log(LogLevel.Information, $"Token: {_discordConfig.Value.Token}");
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
				// log when logger is better
			}
		}

		private Task LogMessage(LogMessage message)
		{
			Console.WriteLine(message.ToString());
			return Task.CompletedTask;
		}

		private Task OnReady()
		{
			Console.WriteLine("Bot is connected");
			return Task.CompletedTask;
		}

		private async Task OnMessageRecieved(SocketMessage message)
		{
			if (message.Author.IsBot || message.Author.IsWebhook)
			{
				return;
			}

			if (message.Content == "!test")
			{
				await message.Channel.SendMessageAsync("Hello World");
			}
		}
	}
}