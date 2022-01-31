module.exports = new class {
    constructor() {
        this.collection = []
    }

    setState(chatId, state){
        let obj = this.collection.find( instance => {
            return instance.chatId == chatId
        })
        if(!!obj) obj.state = state
        else this.collection.push({chatId: chatId, state: state})
    }

    getState(chatId){
        return this.collection.find( instance => {
            return instance.chatId == chatId
        })
    }

    dropState(chatId){
        this.collection = this.collection.filter(instance => instance.chatId !== chatId)
    }

}