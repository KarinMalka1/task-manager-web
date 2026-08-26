import { useState, useEffect } from 'react'

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// כתובת השרת שלך בענן
const API_URL = '[https://task-manager-web-3bu4.onrender.com](https://task-manager-web-3bu4.onrender.com)';

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
  const [tasks, setTasks] = useState([])
  const [inputs, setInputs] = useState({})
  const [weekDates, setWeekDates] = useState([])

  useEffect(() => {
    setWeekDates(getWeekDates());

    // טעינת משימות מהשרת (מוסיפים /tasks לפי נתיב ה-API שלך)
    fetch(`${API_URL}/tasks`)
      .then(response => response.json())
      .then(data => setTasks(data))
      .catch(err => console.error("Error fetching tasks:", err));
  }, [])

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

    fetch(`${API_URL}/tasks`, {
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
    fetch(`${API_URL}/tasks`, { method: 'DELETE' })
      .then(() => {
        setTasks([]);
      })
      .catch(err => console.error("Error resetting tasks:", err));
  }

  return (
    <div style={{ padding: '30px 20px', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', direction: 'rtl' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '25px', width: '100%' }}>
        <h1 style={{ margin: 0, fontFamily: 'Caveat, cursive', fontSize: '70px', color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>
          מנהל המשימות השבועי שלי
        </h1>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', width: '100%' }}>
        {DAYS.map((day, index) => (
          <div key={day} style={{ backgroundColor: 'rgba(255, 255, 255, 0.93)', padding: '12px', borderRadius: '12px', boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
            
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', width: '100%', marginTop: '35px', marginBottom: '30px' }}>
        <div style={{ gridColumn: '4', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={resetAllTasks}
            style={{ padding: '12px 28px', backgroundColor: 'rgb(175, 71, 255)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', whiteSpace: 'nowrap', marginRight: '25px' }}
          >
            איפוס שבוע
          </button>
        </div>
      </div>
    </div>
  )
}

export default App