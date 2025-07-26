import React, { useState, useEffect } from "react";
import { API_URL } from "../config.js";

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/todos`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTodos(data);
      } else {
        alert("Failed to fetch todos. Please try again.");
      }
    } catch (error) {
      alert("Error fetching todos. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: newTodo.trim(),
        }),
      });

      if (response.ok) {
        const todo = await response.json();
        setTodos([todo, ...todos]);
        setNewTodo("");
        setShowAddForm(false);
      } else {
        alert("Failed to add todo. Please try again.");
      }
    } catch (error) {
      alert("Error adding todo. Please check your connection.");
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const response = await fetch(`${API_URL}/api/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          completed: !completed,
        }),
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos(todos.map((todo) => (todo.id === id ? updatedTodo : todo)));
      } else {
        alert("Failed to update todo. Please try again.");
      }
    } catch (error) {
      alert("Error updating todo. Please check your connection.");
    }
  };

  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/todos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setTodos(todos.filter((todo) => todo.id !== id));
      } else {
        alert("Failed to delete todo. Please try again.");
      }
    } catch (error) {
      alert("Error deleting todo. Please check your connection.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-purple-600 mb-4">
          Your Todos
        </h2>
        <p className="text-gray-500">Loading todos...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-purple-600">Your Todos</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-purple-500 text-white px-3 py-1 rounded-md hover:bg-purple-600 text-sm"
        >
          {showAddForm ? "Cancel" : "+ Add Todo"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={addTodo} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Enter a new todo (e.g., Set up 1:1 with mentor)"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-sm"
            >
              Add
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {todos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No todos yet!</p>
            <p className="text-sm text-gray-400">
              Click "Add Todo" to create your first task
            </p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center gap-3 p-3 rounded-md border ${
                todo.completed
                  ? "bg-gray-50 border-gray-200"
                  : "bg-white border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id, todo.completed)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span
                className={`flex-1 text-sm ${
                  todo.completed
                    ? "line-through text-gray-500"
                    : "text-gray-700"
                }`}
              >
                {todo.title}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-red-500 hover:text-red-700 text-sm px-2 py-1"
                title="Delete todo"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {todos.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          {todos.filter((todo) => !todo.completed).length} of {todos.length}{" "}
          tasks remaining
        </div>
      )}
    </div>
  );
};

export default TodoList;
