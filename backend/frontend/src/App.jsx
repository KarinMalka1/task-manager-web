import { useState } from 'react'

function App() {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'להרים שרת פייתון - בוצע!', completed: true },
    { id: 2, title: 'להקים סביבת React - בוצע!', completed: true },
    { id: 3, title: 'לחבר בין השרת ללקוח', completed: false }
  ])

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>מנהל המשימות שלי</h1>
      
      <div style={{ marginTop: '20px' }}>
        {tasks.map(task => (
          <div key={task.id} style={{ margin: '10px 0', fontSize: '18px' }}>
            <input 
              type="checkbox" 
              checked={task.completed} 
              readOnly 
              style={{ marginRight: '10px', marginLeft: '10px' }}
            />
            <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
              {task.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App