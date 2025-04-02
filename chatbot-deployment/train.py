import json
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import os
from neural_model import NeuralNet  # ✅ Corrected Import
from nltk_utils import tokenize, stem, bag_of_words

dir_path = os.path.dirname(os.path.realpath(__file__))

# Load intents JSON
with open(os.path.join(dir_path, "intents.json"), "r") as file:
    intents = json.load(file)

all_words = []
tags = []
xy = []

# Process intents
for intent in intents["intents"]:
    tag = intent["tag"]
    tags.append(tag)
    for pattern in intent["patterns"]:
        tokenized_words = tokenize(pattern)
        all_words.extend(tokenized_words)
        xy.append((tokenized_words, tag))

# Stemming and removing duplicates
ignore_words = ["?", "!", ".", ","]
all_words = sorted(set(stem(w) for w in all_words if w not in ignore_words))
tags = sorted(set(tags))

# Create training data
X_train = []
y_train = []

for (pattern_sentence, tag) in xy:
    bag = bag_of_words(pattern_sentence, all_words)
    X_train.append(bag)
    y_train.append(tags.index(tag))

X_train = np.array(X_train)
y_train = np.array(y_train)

# Define Model
input_size = len(X_train[0])
hidden_size = 8
output_size = len(tags)

# Check if model already exists
model_file = os.path.join(dir_path, "data.pth")

model = NeuralNet(input_size, hidden_size, output_size)

if os.path.exists(model_file):
    print("Loading existing model...")
    data = torch.load(model_file)
    model.load_state_dict(data["model_state"])
else:
    print("Training a new model...")

# Loss & optimizer
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# Training Loop
for epoch in range(1000):
    X_train_tensor = torch.from_numpy(X_train).float()
    y_train_tensor = torch.from_numpy(y_train).long()

    output = model(X_train_tensor)
    loss = criterion(output, y_train_tensor)

    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

# Save Model
data = {
    "model_state": model.state_dict(),
    "input_size": input_size,
    "hidden_size": hidden_size,
    "output_size": output_size,
    "all_words": all_words,
    "tags": tags
}

torch.save(data, model_file)
print("Training complete. Model saved as data.pth")
