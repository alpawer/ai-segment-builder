# AI Segment Builder

A demo project that converts natural language queries into contact segment filters using Claude AI.

Describe your audience in any language and AI will automatically build the filter tree for you.

## Demo

![Input](demo1.png)
![Loading](demo2.png)
![Result](demo3.png)

## How it works

1. User types a natural language query (in any language)
2. The backend sends it to Claude AI with a structured prompt
3. Claude returns a JSON filter tree
4. The frontend renders the filters visually

## Tech Stack

- **Backend**: Go + Anthropic SDK
- **Frontend**: React + TypeScript
- **AI**: Claude claude-sonnet-4-6 via Anthropic API

## Prerequisites

- Go 1.21+
- Node.js 18+
- Anthropic API key — get one at https://console.anthropic.com

## Setup

1. Clone the repo
```bash
git clone https://github.com/alpawer/ai-segment-builder.git
cd ai-segment-builder
```

2. Set your API key
```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your ANTHROPIC_API_KEY
```

3. Install frontend dependencies
```bash
cd frontend && npm install && cd ..
```

4. Run
```bash
./start.sh
```

Open http://localhost:3000

## Example queries

- contacts from USA created in the last 7 days
- customers with more than 5 orders and lifetime value over 100
- нові контакти з України за останній місяць
- клиенты с заказами больше 3

## Project Structure

ai-segment-builder/
├── backend/
│ ├── main.go
│ ├── go.mod
│ └── .env.example
├── frontend/
│ ├── src/App.tsx
│ └── package.json
├── demo1.png
├── demo2.png
├── demo3.png
└── start.sh

