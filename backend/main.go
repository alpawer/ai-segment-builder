package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/anthropics/anthropic-sdk-go"
)

type SuggestRequest struct {
	Query string `json:"query"`
}

type SuggestResponse struct {
	Name        string          `json:"name"`
	Explanation string          `json:"explanation"`
	Tree        json.RawMessage `json:"tree"`
}

var prompt = `You are a segment builder assistant. Based on the user's natural language query (in any language), generate a segment filter tree in JSON format. Always respond with JSON only, regardless of the input language. Segment name and explanation should be in the same language as the user's query.

Available fields for "contacts" table:
- email (string): Contact email address
- first_name (string): First name
- last_name (string): Last name
- country (string): Country code (e.g. "US", "UA", "GB")
- city (string): City name
- language (string): Language code (e.g. "en", "uk")
- job_title (string): Job title
- lifetime_value (number): Total amount spent
- orders_count (number): Total number of orders
- last_order_at (time): Date of the last order
- created_at (time): Date when contact was created

String operators: equals, not_equals, contains, not_contains, starts_with, ends_with, is_empty, is_not_empty
Number operators: equals, not_equals, gt, gte, lt, lte
Time operators: after_date, before_date, in_the_last_days

Return ONLY valid JSON:
{
  "name": "Segment name",
  "explanation": "Brief explanation",
  "tree": {
    "kind": "branch",
    "branch": {
      "operator": "and",
      "leaves": [
        {
          "kind": "leaf",
          "leaf": {
            "table": "contacts",
            "contact": {
              "filters": [
                {
                  "field_name": "country",
                  "field_type": "string",
                  "operator": "equals",
                  "string_values": ["US"]
                }
              ]
            }
          }
        }
      ]
    }
  }
}`

func suggestHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req SuggestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	client := anthropic.NewClient()
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	msg, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     anthropic.ModelClaudeOpus4_6,
		MaxTokens: 2048,
		Messages: []anthropic.MessageParam{
			{
				Role: anthropic.MessageParamRoleUser,
				Content: []anthropic.ContentBlockParamUnion{
					anthropic.NewTextBlock(prompt + "\n\nUser query: " + req.Query),
				},
			},
		},
	})
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": fmt.Sprintf("AI error: %v", err)})
		return
	}

	text := ""
	for _, block := range msg.Content {
		if block.Type == "text" {
			text = block.Text
			break
		}
	}

	// Extract JSON using proper brace matching
	start := strings.Index(text, "{")
	if start == -1 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid AI response"})
		return
	}
	depth := 0
	end := -1
	for i := start; i < len(text); i++ {
		if text[i] == '{' {
			depth++
		} else if text[i] == '}' {
			depth--
			if depth == 0 {
				end = i
				break
			}
		}
	}
	if end == -1 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid AI response"})
		return
	}
	jsonStr := text[start : end+1]

	var result SuggestResponse
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "failed to parse AI response"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func main() {
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		log.Fatal("ANTHROPIC_API_KEY is required")
	}

	http.HandleFunc("/api/suggest", suggestHandler)
	log.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
