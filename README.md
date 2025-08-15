# ⚡ Code Generator

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **AI-Powered Code Generation with Real-Time Streaming Support**

A sophisticated, production-ready web application that generates code using AI models through Ollama. Features real-time streaming, intelligent language detection, comprehensive history management, and a modern, responsive interface.

## 🚀 Features

### ✨ Core Functionality
- **AI-Powered Code Generation**: Generate code from natural language descriptions using Ollama models
- **Real-Time Streaming**: Watch code generate token-by-token with live updates
- **Multi-Language Support**: Automatic detection and syntax highlighting for 20+ programming languages
- **Smart Filename Generation**: AI-generated descriptive filenames based on code content
- **Model Management**: Switch between different Ollama models on-the-fly

### 🎨 User Experience
- **Modern UI/UX**: Clean, responsive design with light/dark theme support
- **Real-Time Feedback**: Live token counting, progress indicators, and status updates
- **Keyboard Shortcuts**: Ctrl+Enter to generate, Escape to stop/cancel
- **Responsive Design**: Mobile-friendly interface with collapsible sidebar
- **Accessibility**: Screen reader support and keyboard navigation

### 🔧 Advanced Features
- **Generation History**: Persistent storage with search and filtering capabilities
- **Code Export**: Copy to clipboard or download generated code as files
- **Customizable Font Sizes**: Adjustable code display for better readability
- **Session Persistence**: Automatic state saving and recovery
- **Error Handling**: Robust error handling with user-friendly messages

### 🏗️ Architecture
- **FastAPI Backend**: High-performance async API with WebSocket support
- **MongoDB Integration**: Persistent storage for generation history
- **WebSocket Communication**: Real-time bidirectional communication
- **Modular Design**: Clean separation of concerns with extensible architecture

## 📸 Screenshots

### Main Interface - Light Theme
<img width="1819" height="1049" alt="UI-Light" src="https://github.com/user-attachments/assets/ee283bce-4d3e-4116-9430-5ac52164bc2a" />

*Clean, modern interface with light theme showcasing the main workspace*

### Main Interface - Dark Theme
<img width="1817" height="1047" alt="UI-Dark" src="https://github.com/user-attachments/assets/3352973c-5346-46dd-9a47-7a01efe72645" />

*Elegant dark theme interface with enhanced contrast and readability*

### Settings Panel & Mobile Interface

| Settings Panel | Mobile Responsive Design |
|:---------------:|:-------------------------:|
| <img width="400" alt="settings" src="https://github.com/user-attachments/assets/f7d9a215-0c99-48ed-83ca-2980d0cc1388" /> | <img width="300" alt="UI- Dark-Mobile" src="https://github.com/user-attachments/assets/b08d9fd6-6e9b-4119-99df-f6ed45adc3f9" /> |
| *Comprehensive settings with theme switching and code font size controls* | *Fully responsive mobile interface with optimized touch controls and collapsible sidebar* |

### Code Generation & Syntax Highlighting
<img width="1943" height="636" alt="codeblock" src="https://github.com/user-attachments/assets/582cfcd0-6002-4f65-ac71-726a83725b74" />

*Generated code with intelligent language detection and syntax highlighting for 20+ programming languages*

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern, fast web framework for building APIs
- **Uvicorn** - Lightning-fast ASGI server
- **Motor** - Async MongoDB driver
- **Pydantic** - Data validation using Python type annotations
- **WebSockets** - Real-time communication

### Frontend
- **Vanilla JavaScript** - Modern ES6+ with modular class-based architecture
- **CSS3** - Advanced styling with CSS variables and animations
- **Highlight.js** - Syntax highlighting for 20+ programming languages
- **Font Awesome** - Professional icon library

### AI & Infrastructure
- **Ollama** - Local AI model inference
- **MongoDB** - NoSQL database for persistence
- **Python 3.8+** - Backend runtime environment

## 📋 Prerequisites

Before running this application, ensure you have:

- **Python 3.8 or higher**
- **MongoDB** running on `localhost:27017`
- **Ollama** installed and running with at least one model
- **Windows 10/11** (for batch file launchers)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/sam-eer31/AI_Code_Generator
cd code-generator
```

### 2. Automated Setup (Windows)
```bash
# Run the automated installer
install.bat
```

### 3. Manual Setup (All Platforms)
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start the Application
```bash
# Windows (automated):
launcher.bat

# Manual start:
uvicorn backend.main:app --reload --port 8000 --host 127.0.0.1
```

### 5. Access the Application
Open your browser and navigate to:
- **Frontend**: http://127.0.0.1:8000

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017

# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
MODEL_NAME=qwen2.5:14b

# Server Configuration
PORT=8000
```

### Supported Ollama Models
The application works with any Ollama model. Popular options include:
- `qwen2.5:14b` - Balanced performance and quality
- `llama3.1:8b` - Fast and efficient
- `codellama:13b` - Specialized for code generation
- `deepseek-coder:6.7b` - Code-focused model

## 📖 Usage

### Basic Code Generation
1. **Enter a Prompt**: Describe the code you want to generate
2. **Select Model**: Choose your preferred Ollama model
3. **Generate**: Click "Generate Code" or press Ctrl+Enter
4. **Watch Live**: See code generate in real-time
5. **Export**: Copy to clipboard or download the generated code

### Advanced Features
- **History Management**: Browse and search previous generations
- **Regeneration**: Modify prompts and regenerate code
- **Early Stopping**: Stop generation at any time with the stop button
- **Theme Switching**: Toggle between light and dark themes
- **Font Customization**: Adjust code display font sizes

### Keyboard Shortcuts
- `Ctrl + Enter` - Generate code
- `Escape` - Stop generation / Close modals
- `Ctrl + S` - Save current state (auto-saved)

## 🏗️ Project Structure

```
AI-Code-Generator/
├── backend/                # FastAPI backend application
│   ├── __init__.py         # Package initialization
│   ├── main.py             # Main FastAPI application
│   ├── ollama_client.py    # Ollama API client
│   └── utils.py            # Utility functions
├── frontend/               # Frontend application
│   ├── index.html          # Main HTML template
│   ├── app.js              # JavaScript application
│   └── style.css           # Styling and themes
├── .venv/                  # Python virtual environment
├── install.bat             # Windows installation script
├── launcher.bat            # Windows launcher script
├── requirements.txt        # Python dependencies
└── README.md               # This file
```

## 🔌 API Endpoints

### Core Endpoints
- `GET /` - Frontend application
- `GET /health` - System health check
- `POST /generate` - Create new generation
- `GET /history` - Retrieve generation history
- `GET /history/{id}` - Get specific generation
- `DELETE /history/{id}` - Delete generation

### Model Management
- `GET /models` - List available Ollama models
- `POST /models/set` - Set active model

### WebSocket
- `WS /ws/generate/{id}` - Real-time code generation stream

## 🎯 Use Cases

### For Developers
- **Rapid Prototyping**: Quickly generate boilerplate code
- **Learning**: Understand code patterns and implementations
- **Documentation**: Generate code examples from descriptions
- **Testing**: Create test cases and mock data

### For Teams
- **Code Reviews**: Generate reference implementations
- **Standards**: Create consistent coding patterns
- **Training**: Onboard new team members with examples
- **Documentation**: Generate code samples for APIs

### For Educators
- **Teaching**: Demonstrate programming concepts
- **Exercises**: Create coding challenges
- **Examples**: Generate sample solutions
- **Debugging**: Show common patterns and fixes

## 🚧 Development

### Local Development Setup
```bash
# Clone and setup
git clone https://github.com/sam-eer31/AI_Code_Generator
cd code-generator

# Install development dependencies
pip install -r requirements.txt
pip install pytest pytest-asyncio httpx

# Run tests
pytest

# Start development server
uvicorn backend.main:app --reload --port 8000
```

### Code Style
- **Python**: Follow PEP 8 guidelines
- **JavaScript**: Use ES6+ features, consistent naming
- **CSS**: BEM methodology, CSS custom properties
- **HTML**: Semantic markup, accessibility-first

### Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=backend

# Run specific test file
pytest tests/test_main.py
```

## 🔒 Security Considerations

- **Local Deployment**: Application runs locally, no external data transmission
- **Model Security**: Uses local Ollama models, no cloud API calls
- **Input Validation**: All user inputs are validated using Pydantic
- **CORS**: Configured for local development (customize for production)

## 🚀 Deployment

### Production Deployment
```bash
# Install production dependencies
pip install -r requirements.txt

# Set production environment variables
export MONGODB_URI="mongodb://your-production-mongo"
export OLLAMA_HOST="http://your-ollama-server:11434"

# Start production server
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### Docker Deployment
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🤝 Contributing

I welcome contributions!

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Write clear, descriptive commit messages
- Include tests for new functionality
- Update documentation as needed
- Follow the existing code style

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 📞 Support

### Getting Help
- **Issues**: [GitHub Issues](https://github.com/sam-eer31/AI_Code_Generator/issues)

### Common Issues
- **MongoDB Connection**: Ensure MongoDB is running on port 27017
- **Ollama Issues**: Check if Ollama is running and models are downloaded
- **Port Conflicts**: Change PORT in .env if 8000 is occupied

## 🔮 Roadmap

### Upcoming Features
- [ ] **Code Execution Engine**: Run generated code directly in the browser with sandboxed environments
- [ ] **One-Click Code Explanation**: Get instant AI-powered explanations of any code snippet
- [ ] **Multi-Version Generation**: Generate multiple variations of the same code within a single generation session
- [ ] **Multi-User Support**: User authentication and permissions
- [ ] **Project Management**: Organize generations into projects
- [ ] **Code Analysis**: Static analysis and optimization suggestions

---

*Transform your ideas into code with the power of AI*









