from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import hashlib

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_NAME = "database.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    # טבלת משתמשים
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            completed BOOLEAN NOT NULL,
            day TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row  # מאפשר גישה לעמודות לפי שמות
    return conn

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class TaskCreate(BaseModel):
    title: str
    completed: bool = False
    day: str

class TaskResponse(BaseModel):
    id: int
    title: str
    completed: bool
    day: str



@app.post("/register")
def register(user: UserCreate):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (user.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="שם המשתמש כבר קיים במערכת")
    
    hashed_password = hashlib.sha256(user.password.encode()).hexdigest()
    
    cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (user.username, hashed_password))
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    
    return {"message": "ההרשמה בוצעה בהצלחה", "user_id": user_id, "username": user.username}

@app.post("/login")
def login(user: UserLogin):
    conn = get_db()
    cursor = conn.cursor()
    
    hashed_password = hashlib.sha256(user.password.encode()).hexdigest()
    cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (user.username, hashed_password))
    db_user = cursor.fetchone()
    conn.close()
    
    if not db_user:
        raise HTTPException(status_code=400, detail="שם משתמש או סיסמה שגויים")
    
    return {"message": "התחברת בהצלחה", "user_id": db_user["id"], "username": db_user["username"]}



@app.get("/tasks/{user_id}", response_model=List[TaskResponse])
def get_tasks(user_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, completed, day FROM tasks WHERE user_id = ?", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/tasks/{user_id}", response_model=TaskResponse)
def create_task(user_id: int, task: TaskCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO tasks (title, completed, day, user_id) VALUES (?, ?, ?, ?)",
        (task.title, task.completed, task.day, user_id)
    )
    conn.commit()
    task_id = cursor.lastrowid
    conn.close()
    
    return {
        "id": task_id,
        "title": task.title,
        "completed": task.completed,
        "day": task.day
    }

@app.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, updated_task: TaskCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE tasks SET title = ?, completed = ?, day = ? WHERE id = ?",
        (updated_task.title, updated_task.completed, updated_task.day, task_id)
    )
    conn.commit()
    conn.close()
    
    return {
        "id": task_id,
        "title": updated_task.title,
        "completed": updated_task.completed,
        "day": updated_task.day
    }

@app.delete("/tasks/user/{user_id}")
def reset_tasks(user_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()
    return {"message": "All user tasks reset"}

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return {"message": "Task deleted successfully"}
