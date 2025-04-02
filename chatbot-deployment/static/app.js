class Chatbox {
    constructor()
    {
        {
            this.chatBox = document.querySelector(".chatbox__support");
            this.openButton = document.querySelector(".chatbox-button");
            this.sendButton = document.querySelector(".send-button");
        }
        this.state = false;
        this.message = [];
    } 
    display()
    {
        const { openButton, chatBox, sendButton} = this.args;
        openButton.addEventListener("click", () => this.toggleState(chatBox));
        sendButton.addEventListener("click", () => this.onSendButton(chatBox));
        const node = chatBox.querySelector('input');
        node.addEventListener("keyup", ({key}) => {
            if (key === "Enter") {
                this.onSendButton(chatBox);
            }
        });
    }
    toggleState(chatBox)
    {
        if (this.state) {
            chatBox.classList.add("chatbox--active");
        }else {
            chatBox.classList.remove("chatbox--active");
        }
    }
    onSendButton(chatBox)
    {
        const textInput = chatBox.querySelector('input');
        let text1 = textInput.value;
        if (text1 === "") {
            return;
        }
        let msg1 = { name: "User", message: text1 };
        this.message.push(msg1);
        fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            body: JSON.stringify({ message: text1 }),
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: text1 })
        })
        .then(r=> r.json())
        .then(r => {
            let msg2 = { name: "Sam", message: r.answer };
            this.message.push(msg2);
            this.updateChatText(chatBox);
            textInput.value = "";
        }).catch((error) => {
            console.error('Error:', error);
            this.updateChatText(chatBox);
            textInput.value = "";
        });
    }
    updateChatText(chatBox)
    {
        var html = "";
        this.message.slice().reverse().forEach(function(item, index) {
            if (item.name === "Sam") {
                html += '<div class="messages__item messages__item--visitor">' + item.message + '</div>';
            } else {
                html += '<div class="messages__item messages__item--operator">' + item.message + '</div>';
            }
        });
        const chatmessage = chatBox.querySelector(".chatbox__messages");
        chatmessage.innerHTML = html;
    }
}
const chatbox = new Chatbox();
chatbox.display();