import * as settings from './settings.json' 

import TelegramBot from 'node-telegram-bot-api';

const token = settings.default.token;
const bot = new TelegramBot(token, {polling: true});

import YAML from 'js-yaml'
import fs from 'fs'

const file = fs.readFileSync(settings.default.scenario_file)

const scenario = YAML.load(file)

import StateMachine from './stateMachine.js'

let getChatState = (chatId) => {
    let chatState = StateMachine.getState(chatId)
    if(!!chatState) chatState = chatState.state
    else chatState = "none"

    return chatState
}

let getBranch = (state, messageText) => {
    // set scenario branch
    let branch = null
    if(!!state.endpoints[messageText]) {
        branch = state.endpoints[messageText]
    }
    else if(!!state.endpoints['default'])
    {
        branch = state.endpoints['default']
    }
    else {
        console.error('Not implemented default method')
        return
    }

    return branch
}

let getOptions = (branch) => {
    let options = {}

    // check reply markup keyboard
    if(!!branch.reply_markup){
        if(!!branch.reply_markup)
        {
            if(!!branch.reply_markup.ReplyKeyboardMarkup)
            {
                options.reply_markup = {}
                options.reply_markup.one_time_keyboard = true
                options.reply_markup.resize_keyboard = true
                options.reply_markup.keyboard = []
    
                let rows = branch.reply_markup.ReplyKeyboardMarkup.keyboard
                rows.forEach(row_object => {
                    let buttons = []
                    row_object.row.forEach(button => {
                        buttons.push(button.text)
                    })
                    options.reply_markup.keyboard.push(buttons)
                })
            }

            if(!!branch.reply_markup.InlineKeyboardMarkup)
            {
                const keyboard = branch.reply_markup.InlineKeyboardMarkup.inline_keyboard
                options.reply_markup = {}
                options.reply_markup.inline_keyboard = []
                keyboard.forEach( InlineKeyboardButton => {
                    const button = InlineKeyboardButton.button
                    const buttonObject = {
                        text: button.text
                    }

                    if(!!button.url) {
                        buttonObject.url = button.url
                    } 
                    if(!!button.callback_data) {
                        buttonObject.callback_data = button.callback_data
                    }

                    options.reply_markup.inline_keyboard.push([ buttonObject ])
                })
            }

        }
    }

    return options
}

import scenario_functions from './Scenarios/functions.mjs' 

bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    let state = scenario.states[getChatState(chatId)]
    let messageText = msg.text

    let branch = getBranch(state, messageText)
    let response = !!branch.text ? branch.text.join('\n') : null
    let actions = !!branch.actions ? branch.actions : null

    if(!!actions) 
    {
        actions.forEach(action => {
            scenario_functions[action](bot, chatId, messageText);
        })
    }

    let options = getOptions(branch)

    // set/drop chat state
    if(!!branch.set_state & branch.set_state){
        StateMachine.setState(chatId, branch.set_state_name)
    }

    if(!!branch.drop_state & branch.drop_state){
        StateMachine.dropState(chatId)
    }
    // send result message
    if(!!response) bot.sendMessage(msg.chat.id, response, options)
});

bot.on('callback_query', (msg) => {
    console.log(msg)
})