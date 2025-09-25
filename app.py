import os
from flask import Flask, render_template, request, jsonify
import pandas as pd
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# --- Configure Google AI API ---
try:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found in .env file.")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    print("Google AI Model configured successfully.")
except Exception as e:
    print(f"API Key or Model Configuration Error: {e}")
    model = None

# --- Load Knowledge Bases ---
try:
    health_df = pd.read_csv("health_data_hindi.csv")
    print("Health data loaded.")
except FileNotFoundError:
    print("Error: health_data_hindi.csv not found.")
    health_df = pd.DataFrame()

try:
    med_df = pd.read_csv("medicines_data.csv")
    print("Medicine data loaded.")
except FileNotFoundError:
    print("Error: medicines_data.csv not found.")
    med_df = pd.DataFrame()

# --- Page Routes ---
@app.route('/')
def index(): return render_template('index.html')
@app.route('/login')
def login(): return render_template('login.html')
@app.route('/signup')
def signup(): return render_template('signup.html')
@app.route('/medicines')
def medicines(): return render_template('medicines.html')
@app.route('/about')
def about(): return render_template('about.html')
@app.route('/dashboard')
def dashboard(): return render_template('dashboard.html')

# --- API Endpoints ---
@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message', '').lower()
    context = ""

    # Step 1: Search local data (Retrieval)
    if not health_df.empty:
        search_terms = user_message.split()
        relevant_rows = health_df[
            health_df['keyword'].str.contains('|'.join(search_terms), case=False, na=False)
        ]
        if not relevant_rows.empty:
            match = relevant_rows.iloc[0]
            context = f"बीमारी: {match['disease_name']}, लक्षण: {match['symptoms']}, उपचार: {match['solution']}, दवा सुझाव: {match['medicine_recommendation']}, डिस्क्लेमर: {match['disclaimer']}"

    # Check if AI model is configured
    if not model:
        return jsonify({'response': 'AI Model configured नहीं है। कृपया API key जांचें।'})

    # Step 2: Prepare prompt for the AI (Augmentation)
    if context:
        prompt = f"Context: {context}\n\nUser's Question: {user_message}\n\nBased on the context, answer the user's question in a helpful, conversational manner in pure Hindi (Devanagari script). Always advise consulting a doctor."
    else:
        prompt = f"User's Question: {user_message}\n\nAnswer the user's health question in a helpful, conversational manner in pure Hindi (Devanagari script). Since you have no specific context, state that this is general information and strongly advise consulting a doctor."

    # Step 3: Call the API (Generation)
    try:
        response = model.generate_content(prompt)
        bot_response = response.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        bot_response = "क्षमा करें, AI से संपर्क करने में कोई समस्या हुई।"

    return jsonify({'response': bot_response})

@app.route('/search_medicine', methods=['POST'])
def search_medicine():
    search_query = request.json.get('query', '').lower()
    bot_response = "Sorry, we could not find information on this medicine."
    if not med_df.empty and search_query:
        relevant_rows = med_df[med_df['medicine_name'].str.lower() == search_query]
        if not relevant_rows.empty:
            match = relevant_rows.iloc[0]
            bot_response = f"Uses: {match['uses']}\n\nSide Effects: {match['side_effects']}\n\n**Disclaimer:** {match['disclaimer']}"
    return jsonify({'response': bot_response})

@app.route('/search_by_filename', methods=['POST'])
def search_by_filename():
    filename = request.json.get('filename', '').lower()
    bot_response = "Could not identify any medicine from the filename. Please rename the file to a medicine name (e.g., 'crocin.jpg')."
    if not med_df.empty and filename:
        found_medicine = None
        for med_name in med_df['medicine_name'].str.lower():
            if med_name in filename:
                found_medicine = med_name
                break
        if found_medicine:
            relevant_rows = med_df[med_df['medicine_name'].str.lower() == found_medicine]
            match = relevant_rows.iloc[0]
            bot_response = f"**Medicine Identified from Filename:** {match['medicine_name']}\n\nUses: {match['uses']}\n\nSide Effects: {match['side_effects']}\n\n**Disclaimer:** {match['disclaimer']}"
    return jsonify({'response': bot_response})

if __name__ == '__main__':
    app.run(debug=True)