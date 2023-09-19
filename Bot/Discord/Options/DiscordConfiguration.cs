using System.ComponentModel.DataAnnotations;

namespace Bot.Discord.Options
{
	public class DiscordConfiguration
	{
		[MinLength(1)]
		public string Token { get; set; } = null!;
		public ulong GuildId { get; set; }
	}
}