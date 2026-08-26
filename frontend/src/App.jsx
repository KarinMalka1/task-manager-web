import { useState, useEffect } from 'react'

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// כתובת השרת שלך בענן (או http://localhost:8000 לבדיקה מקומית)
const API_URL = 'https://task-manager-web-3bu4.onrender.com';

const getWeekDates = () => {
  const today = new Date();
  const currentDayOfWeek = today.getDay(); 
  
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - currentDayOfWeek);

  return DAYS.map((_, index) => {
    const dayDate = new Date(sunday);
    dayDate.setDate(sunday.getDate() + index);
    return dayDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
  });
};

function App() {
  // מצב משתמש מחובר (נטען מ-localStorage אם קיים)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('task_manager_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // מצבי טופס התחברות / הרשמה
  const [isRegistering, setIsRegistering] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [tasks, setTasks] = useState([]);
  const [inputs, setInputs] = useState({});
  const [weekDates, setWeekDates] = useState([]);

  // טעינת תאריכי השבוע ומשימות של המשתמש המחובר
  useEffect(() => {
    setWeekDates(getWeekDates());
    if (user) {
      fetch(`${API_URL}/tasks/${user.user_id}`)
        .then(response => response.json())
        .then(data => setTasks(data))
        .catch(err => console.error("Error fetching tasks:", err));
    }
  }, [user]);

  // פונקציית התחברות / הרשמה
  const handleAuth = (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isRegistering ? '/register' : '/login';

    fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'שגיאה בתהליך');
      return data;
    })
    .then(data => {
      const userData = { user_id: data.user_id, username: data.username };
      setUser(userData);
      localStorage.setItem('task_manager_user', JSON.stringify(userData));
      setUsernameInput('');
      setPasswordInput('');
    })
    .catch(err => {
      setAuthError(err.message);
    });
  };

  // התנתקות
  const handleLogout = () => {
    setUser(null);
    setTasks([]);
    localStorage.removeItem('task_manager_user');
  };

  const handleInputChange = (day, value) => {
    setInputs({ ...inputs, [day]: value });
  }

  const addTask = (day) => {
    const title = inputs[day];
    if (!title) return;

    const newTask = {
      title: title,
      completed: false,
      day: day
    };

    fetch(`${API_URL}/tasks/${user.user_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    })
    .then(response => response.json())
    .then(data => {
      setTasks([...tasks, data]);
      setInputs({ ...inputs, [day]: '' });
    })
    .catch(err => console.error("Error adding task:", err));
  }

  const toggleTask = (taskToToggle) => {
    const updatedTask = { ...taskToToggle, completed: !taskToToggle.completed };

    fetch(`${API_URL}/tasks/${taskToToggle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTask)
    })
    .then(response => response.json())
    .then(data => {
      setTasks(tasks.map(task => task.id === data.id ? data : task));
    })
    .catch(err => console.error("Error updating task:", err));
  }
  
  const deleteTask = (taskId) => {
    fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
    })
    .then(() => {
      setTasks(tasks.filter(task => task.id !== taskId));
    })
    .catch(err => console.error("Error deleting task:", err));
  }

  const resetAllTasks = () => {
    fetch(`${API_URL}/tasks/user/${user.user_id}`, { method: 'DELETE' })
      .then(() => {
        setTasks([]);
      })
      .catch(err => console.error("Error resetting tasks:", err));
  }

  // --- אם המשתמש לא מחובר, נציג מסך התחברות / הרשמה עיצובי ---
  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', direction: 'rtl', padding: '20px', boxSizing: 'border-box' }}>
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '30px', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          
          <h1 style={{ fontFamily: 'Caveat, cursive', fontSize: '45px', color: '#7337cb', marginBottom: '10px' }}>
            מנהל המשימות שלי
          </h1>
          <p style={{ color: '#666', marginBottom: '25px', fontSize: '15px' }}>
            {isRegistering ? 'צור חשבון חדש כדי לסנכרן משימות' : 'התחבר כדי לראות את המשימות שלך'}
          </p>

          {authError && (
            <div style={{ backgroundColor: '#ffe6e6', color: '#d63031', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="text" 
              placeholder="שם משתמש"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '15px', textAlign: 'right' }}
            />
            <input 
              type="password" 
              placeholder="סיסמה"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '15px', textAlign: 'right' }}
            />
            <button 
              type="submit"
              style={{ padding: '12px', backgroundColor: '#aa3bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 10px rgba(170,59,255,0.3)' }}
            >
              {isRegistering ? 'הירשם' : 'התחבר'}
            </button>
          </form>

          <p style={{ marginTop: '20px', fontSize: '14px', color: '#555' }}>
            {isRegistering ? 'כבר יש לך חשבון?' : 'עדיין אין לך חשבון?'} {' '}
            <span 
              onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
              style={{ color: '#aa3bff', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
            >
              {isRegistering ? 'התחבר כאן' : 'הירשם עכשיו'}
            </span>
          </p>

        </div>
      </div>
    );
  }

  // --- אם המשתמש מחובר, נציג את האפליקציה הרגילה עם כפתור התנתקות ---
  return (
    <div style={{ padding: '30px 20px', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', direction: 'rtl' }}>
      
      {/* סרגל עליון: ברכה למשתמש + כפתור התנתקות */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '0 10px' }}>
        <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          שלום, {user.username} 👋
        </span>
        <button 
          onClick={handleLogout}
          style={{ padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid white', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
        >
          התנתק
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '25px', width: '100%' }}>
        <h1 style={{ margin: 0, fontFamily: 'Caveat, cursive', fontSize: '70px', color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>
          מנהל המשימות השבועי שלי
        </h1>
      </div>
      
      <div className="days-grid">
        {DAYS.map((day, index) => (
          <div key={day} style={{ backgroundColor: 'rgba(255, 255, 255, 0.93)', padding: '12px', borderRadius: '12px', boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)', display: 'flex', flexDirection: 'column', minHeight: '400px', marginBottom: '10px' }}>
            
            <div style={{ textAlign: 'center', borderBottom: '2px solid #e5e4e7', paddingBottom: '8px', marginBottom: '10px' }}>
              <h3 style={{ margin: '0 0 2px 0', color: '#333', fontSize: '17px' }}>
                {day}
              </h3>
              <span style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}>
                {weekDates[index]}
              </span>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
              {tasks.filter(task => task.day === day).map(task => (
                <div key={task.id} style={{ margin: '6px 0', display: 'flex', alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'flex-end', backgroundColor: '#fff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e5e4e7' }}>
                  <input 
                    type="checkbox" 
                    checked={task.completed} 
                    onChange={() => toggleTask(task)}
                    style={{ cursor: 'pointer', marginLeft: '8px', marginRight: '0px' }}
                  />
                  <span style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#888' : '#000', fontSize: '14px', wordBreak: 'break-word', textAlign: 'right', flex: 1 }}>
                    {task.title}
                  </span>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '0 4px', color: '#ff4757' }}
                    title="מחק משימה"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
              <input 
                type="text" 
                dir="rtl"
                value={inputs[day] || ''}
                onChange={(e) => handleInputChange(day, e.target.value)}
                placeholder="משימה..."
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px', fontFamily: 'inherit', textAlign: 'right' }}
              />
              <button 
                onClick={() => addTask(day)}
                style={{ padding: '8px', backgroundColor: '#aa3bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                הוסף
              </button>
            </div>

          </div>
        ))}
      </div>

      <div className="reset-section">
        <div className="reset-button-wrapper">
          <button 
            onClick={resetAllTasks}
            style={{ padding: '12px 28px', backgroundColor: 'rgb(175, 71, 255)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}
          >
            איפוס שבוע
          </button>
        </div>
      </div>
    </div>
  )
}

export default App