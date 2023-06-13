// import all the necessary modules
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const { config } = require("dotenv");
const fs = require("node:fs");
const path = require("node:path");

// set up the token
config();
const token = process.env.TOKEN;

// create the client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// load the commands
client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    console.log(`✅ [SUCCESS] La commande ${file} est chargée.`);
  } else {
    console.log(
      `🚧 [WARNING] Le fichier de commande ${file} ne fonctionne pas.`
    );
  }
}

// setup interactions
client.on(Events.InteractionCreate, async (interaction) => {
  // if interaction is not a command, return
  if (!interaction.isCommand()) return;

  // search for the command in the collection
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    interaction.reply({
      content: "Cette commande n'existe pas.",
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "Une erreur est survenue lors de l'exécution de la commande.",
      ephemeral: true,
    });
  }
});

// on ready message
client.on(Events.ClientReady, () => {
  console.log(`\n🔴[STARTING] Le bot est lancée avec succés !\n`);
});

// login with the token
client.login(token);
