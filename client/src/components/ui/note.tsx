import { Button } from "./button";
import { Plus, X } from "lucide-react";
import { useState } from "react";

const SUGGESTED_QUESTIONS = [
  "What are your hobbies?",
  "What's your ideal date?",
  "What are you looking for in a partner?",
  "What's your favorite way to spend weekends?",
  "What are your career goals?",
];

export function Notes({
  type,
  notes,
  onAdd,
  onDelete,
}: {
  type: "public" | "private";
  notes: string[];
  onAdd: (note: string) => void;
  onDelete: (index: number) => void;
}) {
  const [editingNote, setEditingNote] = useState<{
    index: number | null;
    text: string;
    title: string;
  } | null>(null);

  const handleAddNote = () => {
    setEditingNote({
      index: null,
      text: "",
      title: `Note ${notes.length + 1}`,
    });
  };

  const handleSaveNote = () => {
    if (editingNote) {
      const newNote = `${editingNote.title}: ${editingNote.text}`;
      if (editingNote.index !== null) {
        // Update existing note
        const updatedNotes = [...notes];
        updatedNotes[editingNote.index] = newNote;
        onAdd(updatedNotes.join("\n"));
      } else {
        // Add new note
        const updatedNotes = [...notes, newNote];
        onAdd(updatedNotes.join("\n"));
      }
      setEditingNote(null);
    }
  };

  const handleDeleteNote = (index: number) => {
    onDelete(index);
  };

  return (
    <div className="space-y-6">
      <div className="notes-grid">
        {notes.map((note, i) => {
          const [title, ...content] = note.split(": ");
          return (
            <div
              key={i}
              className="note-card group cursor-pointer"
              onClick={() => {
                setEditingNote({
                  index: i,
                  text: content.join(": "),
                  title: title,
                });
              }}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(i);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                {content.join(": ")}
              </p>
            </div>
          );
        })}
        <Button
          variant="outline"
          className="note-card flex items-center justify-center gap-2 border-dashed"
          onClick={handleAddNote}
        >
          <Plus className="h-6 w-6" />
          <span>Add Note</span>
        </Button>
      </div>

      {editingNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingNote.index !== null ? "Edit Note" : "Add Note"}
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                value={editingNote.title}
                onChange={(e) =>
                  setEditingNote({
                    ...editingNote,
                    title: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                placeholder="Note title"
              />
              <textarea
                className="w-full p-2 border rounded-md h-40 dark:bg-gray-700 dark:border-gray-600"
                value={editingNote.text}
                onChange={(e) =>
                  setEditingNote({
                    ...editingNote,
                    text: e.target.value,
                  })
                }
                placeholder={SUGGESTED_QUESTIONS[Math.floor(Math.random() * SUGGESTED_QUESTIONS.length)]}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingNote(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveNote}>Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}