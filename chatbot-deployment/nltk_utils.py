import numpy as np
import re
from nltk.stem.porter import PorterStemmer

# Initialize the Porter Stemmer
stemmer = PorterStemmer()

def tokenize(sentence):
    """
    Tokenizes a sentence by:
    - Converting to lowercase
    - Removing unnecessary punctuation
    - Splitting into words
    """
    if not sentence:
        return []
    
    # Convert to lowercase and remove special characters except some punctuation
    sentence = sentence.lower().strip()
    
    # Replace special characters with spaces while keeping punctuation
    sentence = re.sub(r"[^\w\s]", " ", sentence)

    # Split into words and remove empty strings
    tokens = sentence.split()

    return tokens

def stem(word):
    """
    Stems a word (reduces it to its root form).
    """
    return stemmer.stem(word.lower())

def bag_of_words(tokenized_sentence, all_words):
    """
    Converts a tokenized sentence into a bag-of-words vector:
    - Each index corresponds to a known word from `all_words`
    - 1 if the word is present in the sentence, otherwise 0
    """
    # Stem each word in the tokenized sentence
    sentence_words = [stem(word) for word in tokenized_sentence]

    # Initialize a bag of zeros
    bag = np.zeros(len(all_words), dtype=np.float32)

    # Set 1 for words that appear in the sentence
    for idx, word in enumerate(all_words):
        if word in sentence_words:
            bag[idx] = 1.0

    return bag
