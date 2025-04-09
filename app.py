# app.py
from flask import Flask, render_template, request, jsonify
import os
from dotenv import load_dotenv
import requests
import json

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Get API keys from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate_response():
    data = request.json
    prompt = data.get('prompt', '')
    model_provider = data.get('provider', 'openai')
    model_name = data.get('model', '')
    temperature = float(data.get('temperature', 0.7))
    max_tokens = int(data.get('max_tokens', 1000))
    
    if model_provider == 'openai':
        return generate_openai(prompt, model_name, temperature, max_tokens)
    elif model_provider == 'anthropic':
        return generate_anthropic(prompt, model_name, temperature, max_tokens)
    else:
        return jsonify({'error': 'Invalid model provider'})

def generate_openai(prompt, model_name, temperature, max_tokens):
    if not OPENAI_API_KEY:
        return jsonify({'error': 'OpenAI API key not found in environment variables'})
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {OPENAI_API_KEY}'
    }
    
    payload = {
        'model': model_name or 'gpt-3.5-turbo',
        'messages': [{"role": "user", "content": prompt}],
        'temperature': temperature,
        'max_tokens': max_tokens
    }
    
    try:
        response = requests.post('https://api.openai.com/v1/chat/completions', 
                               headers=headers, 
                               data=json.dumps(payload))
        
        if response.status_code == 200:
            response_data = response.json()
            generated_text = response_data['choices'][0]['message']['content']
            return jsonify({'response': generated_text})
        else:
            return jsonify({'error': f'API Error: {response.status_code}', 'details': response.text})
    
    except Exception as e:
        return jsonify({'error': str(e)})

def generate_anthropic(prompt, model_name, temperature, max_tokens):
    if not ANTHROPIC_API_KEY:
        return jsonify({'error': 'Anthropic API key not found in environment variables'})
    
    headers = {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
    }
    
    payload = {
        'model': model_name or 'claude-3-sonnet-20240229',
        'messages': [{"role": "user", "content": prompt}],
        'temperature': temperature,
        'max_tokens': max_tokens
    }
    
    try:
        response = requests.post('https://api.anthropic.com/v1/messages', 
                               headers=headers, 
                               data=json.dumps(payload))
        
        if response.status_code == 200:
            response_data = response.json()
            generated_text = response_data['content'][0]['text']
            return jsonify({'response': generated_text})
        else:
            return jsonify({'error': f'API Error: {response.status_code}', 'details': response.text})
    
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/save_conversation', methods=['POST'])
def save_conversation():
    data = request.json
    conversation = data.get('conversation', [])
    
    try:
        # Create 'conversations' directory if it doesn't exist
        if not os.path.exists('conversations'):
            os.makedirs('conversations')
        
        # Generate a filename based on current timestamp
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"conversations/conversation_{timestamp}.json"
        
        # Save the conversation to a JSON file
        with open(filename, 'w') as f:
            json.dump(conversation, f, indent=2)
        
        return jsonify({'status': 'success', 'filename': filename})
    
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)