const UIComponents = {
  
  createSubjectCard(subject) {
    const el = document.createElement('div');
    el.className = 'subject-card';
    el.style.borderLeft = `6px solid ${subject.color}`;
    
    // Count tasks for this subject
    const tasksCount = Store.getTasks().filter(t => t.subjectId === subject.id).length;
    
    el.innerHTML = `
      <h3 style="color: ${subject.color}">${subject.name}</h3>
      <p class="text-muted" style="margin-top: 8px;">${tasksCount} Tasks</p>
    `;
    return el;
  },

  createTaskItem(task, subjects, highlight = false) {
    const subject = subjects.find(s => s.id === task.subjectId);
    const subjectName = subject ? subject.name : 'No Subject';
    const subjectColor = subject ? subject.color : 'var(--text-muted)';
    
    const el = document.createElement('div');
    el.className = `task-item ${task.completed ? 'completed' : ''} ${highlight ? 'highlighted-task' : ''}`;
    
    const priorityClass = `priority-${task.priority}`;
    
    // Format date string
    let dateStr = 'No deadline';
    if(task.deadline) {
        const d = new Date(task.deadline);
        dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    el.innerHTML = `
      <div class="task-item-header">
        <div class="task-checkbox" data-id="${task.id}">
          <i class="ri-check-line"></i>
        </div>
        <div class="task-actions">
          <button class="btn btn-text btn-edit-task" data-id="${task.id}" title="Edit Task">
            <i class="ri-pencil-line"></i>
          </button>
          <button class="btn btn-text btn-delete-task" data-id="${task.id}" title="Delete Task">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>
      <div class="task-info">
        <div class="task-title">${task.title}</div>
        <div class="task-meta">
          <span style="color: ${subjectColor}">
            <i class="ri-book-2-line"></i> ${subjectName}
          </span>
          <div class="task-meta-row">
            <span>
              <i class="ri-calendar-event-line"></i> ${dateStr}
            </span>
            <span class="badge ${priorityClass}" style="margin-left: auto;">${task.priority}</span>
          </div>
        </div>
      </div>
    `;

    return el;
  },

  createExamCard(exam, subjects) {
    const subject = subjects.find(s => s.id === exam.subjectId);
    const subjectName = subject ? subject.name : 'General';
    const subjectColor = subject ? subject.color : 'var(--primary)';

    const examDate = new Date(exam.date);
    const today = new Date();
    const diffTime = Math.abs(examDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let timeText = diffDays === 1 ? '1 day' : `${diffDays} days`;
    if(examDate < today) timeText = "Past";

    const el = document.createElement('div');
    el.className = 'exam-card';
    el.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span class="badge" style="background-color: ${subjectColor}20; color: ${subjectColor}">${subjectName}</span>
        <span class="badge" style="background-color: var(--danger-bg); color: var(--danger)">${timeText} Left</span>
      </div>
      <h3>${exam.title}</h3>
      <p class="text-muted" style="margin-top: 8px;">
        <i class="ri-calendar-event-line"></i> ${examDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
      </p>
    `;
    return el;
  },

  getSmartSuggestion(tasks) {
    if(!tasks || tasks.length === 0) return { title: "No pending tasks!", text: "You're all caught up for now.", task: null };

    const upcoming = tasks.filter(t => !t.completed);
    if(upcoming.length === 0) return { title: "Great Job!", text: "All tasks completed! Take a break.", task: null };

    // Sort by priority and deadline
    const priorityWeight = { 'high': 3, 'medium': 2, 'low': 1 };
    
    upcoming.sort((a, b) => {
      // High priority first
      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      // Then closest deadline
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });

    const topTask = upcoming[0];
    const subject = Store.getSubjectById(topTask.subjectId);
    const subjectName = subject ? subject.name : 'General';
    
    let timeReason = "soon";
    if (topTask.deadline) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const deadlineDate = new Date(topTask.deadline);
        deadlineDate.setHours(0,0,0,0);
        
        const diffDays = Math.round((deadlineDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) timeReason = "today";
        else if (diffDays === 1) timeReason = "tomorrow";
        else if (diffDays < 0) timeReason = "past due";
        else timeReason = `in ${diffDays} days`;
    }

    return {
      title: "Recommended Task to Study Next",
      text: `You should study <strong>${subjectName} - ${topTask.title}</strong> because its deadline is ${timeReason}.`,
      task: topTask
    };
  },

  getMotivationMessage(completedTasks, totalTasks) {
    if (totalTasks === 0) {
      return "You have no tasks scheduled for today. Take a break or plan ahead!";
    }

    const percentage = completedTasks / totalTasks;

    if (percentage === 0) {
      return "Start small today. Completing one task builds momentum.";
    } else if (percentage < 0.5) {
      return "You're off to a great start! Keep the focus going.";
    } else if (percentage < 1) {
      return "Great job! You're making excellent progress today. Almost there!";
    } else {
      return "Incredible! You've crushed all your goals for today. Time to relax and recharge.";
    }
  }

};
