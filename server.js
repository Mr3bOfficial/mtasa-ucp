const Discord = require('discord.js');
const client = new Discord.Client();
const mysql = require('mysql');
const { token, mysql_ip, mysql_username, mysql_password, mysql_database } = require('./data/config');
const prefix = "#";
const { QuickDB } = require('quick.db');
const data = new QuickDB();
const md5 = require('md5');

const connection = mysql.createConnection({
    host: mysql_ip,
    user: mysql_username,
    password: mysql_password,
    database: mysql_database
});

connection.connect(function(error) {
    if (error) throw error;
    console.log("Mysql Connected")
});

client.on('ready', () => {
    console.log("Bot is Online")
});

const factions = {
    1: "Los Santos Police Department",
    99: "The King Mr3b",
}

client.on('message', async(message) => {
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === "login") {
        if (data.get(`${message.author.id}_loggedin`)) return message.reply("You already have account connected to you're discord.")
        if (message.channel.type !== "dm") {
            message.delete();
            message.channel.send("Use this command in dm!");

            return false;
        }
        if (!args[0] || !args[1]) return message.reply(`Use ${prefix}${command} [username] [password]`);

        connection.query(`SELECT * FROM accounts WHERE username='${args[0]}'`, function(error, results) {
            if (error) throw error;
            if (!results.length > 0) return message.reply("Account was not found");

            const salt = results[0].salt;
            const databasePassword = results[0].password;
            const password = args[1];
            const saltedMd5 = md5(md5(password)+salt);

            if (saltedMd5 !== databasePassword) return message.reply("Password is not correct!");

            data.set(`${message.author.id}_loggedin`, true)
            data.set(`${message.author.id}_accountID`, results[0].id)

            message.reply("You're account is now connected with " + results[0].username)
        });
    } else if (command === "account") {
        if (!data.get(`${message.author.id}_loggedin`)) return message.reply("You need to login first.");

        var id = await data.get(`${message.author.id}_accountID`);
        connection.query("SELECT * FROM accounts WHERE id=" + id, function(error, results) {
            if (error) throw error;

            var embed = new Discord.MessageEmbed()
            .setColor("BLUE")
            .setTitle("Account " + results[0].username)
            .addFields(
                {name: "ID", value: `${results[0].id}`, inline: true},
                {name: "Email", value: `${results[0].email}`, inline: true},
                {name: "Admin", value: `${isAdmin(results[0].admin)}`, inline: true},
                {name: "Jail", value: `${isInJail(results[0].adminjail)}`, inline: true},
                {name: "GC", value: `${results[0].credits}`, inline: true},
            )
            message.reply(embed)
        });
    } else if (command === "character") {
        if (!data.get(`${message.author.id}_loggedin`)) return message.reply("You need to login first.");

        var id = await data.get(`${message.author.id}_accountID`);
        connection.query("SELECT * FROM characters WHERE account=" + id, function(error, results) {
            if (error) throw error;

            var embed = new Discord.MessageEmbed()
            .setColor("BLUE")
            .setTitle("Character " + results[0].charactername)
            .addFields(
                {name: "Account ID", value: `${id}`, inline: true},
                {name: "Age", value: `${results[0].age}`, inline: true},
                {name: "Money", value: `${results[0].money}`, inline: true},
                {name: "Bank Money", value: `${results[0].bankmoney}`, inline: true},
                {name: "Gender", value: `${getGender(results[0].gender)}`, inline: true},
                {name: "Last Area", value: `${results[0].lastarea}`, inline: true},
                {name: "Faction", value: `${factions[results[0].faction_id]}`, inline: true},
            )
            message.reply(embed)
        });
    };
})

function isAdmin(value) {
    if (value > 0) {
        return 'Yes';
    } else {
        return 'No';
    }
}

function getGender(value) {
    if (value == 0) {
        return 'Male'
    } else {
        return 'Female'
    }
}

function isInJail(value) {
    if (value > 0) {
        return 'Yes';
    } else {
        return 'No';
    }
}

client.login(token)