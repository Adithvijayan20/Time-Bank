import random
import json
import torch
import os
from neural_model import NeuralNet  # ✅ FIXED: Import from renamed file
from nltk_utils import bag_of_words, tokenize

dir_path = os.path.dirname(os.path.realpath(__file__))
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Load intents JSON
with open(os.path.join(dir_path, 'intents.json'), 'r') as json_data:
    intents = json.load(json_data)

# Load trained model
FILE = os.path.join(dir_path, "data.pth")
data = torch.load(FILE, map_location=device)

input_size = data["input_size"]
hidden_size = data["hidden_size"]
output_size = data["output_size"]
all_words = data['all_words']
tags = data['tags']
model_state = data["model_state"]

model = NeuralNet(input_size, hidden_size, output_size).to(device)
model.load_state_dict(model_state)
model.eval()

bot_name = "Sam"

def get_response(msg):
    sentence = tokenize(msg)
    X = bag_of_words(sentence, all_words)
    X = X.reshape(1, X.shape[0])
    X = torch.from_numpy(X).to(device)

    output = model(X)
    probs = torch.softmax(output, dim=1)
    
    # Debugging: Print probabilities
    print("Probabilities:", probs.tolist())

    prob, predicted = torch.max(probs, dim=1)
    tag = tags[predicted.item()]

    print(f"Predicted tag: {tag}, Confidence: {prob.item()}")

    if prob.item() > 0.6:  # Ensure correct thresholding
        for intent in intents['intents']:
            if tag == intent["tag"]:
                return random.choice(intent['responses'])
    
    return "I'm sorry, I didn't understand that. Can you try rephrasing?"

if __name__ == "__main__":
    print("Let's chat! (type 'quit' to exit)")
    while True:
        sentence = input("You: ")
        if sentence.lower() == "quit":
            break
        print(get_response(sentence))
