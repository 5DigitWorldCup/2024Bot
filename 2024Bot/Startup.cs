using _2024Bot.Discord.Options;
using _2024Bot.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace _2024Bot
{
    public class Startup
    {
        public Startup(IConfiguration configuration){ Configuration = configuration; }
        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.Configure<DiscordConfiguration>(Configuration.GetSection(DiscordConfiguration.Position));

            services.AddHostedService<DiscordBotService>();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.UseRouting();
            app.UseEndpoints(endpoints => { endpoints.MapControllers(); });
        }
    }
}
