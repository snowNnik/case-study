from flask import Flask, request, jsonify
import json
from flask_cors import CORS
from openai import OpenAI
import os

app = Flask(__name__)
CORS(app, origins="http://localhost:3000")

CONVERSATION_HISTORY_FILE = './conversationHistory.json'
PROMPT_FILE = './prompt.json'
API_KEY = 'your-key-here'

def load_json(file_path):
    """Helper function to load a JSON file."""
    with open(file_path, 'r') as file:
        return json.load(file)

def save_json(file_path, data):
    """Helper function to save a JSON file."""
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)

def load_conversation_history():
    """Load the conversation history from a JSON file."""
    if os.path.exists(CONVERSATION_HISTORY_FILE):
        with open(CONVERSATION_HISTORY_FILE, 'r') as f:
            return json.load(f)
    return []

def save_conversation_history(conversation_history):
    """Save the conversation history to a JSON file."""
    with open(CONVERSATION_HISTORY_FILE, 'w') as f:
        json.dump(conversation_history, f, indent=4)

@app.route("/query", methods=["POST", "OPTIONS"])
def handle_query():
    """Receives user query, queries DeepSeek, and loops until an answer is found."""
    if request.method == 'OPTIONS':
        response = app.make_response('')
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000' 
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type' 
        return response
    
    if request.method == 'POST':
        client = OpenAI(
            base_url='https://api.deepseek.com',
            api_key=API_KEY,
        )

        conversationHistory = load_conversation_history()

        data = request.json
        user_query = data.get("userQuery")
        if not user_query:
            return jsonify({"error": "Missing query"}), 400

        conversationHistory.append({"role": "user", "content": user_query})

        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=conversationHistory,
        )

        reply = response.choices[0].message.content
        conversationHistory.append({"role": "assistant", "content": reply})

        save_conversation_history(conversationHistory)

        if "Answer" in reply:
            objects = reply.count('{')
            if objects > 1:
                system_message = {
                    "role": "system",
                    "content": "Please do not include two JSON objects in a single response. Reformat your previous response."
                }
                conversationHistory.append(system_message)
            else:
                return reply
        
        # If "Answer" is not found, requery
        for _ in range(10):
            response = client.chat.completions.create(
                model="deepseek-chat",
                messages=conversationHistory,
            )
            
            reply = response.choices[0].message.content
            conversationHistory.append({"role": "assistant", "content": reply})

            save_conversation_history(conversationHistory)

            if "Answer" in reply:
                objects = reply.count('{')
                if objects > 1:
                    system_message = {
                        "role": "system",
                        "content": "Please do not include two JSON objects in a single response. Reformat your previous response."
                    }
                    conversationHistory.append(system_message)
                else:
                    return reply
        
        return jsonify({"error": "Unable to find a clear answer after multiple queries."}), 500
            
@app.route('/reset', methods=['POST'])
def reset_conversation():
    """Handle POST request to reset conversationHistory.json with prompt.json."""
    try:
        prompt_data = load_json(PROMPT_FILE)

        save_json(CONVERSATION_HISTORY_FILE, prompt_data)

        return jsonify({"message": "Conversation history reset successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to reset conversation history: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True)
