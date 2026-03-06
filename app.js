const App = {
  currentView: 'dashboard',
  timer: null,

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.initTimer();
    this.applyTheme(Store.data.theme);
    this.render();

    // Listen to store updates to re-render UI
    window.addEventListener('storeUpdated', () => this.render());
  },

  cacheDOM() {
    this.pageTitle = document.getElementById('page-title');
    this.navItems = document.querySelectorAll('.nav-item[data-view]');
    this.views = document.querySelectorAll('.view');
    this.themeToggle = document.getElementById('theme-toggle');
    this.modalContainer = document.getElementById('modal-container');
    
    // Headers & Stats
    this.headerStreak = document.getElementById('header-streak-count');
    this.progressStreak = document.getElementById('progress-streak-count');
    this.totalCompleted = document.getElementById('total-completed-tasks');
    
    // Containers
    this.dashboardTasks = document.getElementById('dashboard-tasks');
    this.subjectsGrid = document.getElementById('subjects-grid');
    this.allTasksList = document.getElementById('all-tasks-list');
    this.examsGrid = document.getElementById('exams-grid');
    
    // Dashboard Progress
    this.progressText = document.getElementById('progress-text');
    this.dailyProgress = document.getElementById('daily-progress');
    this.progressPercentage = document.getElementById('progress-percentage');
    this.statTotal = document.getElementById('stat-total');
    this.statCompleted = document.getElementById('stat-completed');
    this.statPending = document.getElementById('stat-pending');
    
    // Dash Streak & Exams
    this.dashCurrentStreak = document.getElementById('dash-current-streak');
    this.dashLongestStreak = document.getElementById('dash-longest-streak');
    this.dashboardExams = document.getElementById('dashboard-exams');
    
    // AI Banner
    this.aiBanner = document.getElementById('ai-suggestion-container');
    this.aiText = document.getElementById('ai-suggestion-text');

    // Motivation Banner
    this.motivationText = document.getElementById('motivation-text');

    // Chart
    this.chartCanvas = document.getElementById('weekly-chart');
    this.progressChart = null;

    // Buttons
    this.btnAddSubject = document.getElementById('btn-add-subject');
    this.btnAddTask = document.getElementById('btn-add-task');
    this.btnAddExam = document.getElementById('btn-add-exam');
    
    // Filters
    this.taskFilters = document.querySelectorAll('.filter-btn');
    this.filterSubject = document.getElementById('filter-subject');
    this.sortTasks = document.getElementById('sort-tasks');
    this.currentTaskFilter = 'all';
    this.currentSubjectFilter = 'all';
    this.currentSort = 'deadline';
  },

  bindEvents() {
    // Navigation
    this.navItems.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });

    // Theme
    this.themeToggle.addEventListener('click', () => {
      const newTheme = Store.toggleTheme();
      this.applyTheme(newTheme);
    });

    // Modals
    this.btnAddSubject.addEventListener('click', () => this.showAddSubjectModal());
    this.btnAddTask.addEventListener('click', () => this.showAddTaskModal());
    this.btnAddExam.addEventListener('click', () => this.showAddExamModal());

    // Task Filters
    this.taskFilters.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.taskFilters.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentTaskFilter = e.currentTarget.dataset.filter;
        this.renderTasksView();
      });
    });

    if (this.filterSubject) {
      this.filterSubject.addEventListener('change', (e) => {
        this.currentSubjectFilter = e.target.value;
        this.renderTasksView();
      });
    }

    if (this.sortTasks) {
      this.sortTasks.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.renderTasksView();
      });
    }

    // Global Event Delegation for dynamic elements
    document.addEventListener('click', (e) => {
      // Toggle Task Completion
      const checkbox = e.target.closest('.task-checkbox');
      if (checkbox) {
        Store.toggleTaskCompletion(checkbox.dataset.id);
      }
      
      // Delete Task
      const btnDelete = e.target.closest('.btn-delete-task');
      if (btnDelete) {
         if(confirm("Are you sure you want to delete this task?")) {
            Store.deleteTask(btnDelete.dataset.id);
         }
      }

      // Edit Task
      const btnEdit = e.target.closest('.btn-edit-task');
      if (btnEdit) {
        this.showEditTaskModal(btnEdit.dataset.id);
      }
      
      // Close Modal
      if(e.target.classList.contains('modal-overlay') || e.target.classList.contains('btn-cancel')) {
         this.closeModal();
      }
    });
  },

  initTimer() {
    this.timer = new PomodoroTimer('timer-display', 'timer-ring');
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    const resetBtn = document.getElementById('timer-reset');

    startBtn.addEventListener('click', () => {
      this.timer.start();
      startBtn.classList.add('hidden');
      pauseBtn.classList.remove('hidden');
    });

    pauseBtn.addEventListener('click', () => {
      this.timer.pause();
      pauseBtn.classList.add('hidden');
      startBtn.classList.remove('hidden');
    });

    resetBtn.addEventListener('click', () => {
      this.timer.reset();
      pauseBtn.classList.add('hidden');
      startBtn.classList.remove('hidden');
    });
  },

  applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark-mode');
      this.themeToggle.innerHTML = '<i class="ri-sun-line"></i> <span>Light Mode</span>';
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
      this.themeToggle.innerHTML = '<i class="ri-moon-line"></i> <span>Dark Mode</span>';
    }
    
    // Update chart colors if chart exists and we are on dashboard
    if (this.currentView === 'dashboard') {
        this.renderChart();
    }
  },

  switchView(viewName) {
    this.currentView = viewName;
    
    // Update Sidebar
    this.navItems.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update Main Content
    this.views.forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(`view-${viewName}`).classList.add('active');

    // Update Title
    const titles = {
      dashboard: "Dashboard",
      subjects: "Subjects",
      tasks: "Study Tasks",
      exams: "Upcoming Exams",
      progress: "Your Progress"
    };
    this.pageTitle.textContent = titles[viewName];
    
    this.render();
  },

  render() {
    this.updateStats();
    
    if (this.currentView === 'dashboard') {
      this.renderDashboard();
    } else if (this.currentView === 'subjects') {
      this.renderSubjects();
    } else if (this.currentView === 'tasks') {
      this.renderTasksView();
    } else if (this.currentView === 'exams') {
      this.renderExams();
    } else if (this.currentView === 'progress') {
      // Progress stats are updated via updateStats()
    }
  },

  updateStats() {
    this.headerStreak.textContent = Store.data.stats.streak;
    this.progressStreak.textContent = Store.data.stats.streak;
    this.totalCompleted.textContent = Store.data.stats.totalCompleted;
    if (this.dashCurrentStreak) this.dashCurrentStreak.textContent = Store.data.stats.streak;
    if (this.dashLongestStreak) this.dashLongestStreak.textContent = Store.data.stats.longestStreak || 0;
  },

  renderDashboard() {
    const todayTasks = Store.getTasksForToday();
    const completedToday = todayTasks.filter(t => t.completed).length;
    const totalToday = todayTasks.length;
    const pendingToday = totalToday - completedToday;
    
    // Progress Bar
    this.progressText.textContent = `${completedToday} / ${totalToday} Tasks Completed`;
    const percentage = totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);
    this.dailyProgress.style.width = `${percentage}%`;
    this.progressPercentage.textContent = `${percentage}%`;
    
    // Motivation
    if (this.motivationText) {
       this.motivationText.textContent = UIComponents.getMotivationMessage(completedToday, totalToday);
    }

    // Mini Stats
    if(this.statTotal) this.statTotal.textContent = totalToday;
    if(this.statCompleted) this.statCompleted.textContent = completedToday;
    if(this.statPending) this.statPending.textContent = pendingToday;

    // Tasks List
    this.dashboardTasks.innerHTML = '';
    if (todayTasks.length === 0) {
      this.dashboardTasks.innerHTML = '<p class="text-muted">No pending tasks for today!</p>';
    } else {
      const displayTasks = todayTasks.slice(0, 5); // Show only top 5
      displayTasks.forEach(task => {
        this.dashboardTasks.appendChild(UIComponents.createTaskItem(task, Store.getSubjects()));
      });
    }

    // AI Suggestion
    const suggestion = UIComponents.getSmartSuggestion(Store.getTasks());
    this.aiBanner.classList.remove('hidden');
    const aiTitle = this.aiBanner.querySelector('h3');
    aiTitle.textContent = suggestion.title;
    this.aiText.innerHTML = suggestion.text;
    
    // Check if there is an existing injected highlighted task and remove it
    const existingHighlight = this.aiBanner.querySelector('.task-item');
    if (existingHighlight) existingHighlight.remove();

    if (suggestion.task) {
       const highlightedCard = UIComponents.createTaskItem(suggestion.task, Store.getSubjects(), true);
       highlightedCard.style.marginTop = '16px'; // Space from text
       highlightedCard.style.width = '100%'; // Full width inside banner
       
       // Append it inside the ai-content div
       this.aiBanner.querySelector('.ai-content').appendChild(highlightedCard);
    }

    // Exams List on Dashboard
    if (this.dashboardExams) {
      this.dashboardExams.innerHTML = '';
      const upcomingExams = Store.getExams().filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0)).sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0, 3);
      if (upcomingExams.length === 0) {
        this.dashboardExams.innerHTML = '<p class="text-muted" style="grid-column: 1 / -1;">No upcoming exams. You have time to relax!</p>';
      } else {
        upcomingExams.forEach(exam => {
          this.dashboardExams.appendChild(UIComponents.createExamCard(exam, Store.getSubjects()));
        });
      }
    }
    
    this.renderChart();
  },

  renderChart() {
    if (!this.chartCanvas) return;
    
    const chartData = Store.getWeeklyCompletionData();
    const isDark = Store.data.theme === 'dark';
    
    // Theme aware colors
    const textColor = isDark ? '#a3aed0' : '#a3aed0';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const primaryColor = isDark ? '#7551ff' : '#4318ff';
    const primaryBg = isDark ? 'rgba(117, 81, 255, 0.2)' : 'rgba(67, 24, 255, 0.2)';

    if (this.progressChart) {
        this.progressChart.destroy();
    }

    const ctx = this.chartCanvas.getContext('2d');
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, primaryBg);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    this.progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Tasks Completed',
                data: chartData.data,
                borderColor: primaryColor,
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: primaryColor,
                pointBorderColor: isDark ? '#111c44' : '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4 // Smooth curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#0b1437' : '#ffffff',
                    titleColor: isDark ? '#ffffff' : '#2b3674',
                    bodyColor: isDark ? '#a3aed0' : '#64748b',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    titleFont: { family: 'Inter', size: 13 },
                    bodyFont: { family: 'Inter', size: 14, weight: 'bold' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        font: { family: 'Inter', size: 12 },
                        stepSize: 1,
                        precision: 0
                    },
                    grid: { color: gridColor, drawBorder: false }
                },
                x: {
                    ticks: { color: textColor, font: { family: 'Inter', size: 12 } },
                    grid: { display: false, drawBorder: false }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });
  },

  renderSubjects() {
    this.subjectsGrid.innerHTML = '';
    Store.getSubjects().forEach(sub => {
      this.subjectsGrid.appendChild(UIComponents.createSubjectCard(sub));
    });
  },

  renderTasksView() {
    // Populate Subject Filter if empty
    if (this.filterSubject && this.filterSubject.options.length <= 1) {
      this.filterSubject.innerHTML = '<option value="all">All Subjects</option>';
      Store.getSubjects().forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        this.filterSubject.appendChild(opt);
      });
      this.filterSubject.value = this.currentSubjectFilter;
    }

    this.allTasksList.innerHTML = '';
    let tasks = Store.getTasks();
    
    // 1. Filter by Completion status
    if (this.currentTaskFilter === 'pending') {
      tasks = tasks.filter(t => !t.completed);
    } else if (this.currentTaskFilter === 'completed') {
      tasks = tasks.filter(t => t.completed);
    }

    // 2. Filter by Subject
    if (this.currentSubjectFilter !== 'all') {
      tasks = tasks.filter(t => t.subjectId === this.currentSubjectFilter);
    }

    // 3. Sort
    if (this.currentSort === 'deadline') {
        tasks.sort((a,b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        });
    } else if (this.currentSort === 'priority') {
        const w = {high: 3, medium: 2, low: 1};
        tasks.sort((a,b) => w[b.priority] - w[a.priority]);
    }

    if (tasks.length === 0) {
      this.allTasksList.innerHTML = '<p class="text-muted" style="grid-column: 1 / -1;">No tasks found matching your criteria.</p>';
      return;
    }

    tasks.forEach(task => {
      this.allTasksList.appendChild(UIComponents.createTaskItem(task, Store.getSubjects()));
    });
  },
  
  renderExams() {
     this.examsGrid.innerHTML = '';
     Store.getExams().forEach(exam => {
        this.examsGrid.appendChild(UIComponents.createExamCard(exam, Store.getSubjects()));
     });
  },

  // Modals
  closeModal() {
    this.modalContainer.classList.add('hidden');
    this.modalContainer.innerHTML = '';
  },

  showAddSubjectModal() {
    this.modalContainer.innerHTML = `
      <div class="modal-card">
        <h2>Add Subject</h2>
        <div class="form-group" style="margin-top:20px;">
          <label class="form-label">Subject Name</label>
          <input type="text" id="modal-subject-name" class="form-control" placeholder="e.g. Mathematics">
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <select id="modal-subject-color" class="form-control">
            <option value="var(--color-blue)">Blue</option>
            <option value="var(--color-red)">Red</option>
            <option value="var(--color-green)">Green</option>
            <option value="var(--color-yellow)">Yellow</option>
            <option value="var(--color-purple)">Purple</option>
            <option value="var(--color-pink)">Pink</option>
          </select>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-save-subject">Save Subject</button>
        </div>
      </div>
    `;
    this.modalContainer.classList.remove('hidden');
    
    document.getElementById('btn-save-subject').addEventListener('click', () => {
      const name = document.getElementById('modal-subject-name').value.trim();
      const color = document.getElementById('modal-subject-color').value;
      if (name) {
        Store.addSubject(name, color);
        this.closeModal();
      }
    });
  },

  showAddTaskModal() {
     const subjects = Store.getSubjects();
     const options = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
     
     const today = new Date().toISOString().split('T')[0];

     this.modalContainer.innerHTML = `
      <div class="modal-card">
        <h2>Add Task</h2>
        <div class="form-group" style="margin-top:20px;">
          <label class="form-label">Task Title</label>
          <input type="text" id="modal-task-title" class="form-control" placeholder="e.g. Read Chapter 5">
        </div>
        <div class="form-group">
          <label class="form-label">Subject</label>
          <select id="modal-task-subject" class="form-control">
             ${options}
          </select>
        </div>
        <div style="display: flex; gap: 16px;">
            <div class="form-group" style="flex: 1;">
               <label class="form-label">Deadline</label>
               <input type="date" id="modal-task-deadline" class="form-control" value="${today}">
            </div>
            <div class="form-group" style="flex: 1;">
               <label class="form-label">Priority</label>
               <select id="modal-task-priority" class="form-control">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
               </select>
            </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-save-task">Save Task</button>
        </div>
      </div>
    `;
    this.modalContainer.classList.remove('hidden');

    document.getElementById('btn-save-task').addEventListener('click', () => {
      const title = document.getElementById('modal-task-title').value.trim();
      const subjectId = document.getElementById('modal-task-subject').value;
      const deadline = document.getElementById('modal-task-deadline').value;
      const priority = document.getElementById('modal-task-priority').value;

      if (title && subjectId && deadline) {
        Store.addTask(title, subjectId, deadline, priority);
        this.closeModal();
      } else {
         alert("Please fill in all fields.");
      }
    });
  },

  showEditTaskModal(taskId) {
     const task = Store.getTasks().find(t => t.id === taskId);
     if (!task) return;

     const subjects = Store.getSubjects();
     const options = subjects.map(s => `<option value="${s.id}" ${s.id === task.subjectId ? 'selected' : ''}>${s.name}</option>`).join('');
     
     this.modalContainer.innerHTML = `
      <div class="modal-card">
        <h2>Edit Task</h2>
        <div class="form-group" style="margin-top:20px;">
          <label class="form-label">Task Title</label>
          <input type="text" id="modal-task-title" class="form-control" value="${task.title}">
        </div>
        <div class="form-group">
          <label class="form-label">Subject</label>
          <select id="modal-task-subject" class="form-control">
             ${options}
          </select>
        </div>
        <div style="display: flex; gap: 16px;">
            <div class="form-group" style="flex: 1;">
               <label class="form-label">Deadline</label>
               <input type="date" id="modal-task-deadline" class="form-control" value="${task.deadline}">
            </div>
            <div class="form-group" style="flex: 1;">
               <label class="form-label">Priority</label>
               <select id="modal-task-priority" class="form-control">
                  <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                  <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                  <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
               </select>
            </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-update-task">Update Task</button>
        </div>
      </div>
    `;
    this.modalContainer.classList.remove('hidden');

    document.getElementById('btn-update-task').addEventListener('click', () => {
      const title = document.getElementById('modal-task-title').value.trim();
      const subjectId = document.getElementById('modal-task-subject').value;
      const deadline = document.getElementById('modal-task-deadline').value;
      const priority = document.getElementById('modal-task-priority').value;

      if (title && subjectId && deadline) {
        Store.editTask(task.id, title, subjectId, deadline, priority);
        this.closeModal();
      } else {
         alert("Please fill in all fields.");
      }
    });
  },

  showAddExamModal() {
     const subjects = Store.getSubjects();
     const options = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
     
     this.modalContainer.innerHTML = `
      <div class="modal-card">
        <h2>Add Exam</h2>
        <div class="form-group" style="margin-top:20px;">
          <label class="form-label">Exam Title</label>
          <input type="text" id="modal-exam-title" class="form-control" placeholder="e.g. Midterm Test">
        </div>
        <div class="form-group">
          <label class="form-label">Subject</label>
          <select id="modal-exam-subject" class="form-control">
             ${options}
          </select>
        </div>
        <div class="form-group">
            <label class="form-label">Exam Date</label>
            <input type="date" id="modal-exam-date" class="form-control">
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-save-exam">Save Exam</button>
        </div>
      </div>
    `;
    this.modalContainer.classList.remove('hidden');

    document.getElementById('btn-save-exam').addEventListener('click', () => {
      const title = document.getElementById('modal-exam-title').value.trim();
      const subjectId = document.getElementById('modal-exam-subject').value;
      const date = document.getElementById('modal-exam-date').value;

      if (title && subjectId && date) {
        Store.addExam(title, subjectId, date);
        this.closeModal();
      } else {
         alert("Please fill in all fields.");
      }
    });
  }
};

// Expose app global for inline onclicks
window.app = App;

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
