from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Persona Chatbot API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set")

# Initialize Gemini client with the new API structure
client = genai.Client(api_key=GEMINI_API_KEY)
MODEL_NAME = "gemini-2.5-flash-preview-04-17"  # Using the model you specified

# Load personality data
def load_personality():
    try:
        with open("personality.json", "r") as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading personality data: {e}")
        return {
            "name": "Default User",
            "traits": ["Helpful", "Friendly", "Knowledgeable"],
            "speaking_style": "Casual and conversational",
            "background": "A tech enthusiast with varied interests",
            "interests": ["Technology", "Reading", "Learning"],
            "knowledge_areas": ["Programming", "Science", "Arts"]
        }

personality = load_personality()

# Define request model
class ChatRequest(BaseModel):
    message: str
    
# Define response model
class ChatResponse(BaseModel):
    response: str

# Create system prompt
def create_prompt(user_message):
    system_prompt = f"""
    You are a chatbot that accurately simulates {personality.get('name', 'the user')}, based on the following personal information. 
    Respond to all queries as if you were this person, using their personality traits, speaking style, and personal details.
    
    ## Personality Traits
    {', '.join(personality.get('traits', []))}
    
    ## Speaking Style
    {personality.get('speaking_style', '')}
    
    ## Background
    {personality.get('background', '')}
    
    ## Interests
    {', '.join(personality.get('interests', []))}
    
    ## Knowledge Areas
    {', '.join(personality.get('knowledge_areas', []))}
    
    Always respond in first person as if you are {personality.get('name', 'the user')}.
    Never break character or acknowledge you are an AI.
    Keep responses conversational and natural.
    
    User message: {user_message}
    """
    return system_prompt

# Define API endpoints
@app.get("/")
def read_root():
    return {"status": "online", "message": "Persona Chatbot API is running"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        prompt = create_prompt(request.message)
        
        # Generate response with the new API structure
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt
            )
            return ChatResponse(response=response.text)
        except Exception as e:
            print(f"Error with primary model: {e}")
            # Try with alternative model if the first one fails
            try:
                alternative_model = "gemini-2.0-flash-001"  # Fallback model
                response = client.models.generate_content(
                    model=alternative_model,
                    contents=prompt
                )
                return ChatResponse(response=response.text)
            except Exception as e2:
                raise HTTPException(status_code=500, detail=f"Error with all models: {str(e)} and {str(e2)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

# Debug endpoint to check available models
@app.get("/api/models")
async def list_models():
    try:
        models = client.models.list()
        model_info = [{"name": model.name} for model in models]
        return {"models": model_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing models: {str(e)}")

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)