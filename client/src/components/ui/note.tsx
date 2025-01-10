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
      text: SUGGESTED_QUESTIONS[0],
      title: `Note ${notes.length + 1}`,
    });
  };

  const handleSaveNote = () => {
    if (editingNote) {
      const newNote = `${editingNote.title}: ${editingNote.text}`;
      if (editingNote.index !== null) {
        const updatedNotes = [...notes];
        updatedNotes[editingNote.index] = newNote;
        onAdd(updatedNotes.join("\n"));
      } else {
        onAdd([...notes, newNote].join("\n"));
      }
      setEditingNote(null);
    }
  };

  const handleDeleteNote = (index: number) => {
    onDelete(index);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((note, i) => {
          const [title, ...content] = note.split(": ");
          return (
            <div
              key={i}
              className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setEditingNote({
                  index: i,
                  text: content.join(": "),
                  title: title,
                });
              }}
            >
              <div className="flex justify-between items-start">
                <input
                  value={title}
                  onChange={(e) => {
                    const updatedNote = `${e.target.value}: ${content.join(": ")}`;
                    const updatedNotes = [...notes];
                    updatedNotes[i] = updatedNote;
                    onAdd(updatedNotes.join("\n"));
                  }}
                  className="font-bold bg-transparent focus:outline-none focus:ring-0 border-none p-0"
                />
                <X
                  className="h-4 w-4 cursor-pointer hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(i);
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {content.join(": ").substring(0, 100)}...
              </p>
            </div>
          );
        })}
        <div
          className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-center"
          onClick={handleAddNote}
        >
          <div className="text-center">
            <Plus className="h-6 w-6 mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {SUGGESTED_QUESTIONS[0]}
            </p>
          </div>
        </div>
      </div>

      {editingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="font-bold mb-4 text-gray-800 dark:text-gray-200">
              {editingNote.index !== null ? "Edit Note" : "Add Note"}
            </h3>
            <input
              type="text"
              value={editingNote.title}
              onChange={(e) =>
                setEditingNote({
                  ...editingNote,
                  title: e.target.value,
                })
              }
              className="w-full p-2 border rounded-md mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              placeholder="Note title"
            />
            <textarea
              className="w-full p-2 border rounded-md h-40 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              value={editingNote.text}
              onChange={(e) =>
                setEditingNote({
                  ...editingNote,
                  text: e.target.value,
                })
              }
              placeholder="Enter your note..."
            />
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingNote(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveNote}
                className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
