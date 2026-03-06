const Store = {
  data: {
    tasks: [],
    subjects: [
      { id: '1', name: 'Mathematics', color: 'var(--color-blue)' },
      { id: '2', name: 'Science', color: 'var(--color-green)' },
      { id: '3', name: 'History', color: 'var(--color-yellow)' }
    ],
    exams: [],
    stats: {
      streak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      totalCompleted: 0
    },
    theme: 'light'
  },

  init() {
    const savedData = localStorage.getItem('studyPlannerData');
    if (savedData) {
      this.data = JSON.parse(savedData);
      if (this.data.stats.longestStreak === undefined) {
         this.data.stats.longestStreak = this.data.stats.streak || 0;
      }
    } else {
      this.save();
    }
    
    // Check and update streak logic
    this.updateStreak();
  },

  save() {
    localStorage.setItem('studyPlannerData', JSON.stringify(this.data));
    // Trigger a custom event when store updates so UI can react
    window.dispatchEvent(new Event('storeUpdated'));
  },

  // Subjects
  getSubjects() {
    return this.data.subjects;
  },
  
  getSubjectById(id) {
    return this.data.subjects.find(s => s.id === id);
  },

  addSubject(name, color) {
    const newSubject = {
      id: Date.now().toString(),
      name,
      color
    };
    this.data.subjects.push(newSubject);
    this.save();
    return newSubject;
  },

  // Tasks
  getTasks() {
    return this.data.tasks;
  },

  getTasksForToday() {
    const today = new Date().toISOString().split('T')[0];
    return this.data.tasks.filter(t => t.deadline === today || (t.deadline < today && !t.completed));
  },

  addTask(title, subjectId, deadline, priority) {
    const newTask = {
      id: Date.now().toString(),
      title,
      subjectId,
      deadline,
      priority, // 'low', 'medium', 'high'
      completed: false,
      completedAt: null
    };
    this.data.tasks.push(newTask);
    this.save();
    return newTask;
  },

  editTask(id, title, subjectId, deadline, priority) {
    const task = this.data.tasks.find(t => t.id === id);
    if (task) {
      task.title = title;
      task.subjectId = subjectId;
      task.deadline = deadline;
      task.priority = priority;
      this.save();
      return task;
    }
    return null;
  },

  toggleTaskCompletion(id) {
    const task = this.data.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString().split('T')[0] : null;
      
      if (task.completed) {
        this.data.stats.totalCompleted++;
        this.updateStreakOnCompletion();
      } else {
        this.data.stats.totalCompleted--;
      }
      
      this.save();
    }
  },

  deleteTask(id) {
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    this.save();
  },

  getWeeklyCompletionData() {
    const days = [];
    const counts = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Generate last 7 days labels
    for (let i = 6; i >= 0; i--) {
       const d = new Date(today);
       d.setDate(d.getDate() - i);
       const dateStr = d.toISOString().split('T')[0];
       
       // Format for chart label e.g., "Mon"
       const label = d.toLocaleDateString(undefined, { weekday: 'short' });
       days.push(label);
       
       // Count completed tasks for this specific day
       const count = this.data.tasks.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(dateStr)).length;
       counts.push(count);
    }
    
    return { labels: days, data: counts };
  },

  // Exams
  getExams() {
    return this.data.exams;
  },

  addExam(title, subjectId, date) {
    const newExam = {
      id: Date.now().toString(),
      title,
      subjectId,
      date
    };
    this.data.exams.push(newExam);
    this.data.exams.sort((a, b) => new Date(a.date) - new Date(b.date));
    this.save();
    return newExam;
  },

  // Streaks & Stats
  updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = this.data.stats.lastStudyDate;
    
    if (!lastDate) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If last study date wasn't today or yesterday, streak breaks
    if (lastDate !== today && lastDate !== yesterdayStr) {
      this.data.stats.streak = 0;
      this.save();
    }
  },

  updateStreakOnCompletion() {
    const today = new Date().toISOString().split('T')[0];
    
    if (this.data.stats.lastStudyDate !== today) {
      // If last study day was yesterday, increment streak
      if (this.data.stats.lastStudyDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (this.data.stats.lastStudyDate === yesterdayStr) {
          this.data.stats.streak++;
        } else {
           // Streak broken, start new
          this.data.stats.streak = 1;
        }
      } else {
        // First time
        this.data.stats.streak = 1;
      }
      
      this.data.stats.lastStudyDate = today;
    }

    if (this.data.stats.streak > (this.data.stats.longestStreak || 0)) {
      this.data.stats.longestStreak = this.data.stats.streak;
    }
  },

  // Theme
  toggleTheme() {
    this.data.theme = this.data.theme === 'light' ? 'dark' : 'light';
    this.save();
    return this.data.theme;
  }
};

// Initialize
Store.init();
