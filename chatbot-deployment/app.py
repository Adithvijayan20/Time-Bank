# from flask import Flask, request, jsonify, render_template
# from flask_cors import CORS
# from chat import get_response
# import logging

# # Set up logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# app = Flask(__name__)
# CORS(app)  # Enable CORS for all routes

# @app.route("/")
# def index_get():
#     return render_template("base.html")

# @app.route("/predict", methods=["POST"])
# def predict():
#     try:
#         data = request.get_json()
#         text = data.get("message", "")
#         logger.info(f"Received message: {text}")
        
#         response = get_response(text)
#         logger.info(f"Response: {response}")
        
#         message = {"answer": response}
#         return jsonify(message)
#     except Exception as e:
#         logger.error(f"Error processing request: {e}")
#         return jsonify({"answer": "Sorry, I encountered an error processing your request."}), 500

# if __name__ == "__main__":
#     logger.info("Starting Flask server...")
#     app.run(debug=True, host='0.0.0.0', port=5000)





import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from chat import get_response
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route("/")
def index_get():
    return render_template("base.html")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        text = data.get("message", "")
        logger.info(f"Received message: {text}")
        
        response = get_response(text)
        logger.info(f"Response: {response}")
        
        message = {"answer": response}
        return jsonify(message)
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return jsonify({"answer": "Sorry, I encountered an error processing your request."}), 500

if __name__ == "__main__":
    logger.info("Starting Flask server...")
    # Use the PORT environment variable if available, otherwise default to 5000
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
