using Bot.Discord.Handlers;
using Bot.Discord.Options;
using Bot.Internal.Events;
using Bot.Services;
using Bot.WebApi.Options;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Bot
{
	public class Program
	{
        public static void Main(string[] args) { ConfigureApp(ConfigureServices(WebApplication.CreateBuilder(args))).Run(); }

        private static WebApplication ConfigureServices(WebApplicationBuilder builder)
		{
            builder.Services.AddRazorPages();
            builder.Services.AddLogging(log =>
            {
                log.ClearProviders();
                log.AddSimpleConsole(cnf => { cnf.TimestampFormat = "[MM-dd-yyyy HH:mm:ss:fff] "; });
            });

            // Configurations
            builder.Services.Configure<DiscordConfiguration>(builder.Configuration.GetSection("DiscordSettings"));
            builder.Services.Configure<ApiConfiguration>(builder.Configuration.GetSection("ApiConfiguration"));

            // Discord client
            builder.Services.AddSingleton(_ =>
            {
                var client = new DiscordSocketClient(new DiscordSocketConfig
                {
                    AlwaysDownloadUsers = true,
                    GatewayIntents = GatewayIntents.AllUnprivileged,
                    // Will remove this when I figure out exactly what intents we need
                    LogGatewayIntentWarnings = false,
                    LogLevel = LogSeverity.Debug
                });

                return client;
            });
            // Interaction and command handling
            builder.Services.AddSingleton(x => new InteractionService(x.GetRequiredService<DiscordSocketClient>()));
            builder.Services.AddSingleton<InteractionHandler>();
            
            // Event hooks
            builder.Services.AddSingleton<BotEvents>();
            // Client controller
            builder.Services.AddHostedService<DiscordBotService>();

            return builder.Build();
        }

		private static WebApplication ConfigureApp(WebApplication app)
		{
            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseRouting();
            app.UseAuthorization();
            app.MapRazorPages();

            return app;
        }
	}
}