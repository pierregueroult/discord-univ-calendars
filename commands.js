const { REST, Routes } = require("discord.js");
const { config } = require("dotenv");
const fs = require("node:fs");
const path = require("node:path");

config();
const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

const commands = [];

const commandsPath = path.join(__dirname, "commands");

const commandsFolder = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandsFolder) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`🚧 [WARNING] ${file} n'a pas pu être ajouté aux commandes.`);
  }
}

const rest = new REST().setToken(TOKEN);

(async () => {
  try {
    console.log("🚀 [INFO] Rafraichissement des commandes (/) débuté.");

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });

    console.log("✅ [INFO] Toutes les commandes (/) ont été rafraichies.");
  } catch (error) {
    console.log("❌ [ERROR] Failed to reload application (/) commands.");
  }
})();
