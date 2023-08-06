using _2024Bot.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace _2024Bot
{
    public static class Program
    {
        private static void Main(string[] args) { CreateHostBuilder(args).Build().Run(); }

        private static IHostBuilder CreateHostBuilder(string[] args)
        {
            return Host.CreateDefaultBuilder(args)
                .ConfigureLogging(logging =>
                {
                    logging.SetMinimumLevel(LogLevel.Information);
                    logging.AddSimpleConsole(conf => { conf.TimestampFormat = "[MM-dd-yyyy HH:mm:ss:fff]"; });
                })
                .ConfigureServices((hostContext, services) =>
                {
                    services.AddHostedService<DiscordBotService>();
                });
        }
    }
}