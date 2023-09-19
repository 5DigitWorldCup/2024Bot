using System.ComponentModel.DataAnnotations;

namespace Bot.WebApi.Options
{
    public class ApiConfiguration
    {
        [MinLength(1)]
        public string ConnectionString { get; set; } = null!;
    }
}