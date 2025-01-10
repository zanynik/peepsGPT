
import { Button } from "./button";
import { Plus, X } from "lucide-react";
import { useState } from "react";

const SUGGESTED_QUESTIONS = [
  "What are your hobbies?",
  "What's your ideal date?",
  "What are you looking for in a partner?",
  "What's your favorite way to spend weekends?",
  "What are your career goals?"
];

export function Notes({ type, notes, onAdd, onDelete }: {
  type: "public" | "private";
  notes: string[];
  onAdd: (note: string) => void;
  onDelete: (index: number) => void;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {notes.map((note, i) => (
          <div key={i} className="flex items-center gap-1 bg-secondary p-2 rounded-md">
            <span>{note}</span>
            <X className="h-4 w-4 cursor-pointer" onClick={() => onDelete(i)} />
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={() => setShowSuggestions(!showSuggestions)}>
        <Plus className="h-4 w-4 mr-1" /> Add Note
      </Button>
      {showSuggestions && (
        <div className="bg-card p-2 rounded-md space-y-1">
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <div
              key={i}
              className="cursor-pointer hover:bg-secondary p-1 rounded"
              onClick={() => {
                onAdd(q);
                setShowSuggestions(false);
              }}
            >
              {q}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
