using System.ComponentModel.DataAnnotations;

namespace _2024Bot.Discord.Options
{
    public class DiscordConfiguration
    {
        public static string Position => "DiscordSettings";

        [MinLength(1)]
        public string Token { get; set; }
    }
}