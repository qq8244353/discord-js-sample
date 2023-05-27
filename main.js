require('dotenv').config()
//受信したい内容を明示的にonにしないといけない.onにしないといけない
const { Client, GatewayIntentBits, Partials } = require('discord.js')
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction],
})
//discord bot TOKENを用いて, サーバーの内容をこちらで受信するようにする.
client.login(process.env.DISCORD_BOT_TOKEN)
//外部APIを利用する時に用いるライブラリ.
const axios = require('axios')
//リアクションようの絵文字.良い方法を知らないので,emojiを列挙してその中から選ぶ実装になっている.
const emojis = ['😄', '😃', '😀', '😊', '😉']

//メッセージ作成に反応する関数.
client.on('messageCreate', async (message) => {
    const guild = await client.guilds.fetch(message.guildId)
    const member = guild.members.resolve(message.author)
    //自分自身のメッセージには反応しない.
    if (message.author.id === client.user.id) {
        return
    }
    //メンションされていたらメンションで返す.
    if (message.mentions.has(client.user)) {
        message.reply('こんにちは!')
        return
    }
    //チャンネルによって挙動を帰る.
    if (message.channelId === process.env.BOOK_CHANNEL_ID) {
        //外部のAPIを利用する.
        const response = await axios.get('https://api.openbd.jp/v1/get?isbn=' + message.content)
        if (response.data[0] === null) {
            sendReply(message, '本が見つかりませんでした:cry:')
            return
        }
        const onix = response.data[0].onix
        const title = onix.DescriptiveDetail.TitleDetail.TitleElement.TitleText.content
        const price = onix.ProductSupply.SupplyDetail.Price[0].PriceAmount
        const currency = onix.ProductSupply.SupplyDetail.Price[0].CurrencyCode
        message.reply(
            'タイトル: ' + title + '\n価格: ' + price + ' ' + currency + '\nであっていますか？'
        )
        return
    }
    //メッセージにリアクションを追加する.
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
    message.react(emoji)
    return
})

// リアクションのメッセージに対応するロールを付与.
client.on('messageReactionAdd', async (reaction, user) => {
    //botのリアクションには反応しない.
    if (user.bot) {
        return
    }
    const guild = await client.guilds.fetch(reaction.message.guildId)
    const channel = await guild.channels.fetch(reaction.message.channelId)
    const message = await channel.messages.fetch(reaction.message.id)
    const member = await guild.members.fetch(user.id)
    const role = await guild.roles.fetch().then((roles) => {
        return roles.find((role) => {
            if (role.name === message.content) return role
        })
    })
    member.roles.add(role)
})
