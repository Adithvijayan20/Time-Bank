import nltk
import os

# Create nltk_data directory
nltk_data_path = os.path.join(os.getcwd(), 'nltk_data')
os.makedirs(nltk_data_path, exist_ok=True)
nltk.data.path.append(nltk_data_path)

# Download all necessary resources
print("Downloading all required NLTK resources...")
nltk.download('punkt', download_dir=nltk_data_path)
nltk.download('popular', download_dir=nltk_data_path)

# Directly address punkt_tab issue with workaround
from nltk.tokenize import word_tokenize

# Test the tokenizer with a sample text to trigger downloading needed resources
sample = "This is a test sentence to ensure all necessary NLTK resources are downloaded."
try:
    tokens = word_tokenize(sample)
    print("Tokenization successful:", tokens)
    print("All necessary resources have been downloaded.")
except Exception as e:
    print("Error during tokenization test:", e)